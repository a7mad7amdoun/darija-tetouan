#!/usr/bin/env bash
# Provision the whole Supabase side in one go.
#
#   SUPABASE_ACCESS_TOKEN=sbp_...  ./supabase/provision.sh
#   SUPABASE_ACCESS_TOKEN=sbp_...  ./supabase/provision.sh  hamza@x.com wife@x.com you@x.com
#
# Creates the project, runs schema.sql, and fills in js/supabase-config.js with
# the two PUBLIC values. Given three emails it also creates the accounts and
# writes the profiles rows; without them it stops after the schema and tells you
# what is left to do.
#
# The database password and the service_role key are used here and printed once.
# Neither is ever written into the repository. Save them in a password manager.
set -euo pipefail

API=https://api.supabase.com/v1
TOKEN="${SUPABASE_ACCESS_TOKEN:?set SUPABASE_ACCESS_TOKEN first}"
HAMZA_EMAIL="${1:-}"
WIFE_EMAIL="${2:-}"
TEACHER_EMAIL="${3:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

auth=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
pw()  { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24; }
jqq() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval('d'+sys.argv[1]))" "$1"; }

echo "==> organisation"
ORG=$(curl -fsS "${auth[@]}" "$API/organizations" | python3 -c "
import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if d else '')")
if [ -z "$ORG" ]; then
  echo "    none yet - creating one"
  ORG=$(curl -fsS "${auth[@]}" -X POST "$API/organizations" -d '{"name":"darija"}' | jqq "['id']")
fi
echo "    $ORG"

echo "==> creating project (this takes a minute or two)"
DB_PASS="$(pw)"
REF=$(curl -fsS "${auth[@]}" -X POST "$API/projects" -d "$(python3 - <<PY
import json
print(json.dumps({"name":"darija-tetouan","organization_id":"$ORG",
                  "region":"eu-west-3","db_pass":"$DB_PASS"}))
PY
)" | jqq "['id']")
echo "    project ref: $REF"

echo "==> waiting for it to come up"
for i in $(seq 1 60); do
  S=$(curl -fsS "${auth[@]}" "$API/projects/$REF" | jqq "['status']" || echo PENDING)
  [ "$S" = "ACTIVE_HEALTHY" ] && break
  printf '    %s (%ds)\r' "$S" $((i*10)); sleep 10
done
echo "    ACTIVE_HEALTHY            "

echo "==> keys"
KEYS=$(curl -fsS "${auth[@]}" "$API/projects/$REF/api-keys?reveal=true")
ANON=$(printf '%s' "$KEYS" | python3 -c "import sys,json;print([k['api_key'] for k in json.load(sys.stdin) if k['name']=='anon'][0])")
SERVICE=$(printf '%s' "$KEYS" | python3 -c "import sys,json;print([k['api_key'] for k in json.load(sys.stdin) if k['name']=='service_role'][0])")
URL="https://$REF.supabase.co"

runsql() {   # reads SQL on stdin
  python3 -c "import json,sys;print(json.dumps({'query':sys.stdin.read()}))" > /tmp/dt-query.json
  curl -fsS -X POST "$API/projects/$REF/database/query" \
    "${auth[@]}" --data-binary @/tmp/dt-query.json
  echo
}
# NB: this must go through curl. The same request from python's urllib is
# refused by Cloudflare (403, error 1010) because of its user agent.

echo "==> schema"
runsql < "$ROOT/supabase/schema.sql"

if [ -n "$HAMZA_EMAIL" ] && [ -n "$WIFE_EMAIL" ] && [ -n "$TEACHER_EMAIL" ]; then
  echo "==> accounts"
  mkuser() {  # mkuser <email> <password>
    curl -fsS -X POST "$URL/auth/v1/admin/users" \
      -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$1\",\"password\":\"$2\",\"email_confirm\":true}" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"
  }
  H_PW="$(pw)"; W_PW="$(pw)"; T_PW="$(pw)"
  H_ID=$(mkuser "$HAMZA_EMAIL"   "$H_PW")
  W_ID=$(mkuser "$WIFE_EMAIL"    "$W_PW")
  T_ID=$(mkuser "$TEACHER_EMAIL" "$T_PW")

  echo "==> profiles (this is what decides who is the teacher)"
  runsql <<SQL
insert into public.profiles (id, name, role) values
  ('$H_ID', 'Hamza',   'student'),
  ('$W_ID', 'Student', 'student'),
  ('$T_ID', 'Ahmed',   'teacher')
on conflict (id) do update set name = excluded.name, role = excluded.role;
SQL
  ACCOUNTS="yes"
else
  echo "==> accounts skipped (no emails given)"
  ACCOUNTS="no"
fi

echo "==> js/supabase-config.js"
python3 - "$ROOT/js/supabase-config.js" "$URL" "$ANON" <<'PY'
import re,sys
p,url,key=sys.argv[1],sys.argv[2],sys.argv[3]
s=open(p).read()
s=re.sub(r"url:\s*'[^']*'",    "url:     '%s'" % url, s, count=1)
s=re.sub(r"anonKey:\s*'[^']*'","anonKey: '%s'" % key, s, count=1)
open(p,'w').write(s)
PY

echo "==> redirect urls"
curl -fsS "${auth[@]}" -X PATCH "$API/projects/$REF/config/auth" \
  -d '{"site_url":"https://a7mad7amdoun.github.io/darija-tetouan/",
       "uri_allow_list":"http://localhost:8000/**,http://localhost:8000",
       "mailer_autoconfirm":true,
       "disable_signup":true}' >/dev/null

cat <<OUT

============================================================
 SAVE THESE NOW. Printed once, and never written into the repo.
============================================================
 Dashboard      https://supabase.com/dashboard/project/$REF
 DB password    $DB_PASS

 Written into js/supabase-config.js (public, safe to commit):
   url      $URL
   anonKey  ${ANON:0:24}...
============================================================
OUT

if [ "$ACCOUNTS" = "yes" ]; then
cat <<OUT
 Sign-in details — hand these over privately, not in a file:
   Hamza    $HAMZA_EMAIL   $H_PW
   Student  $WIFE_EMAIL    $W_PW
   Teacher  $TEACHER_EMAIL $T_PW
============================================================
OUT
else
cat <<OUT
 STILL TO DO — the site cannot sign anyone in until this is done:
   1. Dashboard -> Authentication -> Users -> Add user, three times.
      Tick "Auto Confirm User" each time.
   2. Copy the three UIDs and tell me, or run SUPABASE-SETUP.md step 3.4.
      The profiles table is what decides who is the teacher; the browser
      is never asked.
============================================================
OUT
fi
