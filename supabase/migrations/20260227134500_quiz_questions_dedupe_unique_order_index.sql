-- 1) Remove duplicates by order_index, keeping one row per order_index
with ranked as (
  select
    ctid,
    row_number() over (partition by order_index order by ctid) as rn
  from public.quiz_questions
)
delete from public.quiz_questions q
using ranked r
where q.ctid = r.ctid
  and r.rn > 1;

-- 2) Prevent future duplicates on order_index
create unique index if not exists quiz_questions_order_index_unique_idx
  on public.quiz_questions(order_index);

-- Optional: promote the unique index into a named table constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.quiz_questions'::regclass
      AND conname = 'quiz_questions_order_index_key'
  ) THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_order_index_key
      UNIQUE USING INDEX quiz_questions_order_index_unique_idx;
  END IF;
END $$;
