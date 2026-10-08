-- ============================================================================
-- Tetouani Darija — database schema
--
-- Three people: two students and one teacher. The schema is normalised on the
-- server even though the browser keeps a document-shaped cache, because the
-- server is where authorisation has to be enforced per row.
--
-- Run this once, in the Supabase SQL editor. It is safe to re-run: every
-- statement is guarded.
--
-- The security model in one sentence: a student can reach their own rows and
-- nothing else, the teacher can reach both students' progress and owns the
-- shared teaching data, and nobody can promote themselves.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 60),
  role        text not null check (role in ('student', 'teacher')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per real person. id matches auth.users. role is the ONLY source of
   truth for authorisation — the browser is never trusted for it.';

-- ---------------------------------------------------------------------------
-- 2. STUDENT PROGRESS
--
-- One row per (profile, entry key). Normalised rather than one giant JSON blob
-- per user, so that:
--   * two devices can write different keys concurrently without clobbering
--   * an increment can be applied server-side, atomically
--   * RLS applies per row
--
-- 'value' is jsonb because the value shape genuinely varies by kind: boolean
-- ticks, {r,w} counters, arrays of results, small integers, short strings.
-- 'kind' records which merge rule applies, so the server does not have to
-- re-derive it from the key.
-- ---------------------------------------------------------------------------
create table if not exists public.student_progress (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  entry_key   text not null,
  kind        text not null check (kind in ('bool','counter','append','lww','text')),
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (profile_id, entry_key)
);

create index if not exists student_progress_profile_idx
  on public.student_progress (profile_id);
create index if not exists student_progress_updated_idx
  on public.student_progress (profile_id, updated_at desc);

comment on column public.student_progress.entry_key is
  'A stable content id, never an array index. e.g.
   chk:month1:w1:chk-m1-w1-greet-ask-using-ntina';

-- ---------------------------------------------------------------------------
-- 3. SHARED TEACHER DATA
--
-- Notes, card corrections, verification answers, feedback, session log and
-- teacher-created cards. Shared, not duplicated into each student's progress.
--
-- 'student_visible' decides whether students may read the row. Card
-- corrections are meant to be seen by students; private teaching notes are not.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_data (
  entry_key        text primary key,
  kind             text not null check (kind in ('bool','counter','append','lww','text')),
  value            jsonb not null,
  student_visible  boolean not null default false,
  updated_by       uuid references public.profiles (id),
  updated_at       timestamptz not null default now()
);

create index if not exists shared_data_visible_idx
  on public.shared_data (student_visible);

-- ---------------------------------------------------------------------------
-- 4. APPLIED CHANGES  (idempotency ledger)
--
-- Every change carries a client-generated UUID. Recording them here means a
-- retry after a dropped connection cannot double-apply an increment.
-- ---------------------------------------------------------------------------
create table if not exists public.applied_changes (
  change_id   uuid primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  entry_key   text not null,
  op          text not null,
  applied_at  timestamptz not null default now()
);

create index if not exists applied_changes_profile_idx
  on public.applied_changes (profile_id, applied_at desc);

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.student_progress enable row level security;
alter table public.shared_data      enable row level security;
alter table public.applied_changes  enable row level security;

-- Helper: is the caller the teacher? SECURITY DEFINER so the function itself
-- can read profiles without recursing through the profiles policy.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ---- profiles ----
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists profiles_update_own_name on public.profiles;
create policy profiles_update_own_name on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- a student can never promote themselves: the role must not change
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists profiles_update_name_by_teacher on public.profiles;
create policy profiles_update_name_by_teacher on public.profiles
  for update using (public.is_teacher())
  with check (public.is_teacher() and role = (select role from public.profiles p where p.id = profiles.id));
-- The teacher may correct a student's display name. The with-check pins role to
-- whatever the row already holds, so this cannot be used to make a second
-- teacher, or to demote the real one.

-- No insert or delete policy on purpose. Accounts are created by an admin
-- procedure (see SUPABASE-SETUP.md step 3), not by the app.

-- ---- student_progress ----
drop policy if exists progress_read on public.student_progress;
create policy progress_read on public.student_progress
  for select using (profile_id = auth.uid() or public.is_teacher());

drop policy if exists progress_insert on public.student_progress;
create policy progress_insert on public.student_progress
  for insert with check (profile_id = auth.uid());

drop policy if exists progress_update on public.student_progress;
create policy progress_update on public.student_progress
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists progress_delete on public.student_progress;
create policy progress_delete on public.student_progress
  for delete using (profile_id = auth.uid());

-- Note what is absent: no policy lets one student read or write the other's
-- rows. A student who edits their own JavaScript still gets nothing back.

-- ---- shared_data ----
drop policy if exists shared_read on public.shared_data;
create policy shared_read on public.shared_data
  for select using (public.is_teacher() or student_visible = true);

drop policy if exists shared_write on public.shared_data;
create policy shared_write on public.shared_data
  for all using (public.is_teacher()) with check (public.is_teacher());

-- ---- applied_changes ----
drop policy if exists changes_read_own on public.applied_changes;
create policy changes_read_own on public.applied_changes
  for select using (profile_id = auth.uid() or public.is_teacher());

drop policy if exists changes_insert_own on public.applied_changes;
create policy changes_insert_own on public.applied_changes
  for insert with check (profile_id = auth.uid());

-- Which shared rows may students read? Decided on the server, from the key,
-- because it is an authorisation question and the browser does not get a vote.
--   visible : the teacher's corrections to cards, resolved flags, and any card
--             the teacher writes for the students
--   private : teaching notes, verification workspace, feedback, session log
create or replace function public.shared_is_student_visible(entry_key text)
returns boolean
language sql
immutable
as $$
  select entry_key like 'cardnote:%'
      or entry_key like 'flagres:%'
      or entry_key in ('customCards', 'customSeq');
  -- Everything else is teacher-only. That deliberately includes 'obs:%' and
  -- 'target:%', the teacher's per-student assessments: a student must not be
  -- able to read what is written about them, or about the other student.
  -- Anything added here is readable by both students, so add nothing without
  -- meaning it.
$$;

-- ---------------------------------------------------------------------------
-- 6. APPLYING A BATCH OF CHANGES
--
-- The client posts its outbox. This applies the merge rules inside one
-- transaction and returns the ids it accepted, so the client can mark exactly
-- those as synced. Already-applied change ids are accepted again without
-- being re-applied, which makes retries safe.
-- ---------------------------------------------------------------------------
create or replace function public.apply_changes(changes jsonb)
returns jsonb
language plpgsql
security invoker          -- runs as the caller, so RLS still applies
set search_path = public
as $$
declare
  c            jsonb;
  accepted     uuid[] := '{}';
  v_change_id  uuid;
  v_profile    uuid;
  v_key        text;
  v_kind       text;
  v_op         text;
  v_payload    jsonb;
  v_at         timestamptz;
  is_shared    boolean;
begin
  if changes is null or jsonb_typeof(changes) <> 'array' then
    return jsonb_build_object('accepted', '[]'::jsonb);
  end if;

  for c in select * from jsonb_array_elements(changes) loop
    v_change_id := (c ->> 'id')::uuid;
    v_profile   := nullif(c ->> 'profileId', '_shared')::uuid;
    v_key       := c ->> 'entityId';
    v_kind      := c ->> 'entityType';
    v_op        := c ->> 'op';
    v_payload   := c -> 'payload';
    v_at        := coalesce((c ->> 'at')::timestamptz, now());
    is_shared   := (c ->> 'profileId') = '_shared';

    -- A 'restore' is a device saying "I hold at least this much", used to
    -- rebuild rows the server has lost. It deliberately skips the ledger:
    -- every restore rule below is idempotent by construction (max, union,
    -- true-wins, newer-wins), so replaying one cannot inflate anything - and
    -- the ledger must not be able to block a repair, since it is append-only
    -- and may well have survived whatever lost the progress rows.
    if v_op = 'restore' then
      if not is_shared and v_profile is distinct from auth.uid() then
        continue;
      end if;
      if v_kind = 'counter' then
        insert into student_progress (profile_id, entry_key, kind, value, updated_at)
        values (v_profile, v_key, 'counter',
                jsonb_build_object('r', coalesce((v_payload ->> 'r')::int, 0),
                                   'w', coalesce((v_payload ->> 'w')::int, 0)), v_at)
        on conflict (profile_id, entry_key) do update
          set value = jsonb_build_object(
                'r', greatest(coalesce((student_progress.value ->> 'r')::int, 0),
                              coalesce((v_payload ->> 'r')::int, 0)),
                'w', greatest(coalesce((student_progress.value ->> 'w')::int, 0),
                              coalesce((v_payload ->> 'w')::int, 0)));
      elsif v_kind = 'append' then
        insert into student_progress (profile_id, entry_key, kind, value, updated_at)
        values (v_profile, v_key, 'append', coalesce(v_payload, '[]'::jsonb), v_at)
        on conflict (profile_id, entry_key) do update
          set value = (
                select coalesce(jsonb_agg(distinct_row), '[]'::jsonb)
                from (
                  select distinct on (elem ->> 'id') elem as distinct_row
                  from jsonb_array_elements(student_progress.value || coalesce(v_payload, '[]'::jsonb)) elem
                  order by (elem ->> 'id')
                ) s
              );
      elsif v_kind = 'bool' then
        insert into student_progress (profile_id, entry_key, kind, value, updated_at)
        values (v_profile, v_key, 'bool', coalesce(v_payload -> 'value', 'false'::jsonb), v_at)
        on conflict (profile_id, entry_key) do update
          set value = case when (v_payload -> 'value') = 'true'::jsonb
                           then 'true'::jsonb else student_progress.value end;
      else
        -- A restore FILLS GAPS. It must not overwrite a row the server already
        -- has, because reupload sends one timestamp for the whole document: a
        -- laptop whose doc is newer overall would otherwise replace a 'sched:'
        -- row carrying a lapse that the phone had already synced, rolling the
        -- failure's effect back. 'do nothing' makes the claim in sync.js -
        -- "it only ever adds" - true of every kind, not just counters.
        insert into student_progress (profile_id, entry_key, kind, value, updated_at)
        values (v_profile, v_key, coalesce(v_kind, 'lww'), coalesce(v_payload -> 'value', v_payload), v_at)
        on conflict (profile_id, entry_key) do nothing;
      end if;
      accepted := accepted || v_change_id;
      continue;
    end if;

    -- already applied? accept and move on. Makes retry idempotent.
    if exists (select 1 from applied_changes where change_id = v_change_id) then
      accepted := accepted || v_change_id;
      continue;
    end if;

    -- a caller may only write their own progress
    if not is_shared and v_profile is distinct from auth.uid() then
      continue;   -- silently skipped; RLS would refuse it anyway
    end if;

    if is_shared then
      if not public.is_teacher() then
        continue;
      end if;
      insert into shared_data (entry_key, kind, value, student_visible, updated_by, updated_at)
      values (v_key, v_kind, coalesce(v_payload -> 'value', v_payload),
              public.shared_is_student_visible(v_key), auth.uid(), v_at)
      on conflict (entry_key) do update
        set value = excluded.value,
            student_visible = excluded.student_visible,
            updated_by = excluded.updated_by,
            updated_at = excluded.updated_at
        where shared_data.updated_at < excluded.updated_at;   -- newer wins
      accepted := accepted || v_change_id;
      insert into applied_changes (change_id, profile_id, entry_key, op)
      values (v_change_id, auth.uid(), v_key, v_op);
      continue;
    end if;

    if v_op = 'increment' then
      -- counters merge by adding deltas, so two offline devices both land
      insert into student_progress (profile_id, entry_key, kind, value, updated_at)
      values (v_profile, v_key, 'counter',
              jsonb_build_object('r', coalesce((v_payload ->> 'r')::int, 0),
                                 'w', coalesce((v_payload ->> 'w')::int, 0)),
              v_at)
      on conflict (profile_id, entry_key) do update
        set value = jsonb_build_object(
              'r', coalesce((student_progress.value ->> 'r')::int, 0) + coalesce((v_payload ->> 'r')::int, 0),
              'w', coalesce((student_progress.value ->> 'w')::int, 0) + coalesce((v_payload ->> 'w')::int, 0)),
            updated_at = greatest(student_progress.updated_at, v_at);

    elsif v_op = 'append' then
      -- union by result id; no result is ever lost
      insert into student_progress (profile_id, entry_key, kind, value, updated_at)
      values (v_profile, v_key, 'append', coalesce(v_payload, '[]'::jsonb), v_at)
      on conflict (profile_id, entry_key) do update
        set value = (
              select jsonb_agg(distinct_row)
              from (
                select distinct on (elem ->> 'id') elem as distinct_row
                from jsonb_array_elements(student_progress.value || coalesce(v_payload, '[]'::jsonb)) elem
                order by (elem ->> 'id')
              ) s
            ),
            updated_at = greatest(student_progress.updated_at, v_at);

    elsif v_kind = 'bool' then
      -- a newer true wins; an older false must never un-tick a newer true
      insert into student_progress (profile_id, entry_key, kind, value, updated_at)
      values (v_profile, v_key, 'bool', coalesce(v_payload -> 'value', 'false'::jsonb), v_at)
      on conflict (profile_id, entry_key) do update
        set value = case
              when (v_payload -> 'value') = 'true'::jsonb then 'true'::jsonb
              when student_progress.updated_at < v_at then (v_payload -> 'value')
              else student_progress.value
            end,
            updated_at = greatest(student_progress.updated_at, v_at);

    else
      -- last write wins, by explicit change timestamp
      insert into student_progress (profile_id, entry_key, kind, value, updated_at)
      values (v_profile, v_key, coalesce(v_kind, 'lww'), coalesce(v_payload -> 'value', v_payload), v_at)
      on conflict (profile_id, entry_key) do update
        set value = excluded.value, updated_at = excluded.updated_at
        where student_progress.updated_at < excluded.updated_at;
    end if;

    insert into applied_changes (change_id, profile_id, entry_key, op)
    values (v_change_id, v_profile, v_key, v_op);
    accepted := accepted || v_change_id;
  end loop;

  return jsonb_build_object('accepted', to_jsonb(accepted));
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. READING STATE BACK
--
-- Returns the caller's own progress plus the shared rows they are allowed to
-- see, in the shape the browser cache expects.
-- ---------------------------------------------------------------------------
create or replace function public.read_state(since timestamptz default null)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'entries', coalesce((
      select jsonb_object_agg(entry_key,
               jsonb_build_object('value', value, 'at', updated_at))
        from student_progress
       where profile_id = auth.uid()
         and (since is null or updated_at > since)
    ), '{}'::jsonb),
    'shared', coalesce((
      select jsonb_object_agg(entry_key,
               jsonb_build_object('value', value, 'at', updated_at))
        from shared_data
       where (public.is_teacher() or student_visible = true)
         and (since is null or updated_at > since)
    ), '{}'::jsonb),
    'serverTime', to_jsonb(now())
  );
$$;

-- ---------------------------------------------------------------------------
-- 7b. READING ONE STUDENT'S STATE  (the teacher's view)
--
-- read_state deliberately returns only the caller's own rows. The teacher also
-- needs to see each student, so this asks for one person by id. It is
-- security invoker, so RLS is still the fence - a student calling it for the
-- other student gets an empty object back, not an error and not data.
-- ---------------------------------------------------------------------------
create or replace function public.read_student(target uuid, since timestamptz default null)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'profileId', target,
    'entries', coalesce((
      select jsonb_object_agg(entry_key,
               jsonb_build_object('value', value, 'at', updated_at))
        from student_progress
       where profile_id = target
         and (public.is_teacher() or target = auth.uid())
         and (since is null or updated_at > since)
    ), '{}'::jsonb),
    'serverTime', to_jsonb(now())
  );
$$;

-- ---------------------------------------------------------------------------
-- 8. keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
