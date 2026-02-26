-- Ensure profiles, quiz_questions, quiz_answers tables exist with required schema and RLS policies.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    create table public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text,
      name text,
      created_at timestamp with time zone default timezone('utc', now())
    );
  else
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
    ) then
      alter table public.profiles rename column user_id to id;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
    ) then
      alter table public.profiles add column email text;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'name'
    ) then
      alter table public.profiles add column name text;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'created_at'
    ) then
      alter table public.profiles
        add column created_at timestamp with time zone default timezone('utc', now());
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'profiles_pkey' and conrelid = 'public.profiles'::regclass
    ) then
      alter table public.profiles add constraint profiles_pkey primary key (id);
    end if;
  end if;
end $$;

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  type text not null check (type in ('single', 'multi', 'scale')),
  options jsonb,
  order_index integer not null
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer jsonb not null,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "quiz_questions_select_all" on public.quiz_questions;
drop policy if exists "quiz_answers_select_own" on public.quiz_answers;
drop policy if exists "quiz_answers_insert_own" on public.quiz_answers;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "quiz_questions_select_all"
  on public.quiz_questions for select
  using (true);

create policy "quiz_answers_select_own"
  on public.quiz_answers for select
  using (auth.uid() = user_id);

create policy "quiz_answers_insert_own"
  on public.quiz_answers for insert
  with check (auth.uid() = user_id);
