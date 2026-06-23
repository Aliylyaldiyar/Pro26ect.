-- Cloud progress for authenticated players: completed levels and achievement counters.
alter table public.retention_profiles
  add column if not exists completed_level_ids integer[] not null default '{}',
  add column if not exists achievement_stats jsonb not null default '{}'::jsonb;
