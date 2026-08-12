create table if not exists public.monitoring_alert_state (
  alert_key text primary key,
  last_status text not null default 'unknown' check (last_status in ('unknown', 'fresh', 'stale', 'deprecated-route-hit')),
  last_checked_at timestamptz,
  last_stale_alert_at timestamptz,
  last_recovery_alert_at timestamptz,
  last_details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists monitoring_alert_state_updated_idx
  on public.monitoring_alert_state(updated_at desc);

alter table public.monitoring_alert_state enable row level security;
