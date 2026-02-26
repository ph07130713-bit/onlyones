-- Core domain tables for profiles, quiz, products, recommendations, and orders

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  type text not null check (type in ('single', 'multi', 'scale')),
  options jsonb,
  order_index integer not null
);

create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  answer jsonb not null,
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  price_cents integer not null,
  images jsonb,
  tags text[],
  attributes jsonb,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  score double precision not null,
  reason text,
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'paid', 'failed')),
  items jsonb not null,
  amount_cents integer not null,
  currency text not null,
  polar_checkout_id text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists quiz_questions_order_index_idx
  on quiz_questions(order_index);

create index if not exists quiz_answers_user_id_idx
  on quiz_answers(user_id);
create index if not exists quiz_answers_created_at_idx
  on quiz_answers(created_at);

create index if not exists products_created_at_idx
  on products(created_at);
create index if not exists products_active_idx
  on products(active);

create index if not exists recommendations_user_id_idx
  on recommendations(user_id);
create index if not exists recommendations_created_at_idx
  on recommendations(created_at);

create index if not exists orders_user_id_idx
  on orders(user_id);
create index if not exists orders_created_at_idx
  on orders(created_at);

alter table profiles enable row level security;
alter table quiz_answers enable row level security;
alter table recommendations enable row level security;
alter table orders enable row level security;
alter table quiz_questions enable row level security;
alter table products enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "quiz_answers_select_own"
  on quiz_answers for select
  using (auth.uid() = user_id);

create policy "quiz_answers_insert_own"
  on quiz_answers for insert
  with check (auth.uid() = user_id);

create policy "recommendations_select_own"
  on recommendations for select
  using (auth.uid() = user_id);

create policy "recommendations_insert_own"
  on recommendations for insert
  with check (auth.uid() = user_id);

create policy "orders_select_own"
  on orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "quiz_questions_select_all"
  on quiz_questions for select
  using (true);

create policy "products_select_all"
  on products for select
  using (true);
