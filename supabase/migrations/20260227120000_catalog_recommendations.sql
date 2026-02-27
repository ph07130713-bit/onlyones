-- Catalog + quiz submissions + recommendation RPC for StitchFix-style MVP

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  price_krw int,
  image_url text,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  derived_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists catalog_items_active_idx on public.catalog_items(active);
create index if not exists catalog_items_tags_gin_idx on public.catalog_items using gin(tags);
create index if not exists quiz_submissions_user_created_idx on public.quiz_submissions(user_id, created_at desc);

alter table public.catalog_items enable row level security;
alter table public.quiz_submissions enable row level security;

drop policy if exists "catalog_items_select_all" on public.catalog_items;
drop policy if exists "catalog_items_insert_authenticated" on public.catalog_items;
drop policy if exists "quiz_submissions_select_own" on public.quiz_submissions;
drop policy if exists "quiz_submissions_insert_own" on public.quiz_submissions;

-- Catalog is public-readable for recommendation browse cards.
create policy "catalog_items_select_all"
  on public.catalog_items for select
  using (true);

-- TODO: keep writes service-role only in production; do not add insert/update/delete policies for anon/authenticated.

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
  v_tags text[];
  v_requested_limit int;
  v_final_limit int;
  v_needed int;
begin
  select qs.user_id, coalesce(qs.derived_tags, '{}'::text[])
    into v_user_id, v_tags
  from public.quiz_submissions qs
  where qs.id = p_submission_id;

  if not found then
    raise exception 'submission_not_found: %', p_submission_id
      using errcode = 'P0002', hint = 'Check sid query param and ensure this submission exists.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '28000', hint = 'Sign in first to call get_recommendations.';
  end if;

  if v_user_id <> auth.uid() then
    raise exception 'forbidden_submission_access'
      using errcode = '42501', hint = 'You can only request your own submission.';
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
    ci.id,
    ci.title,
    ci.brand,
    ci.price_krw,
    ci.image_url,
    ci.tags,
    coalesce((
      select count(*)::int
      from unnest(ci.tags) as item_tag
      where item_tag = any(v_tags)
    ), 0) as match_score
  from public.catalog_items ci
  where ci.active = true
  order by match_score desc, ci.created_at desc
  limit v_final_limit;

  select greatest(0, v_final_limit - count(*)) into v_needed
  from tmp_ranked_recs;

  if v_needed > 0 then
    insert into tmp_ranked_recs (id, title, brand, price_krw, image_url, tags, match_score)
    select
      ci.id,
      ci.title,
      ci.brand,
      ci.price_krw,
      ci.image_url,
      ci.tags,
      0
    from public.catalog_items ci
    where ci.active = true
      and not exists (
        select 1 from tmp_ranked_recs t where t.id = ci.id
      )
    order by random()
    limit v_needed
    on conflict (id) do nothing;
  end if;

  return query
  select t.id, t.title, t.brand, t.price_krw, t.image_url, t.tags, t.match_score
  from tmp_ranked_recs t
  order by t.match_score desc, t.id
  limit v_final_limit;
end;
$$;

grant execute on function public.get_recommendations(uuid, int) to authenticated;
