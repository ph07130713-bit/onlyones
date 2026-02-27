-- Align recommendations RPC with existing public.products table

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  derived_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists quiz_submissions_user_created_idx
  on public.quiz_submissions(user_id, created_at desc);

alter table public.quiz_submissions enable row level security;

drop policy if exists "quiz_submissions_select_own" on public.quiz_submissions;
drop policy if exists "quiz_submissions_insert_own" on public.quiz_submissions;

create policy "quiz_submissions_select_own"
  on public.quiz_submissions for select
  using (auth.uid() = user_id);

create policy "quiz_submissions_insert_own"
  on public.quiz_submissions for insert
  with check (auth.uid() = user_id);

create or replace function public.get_recommendations(
  p_submission_id uuid,
  p_limit int default 12
)
returns table (
  id uuid,
  title text,
  brand text,
  price_krw int,
  image_url text,
  tags text[],
  match_score int
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_answers jsonb;
  v_tags text[];
  v_requested_limit int;
  v_final_limit int;
  v_needed int;
begin
  select qs.user_id, qs.answers, coalesce(qs.derived_tags, '{}'::text[])
    into v_user_id, v_answers, v_tags
  from public.quiz_submissions qs
  where qs.id = p_submission_id;

  if not found then
    raise exception 'submission_not_found: %', p_submission_id
      using errcode = 'P0002', hint = 'sid is missing/invalid or submission does not exist.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '28000', hint = 'You must sign in before calling get_recommendations.';
  end if;

  if v_user_id <> auth.uid() then
    raise exception 'forbidden_submission_access'
      using errcode = '42501', hint = 'RLS: can only access your own quiz_submissions.';
  end if;

  -- Fallback tag derivation if derived_tags is empty.
  if coalesce(array_length(v_tags, 1), 0) = 0 then
    select coalesce(array_agg(distinct lower(value)), '{}'::text[])
      into v_tags
    from jsonb_each(v_answers) kv,
      lateral jsonb_array_elements_text(
        case jsonb_typeof(kv.value)
          when 'array' then kv.value
          when 'string' then jsonb_build_array(kv.value #>> '{}')
          else '[]'::jsonb
        end
      ) value;
  end if;

  v_requested_limit := greatest(1, least(coalesce(p_limit, 12), 20));
  v_final_limit := greatest(8, v_requested_limit);

  create temporary table if not exists tmp_ranked_recs (
    id uuid primary key,
    title text,
    brand text,
    price_krw int,
    image_url text,
    tags text[],
    match_score int
  ) on commit drop;

  truncate tmp_ranked_recs;

  insert into tmp_ranked_recs (id, title, brand, price_krw, image_url, tags, match_score)
  select
    p.id,
    p.title,
    p.brand,
    coalesce(
      (to_jsonb(p) ->> 'price_krw')::int,
      ((to_jsonb(p) ->> 'price_cents')::int / 100)
    ) as price_krw,
    coalesce(
      to_jsonb(p) ->> 'image_url',
      (
        case
          when jsonb_typeof(to_jsonb(p) -> 'images') = 'array'
            then (to_jsonb(p) -> 'images' ->> 0)
          else null
        end
      )
    ) as image_url,
    p.tags,
    (
      select count(*)::int
      from unnest(coalesce(p.tags, '{}'::text[])) item_tag
      where item_tag = any(coalesce(v_tags, '{}'::text[]))
    ) as match_score
  from public.products p
  where p.active = true
  order by match_score desc, random()
  limit v_final_limit;

  select greatest(0, v_final_limit - count(*)) into v_needed
  from tmp_ranked_recs;

  if v_needed > 0 then
    insert into tmp_ranked_recs (id, title, brand, price_krw, image_url, tags, match_score)
    select
      p.id,
      p.title,
      p.brand,
      coalesce(
        (to_jsonb(p) ->> 'price_krw')::int,
        ((to_jsonb(p) ->> 'price_cents')::int / 100)
      ) as price_krw,
      coalesce(
        to_jsonb(p) ->> 'image_url',
        (
          case
            when jsonb_typeof(to_jsonb(p) -> 'images') = 'array'
              then (to_jsonb(p) -> 'images' ->> 0)
            else null
          end
        )
      ) as image_url,
      p.tags,
      0
    from public.products p
    where p.active = true
      and not exists (
        select 1 from tmp_ranked_recs t where t.id = p.id
      )
    order by random()
    limit v_needed
    on conflict (id) do nothing;
  end if;

  return query
  select t.id, t.title, t.brand, t.price_krw, t.image_url, t.tags, t.match_score
  from tmp_ranked_recs t
  order by t.match_score desc, random()
  limit v_final_limit;
end;
$$;

grant execute on function public.get_recommendations(uuid, int) to authenticated;
