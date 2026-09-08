# Supabase setup

> **Steps 1, 2 and 4 are already done.** The project exists, the schema and Row
> Level Security are in, and `js/supabase-config.js` is filled in. What is left
> is **step 3** — creating the three accounts — and **step 6**, the tests.
>
> * Dashboard: <https://supabase.com/dashboard/project/umswnonsdfmrwoqlcisa>
> * Project ref: `umswnonsdfmrwoqlcisa` · region Paris (`eu-west-3`)
> * Public sign-up is **disabled**, and email confirmation is off — accounts are
>   created by you in the dashboard, which is what you want for three people.
>
> `supabase/provision.sh` is the script that did it, kept so the whole thing can
> be rebuilt from nothing if it ever needs to be.

Until you finish this, **the site still works**. It runs in local-only mode:
every page, every test, every tick is saved on the device it was made on.
What you do not get until this is done is sync between devices, and the
teacher view of both students' progress.

Nothing here is faked. If the two values in `js/supabase-config.js` are empty,
the app says so on screen and does not pretend to be signed in.

Work through the steps in order. Step 4 is the only one that touches the code.

---

## Step 1 — Create the project

1. Go to <https://supabase.com>, sign in, **New project**.
2. Name: `darija-tetouan`. Region: pick the one closest to Morocco
   (`eu-west-3 / Paris` or `eu-central-1 / Frankfurt`).
3. It generates a **database password**. Save it in your password manager.
   **It never goes in this repository.** Nothing in the browser needs it.
4. Wait for the project to finish provisioning (a minute or two).

---

## Step 2 — Run the schema

1. In the project, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repository, copy all of it, paste it in.
3. **Run.**
4. You should see `Success. No rows returned`.

The file is safe to run again later. Every statement is guarded with
`if not exists` or `drop policy if exists`, so re-running it after an update
does not destroy data.

To check it landed: **Table Editor** should now list `profiles`,
`student_progress`, `shared_data`, `applied_changes`, and each should show a
green **RLS enabled** badge. If any table says *RLS disabled*, stop — the data
is not protected. Re-run the schema.

---

## Step 3 — Create the three accounts

Accounts are created by you, here, not by a sign-up form on the site. There are
exactly three people and no reason to let anyone else register.

1. **Authentication → Providers → Email**: make sure Email is enabled, and turn
   **Confirm email** *off*. There is no inbox flow to run for three people you
   are creating by hand.
2. **Authentication → Users → Add user → Create new user**, three times:

   | Email | Password | Who |
   |---|---|---|
   | `hamza@…` | a real password, given to him privately | Hamza |
   | `…@…` | a real password, given to her privately | Hamza's wife |
   | your own email | your own password | You, the teacher |

   Tick **Auto Confirm User** for each. Use real passwords and hand them over in
   person or in a private message — never write them into a file in this repo.

3. Copy each user's **UID** (the long `xxxxxxxx-xxxx-…` string in the users
   list). You need all three for the next part.

4. Back in **SQL Editor**, run this with the three UIDs and the real names
   filled in. This is what actually decides who is the teacher — the browser is
   never asked.

   ```sql
   insert into public.profiles (id, name, role) values
     ('PASTE-HAMZA-UID',  'Hamza',      'student'),
     ('PASTE-WIFE-UID',   'HER NAME',   'student'),
     ('PASTE-YOUR-UID',   'Ahmed',      'teacher')
   on conflict (id) do update
     set name = excluded.name, role = excluded.role;
   ```

5. Check it: `select id, name, role from public.profiles;` — three rows, exactly
   one of them `teacher`.

---

## Step 4 — Point the site at the project

1. **Project Settings → API**. You need two values from that page:
   * **Project URL** — looks like `https://abcdefghijklm.supabase.co`
   * **anon / public** key — a long string starting `eyJ…`
2. Open `js/supabase-config.js` and fill them in:

   ```js
   window.SUPABASE_CONFIG = {
     url:     'https://abcdefghijklm.supabase.co',
     anonKey: 'eyJhbGciOi…'
   };
   ```

Both of those are **public by design**. The anon key is meant to sit in a
browser; it is Row Level Security, set up in step 2, that decides what any
given signed-in person can actually read or write.

On the same settings page there is a **`service_role`** key. It bypasses Row
Level Security completely. It must never go in this file, in this repository,
in a commit, in a screenshot, or in a message. The same goes for the database
password from step 1 and the JWT secret.

3. Set the redirect URLs so sign-in works on the deployed site:
   **Authentication → URL Configuration**
   * Site URL: `https://YOUR-USERNAME.github.io/darija-tetouan/`
   * Additional redirect URLs: `http://localhost:8000/` for local work.

---

## Step 5 — Deploy

```sh
git add .
git commit -m "Persistence, accounts and sync"
git push
```

Then **Settings → Pages** on the GitHub repository: source *Deploy from a
branch*, branch `main`, folder `/ (root)`. The site appears at
`https://YOUR-USERNAME.github.io/darija-tetouan/` after a minute.

Every path in the site is relative, so the `/darija-tetouan/` subfolder works
without any change.

---

## Step 6 — Test it, in this order

Do these on the deployed site, not just locally.

**Sign in**
1. Open the site. You should get the sign-in screen, not the lessons.
2. Sign in as Hamza. The header should show his name and `student`.
3. Sign out. You should land back on the sign-in screen, and no progress from
   his account should be visible.

**The teacher check**
4. Sign in as yourself. The teacher pages should appear in the nav.
5. Sign in as Hamza again — the teacher pages should be gone.

**The real authorisation check (this is the one that matters)**
6. Signed in as Hamza, open the browser console and run:

   ```js
   const c = await Auth.client();
   await c.from('profiles').update({ role: 'teacher' }).eq('id', (await c.auth.getUser()).data.user.id);
   ```

   It must fail, or change nothing. Re-check `select role from profiles` in
   Supabase: he is still `student`. Frontend checks are convenience; this is the
   fence.

7. Still as Hamza:

   ```js
   const c = await Auth.client();
   console.log(await c.from('student_progress').select('*'));
   ```

   He must see only his own rows — never his wife's.

**Offline**
8. Do a few lessons. Open DevTools → Network → **Offline**. Keep working: tick
   days, take a test. Everything must still save.
9. Reload while still offline. The work must still be there.
10. Go back online. Within a few seconds the sync badge should clear and the
    pending count should drop to zero.

**Two devices**
11. Sign in as Hamza on your phone and on a laptop. Do different weeks on each,
    both offline. Bring both online. Both sets of work should be present — a
    practice counter should show the *sum*, and no test result should vanish.

**Migration** — only relevant if the person already used the site before
accounts existed.
12. Signing in on that old device should offer the migration screen with the
    counts. It should never run on its own. Take the backup it offers first.

---

## If something goes wrong

**"Supabase is not configured"** — step 4 is not done, or one of the two values
is still an empty string. The site keeps working locally; nothing is lost.

**Sign-in says "Invalid login credentials"** — the user exists in
**Authentication → Users** but you may not have ticked *Auto Confirm*. Open the
user and confirm them.

**Signed in, but the app says the profile is missing** — the `auth.users` row
exists but there is no matching row in `public.profiles`. Redo step 3.4.

**Teacher pages do not appear for you** — `select role from public.profiles`
and check your UID really is the `teacher` row.

**Nothing syncs and the badge stays orange** — open the console. A `401` or
`permission denied` means RLS is refusing the write, which normally means the
`profiles` row is missing or has the wrong id. A network error means it will
retry by itself; nothing is lost while it waits.

**You want to start a student over** — never delete rows by hand while they are
signed in. Have them export a backup from the Account page first, then delete
their `student_progress` rows.
