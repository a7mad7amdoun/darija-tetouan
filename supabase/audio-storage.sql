-- ============================================================================
-- PREPARED, NOT RUN.
--
-- This is the step to take ONLY if you decide the recordings should not be
-- publicly downloadable. It has deliberately not been applied: it changes
-- production storage, and that is your call, not mine.
--
-- The trade-off, plainly:
--   assets/audio/ in the repo  -> simple, works offline and from a file://
--                                 page, and anyone with the URL can download
--                                 the clips. The login screen does not protect
--                                 files on GitHub Pages.
--   Supabase Storage (below)   -> only signed-in users can fetch a clip, but
--                                 the app then needs a network round trip for
--                                 a signed URL, and opening index.html straight
--                                 off the disk will not play audio.
--
-- For 32 everyday phrases the first is probably right. Use this if the
-- recordings ever become something you would not want handed out.
--
-- To use it: run this in the SQL editor, create the bucket in the dashboard
-- first, then set DARIJA.audio.source = 'supabase' in data/audio.js.
-- ============================================================================

-- 1. Create the bucket in Storage -> New bucket, named 'audio', PRIVATE.
--    Do not tick "Public bucket". That one checkbox is the whole point.

-- 2. Only signed-in people may read; only the teacher may write.

drop policy if exists audio_read_signed_in on storage.objects;
create policy audio_read_signed_in on storage.objects
  for select using (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
  );

drop policy if exists audio_write_teacher on storage.objects;
create policy audio_write_teacher on storage.objects
  for insert with check (
    bucket_id = 'audio'
    and public.is_teacher()
  );

drop policy if exists audio_update_teacher on storage.objects;
create policy audio_update_teacher on storage.objects
  for update using (
    bucket_id = 'audio' and public.is_teacher()
  );

drop policy if exists audio_delete_teacher on storage.objects;
create policy audio_delete_teacher on storage.objects
  for delete using (
    bucket_id = 'audio' and public.is_teacher()
  );

-- 3. Note what is NOT here: no policy lets an anonymous request read a clip.
--    A student can read every clip, because every clip is course material -
--    there is no per-student audio and no reason to invent one.
