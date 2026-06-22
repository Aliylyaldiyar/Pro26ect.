-- Retention profile: streak, XP, daily challenge counters, and leaderboard source.
create table if not exists public.retention_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Игрок',
  xp integer not null default 0 check (xp >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_check_in_date date,
  best_wave integer not null default 0 check (best_wave >= 0),
  total_kills integer not null default 0 check (total_kills >= 0),
  daily_challenge_date date,
  daily_kills integer not null default 0 check (daily_kills >= 0),
  daily_waves integer not null default 0 check (daily_waves >= 0),
  daily_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.retention_profiles enable row level security;

create policy "read own retention profile"
  on public.retention_profiles for select
  using (auth.uid() = user_id);

create policy "insert own retention profile"
  on public.retention_profiles for insert
  with check (auth.uid() = user_id);

create policy "update own retention profile"
  on public.retention_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_retention_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists retention_profiles_touch_updated_at on public.retention_profiles;
create trigger retention_profiles_touch_updated_at
before update on public.retention_profiles
for each row
execute function public.touch_retention_updated_at();

create or replace function public.get_retention_leaderboard()
returns table (
  display_name text,
  xp integer,
  streak_days integer,
  best_wave integer,
  total_kills integer
)
language sql
security definer
set search_path = public
as $$
  select
    retention_profiles.display_name,
    retention_profiles.xp,
    retention_profiles.streak_days,
    retention_profiles.best_wave,
    retention_profiles.total_kills
  from public.retention_profiles
  order by retention_profiles.xp desc, retention_profiles.best_wave desc, retention_profiles.streak_days desc
  limit 20;
$$;

grant execute on function public.get_retention_leaderboard() to anon, authenticated;
