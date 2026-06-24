create table if not exists public.player_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_email text not null,
  display_name text not null default 'Игрок',
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 3 and 1200),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_reviews enable row level security;

create policy "read own player reviews or admin"
  on public.player_reviews for select
  using (
    auth.uid() = user_id
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'aliyyaldiyar@gmail.com'
  );

create policy "insert own player reviews"
  on public.player_reviews for insert
  with check (
    auth.uid() = user_id
    and lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "admin update player reviews"
  on public.player_reviews for update
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'aliyyaldiyar@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'aliyyaldiyar@gmail.com');

create policy "admin delete player reviews"
  on public.player_reviews for delete
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'aliyyaldiyar@gmail.com');

create or replace function public.touch_player_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_reviews_touch_updated_at on public.player_reviews;
create trigger player_reviews_touch_updated_at
before update on public.player_reviews
for each row
execute function public.touch_player_reviews_updated_at();
