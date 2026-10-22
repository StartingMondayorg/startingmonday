-- P1b (simplification R-1): the weekly search summary email becomes opt-in, off by default.
-- Read by worker/jobs/weekly-report-job.js; toggled from Settings > Email preferences.
alter table public.user_profiles
  add column if not exists weekly_summary_opt_in boolean not null default false;

comment on column public.user_profiles.weekly_summary_opt_in is
  'When true, the user receives the Sunday-night weekly search summary email. Off by default (2026-10-21).';
