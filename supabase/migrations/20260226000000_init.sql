-- Users
create table if not exists users (
  id text primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  quiz_completed boolean default false,
  subscription_status text default 'none'
);

-- StyleProfiles
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

-- Feedback
create table if not exists feedback (
  id bigserial primary key,
  user_id text references users(id),
  item_id text,
  liked boolean,
  created_at timestamp with time zone default timezone('utc', now())
);
