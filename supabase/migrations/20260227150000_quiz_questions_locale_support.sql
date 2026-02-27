-- Add locale support for quiz questions and enforce unique order per locale.

alter table public.quiz_questions
  add column if not exists locale text not null default 'en';

-- Backfill null/empty locale values.
update public.quiz_questions
set locale = 'en'
where locale is null or btrim(locale) = '';

-- Remove duplicate rows per (locale, order_index), keep earliest row by created key.
with ranked as (
  select
    ctid,
    row_number() over (
      partition by locale, order_index
      order by ctid
    ) as rn
  from public.quiz_questions
)
delete from public.quiz_questions q
using ranked r
where q.ctid = r.ctid
  and r.rn > 1;

-- Drop old unique constraint/index on order_index-only if present.
alter table public.quiz_questions
  drop constraint if exists quiz_questions_order_index_key;

drop index if exists public.quiz_questions_order_index_unique_idx;

-- Enforce uniqueness per locale + order_index.
create unique index if not exists quiz_questions_locale_order_index_unique_idx
  on public.quiz_questions(locale, order_index);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.quiz_questions'::regclass
      AND conname = 'quiz_questions_locale_order_index_key'
  ) THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_locale_order_index_key
      UNIQUE USING INDEX quiz_questions_locale_order_index_unique_idx;
  END IF;
END $$;
