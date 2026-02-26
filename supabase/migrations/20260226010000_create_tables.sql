create table if not exists users (
  id text primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  quiz_completed boolean default false,
  subscription_status text default 'none'
);

-- RLS is intentionally disabled for local/dev convenience.
-- Enable later if needed:
-- alter table users enable row level security;

create table if not exists style_profiles (
  user_id text references users(id),
  size_top text,
  size_bottom text,
  fit text,
  price_min int,
  price_max int,
  style_tags text[],
  color_tags text[],
  avoid_tags text[],
  primary key(user_id)
);

-- RLS is intentionally disabled for local/dev convenience.
-- Enable later if needed:
-- alter table style_profiles enable row level security;

create table if not exists feedback (
  id bigserial primary key,
  user_id text references users(id),
  item_id text,
  liked boolean,
  created_at timestamp with time zone default timezone('utc', now())
);

-- RLS is intentionally disabled for local/dev convenience.
-- Enable later if needed:
-- alter table feedback enable row level security;

create index if not exists feedback_user_id_idx on feedback(user_id);
create index if not exists feedback_item_id_idx on feedback(item_id);
create index if not exists style_profiles_user_id_idx on style_profiles(user_id);
