-- Timed retention challenges: weekly tasks and one hard monthly task.
alter table public.retention_profiles
  add column if not exists weekly_challenge_date date,
  add column if not exists weekly_kills integer not null default 0 check (weekly_kills >= 0),
  add column if not exists weekly_waves integer not null default 0 check (weekly_waves >= 0),
  add column if not exists weekly_completed boolean not null default false,
  add column if not exists monthly_challenge_date date,
  add column if not exists monthly_kills integer not null default 0 check (monthly_kills >= 0),
  add column if not exists monthly_waves integer not null default 0 check (monthly_waves >= 0),
  add column if not exists monthly_completed boolean not null default false;
