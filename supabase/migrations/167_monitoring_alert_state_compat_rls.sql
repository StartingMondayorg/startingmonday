alter table if exists public.monitoring_alert_state
  drop constraint if exists monitoring_alert_state_last_status_check;

alter table if exists public.monitoring_alert_state
  add constraint monitoring_alert_state_last_status_check
  check (last_status in ('unknown', 'fresh', 'stale', 'deprecated-route-hit'));

alter table if exists public.monitoring_alert_state enable row level security;