-- Ensure quiz_submissions insert works with RLS when user_id is omitted by client.
alter table if exists public.quiz_submissions
  alter column user_id set default auth.uid();
