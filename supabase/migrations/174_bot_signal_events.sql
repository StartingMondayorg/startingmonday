-- SMK-467: bot traffic observability.
--
-- Records the outcome of every request that passes through
-- enforcePublicEndpointGuard so we can tell whether bot traffic is becoming a
-- real problem. Observation only: nothing here blocks or challenges a request.
--
-- Privacy: raw IP addresses are never stored. The app writes a salted SHA-256
-- of the address and a second hash of the /24 (v4) or /48 (v6) prefix, which
-- lets us group an attacker across a subnet without retaining the addresses
-- themselves. Rows are pruned after 30 days by prune_bot_signal_events().

create table if not exists public.bot_signal_events (
  id              bigserial   primary key,
  occurred_at     timestamptz not null default now(),
  route           text        not null,
  rate_limit_key  text        not null,
  ip_hash         text,
  ip_prefix_hash  text,
  outcome         text        not null default 'allowed'
                    check (outcome in (
                      'allowed',
                      'rate_limited',
                      'captcha_missing',
                      'captcha_failed',
                      'captcha_unavailable'
                    )),
  user_agent      text,
  ua_class        text        not null default 'unknown'
                    check (ua_class in ('browser', 'known_bot', 'scripted', 'empty', 'unknown')),
  bot_score       smallint    not null default 0 check (bot_score between 0 and 100),
  country         text,
  details         jsonb       not null default '{}'::jsonb
);

-- Dashboard and alert queries are all "recent rows, filtered by time".
create index if not exists bot_signal_events_occurred_idx
  on public.bot_signal_events (occurred_at desc);

-- Alert query: suspected-bot volume in a window.
create index if not exists bot_signal_events_score_occurred_idx
  on public.bot_signal_events (bot_score, occurred_at desc);

-- Alert query: per-subnet concentration on auth routes.
create index if not exists bot_signal_events_prefix_occurred_idx
  on public.bot_signal_events (ip_prefix_hash, occurred_at desc)
  where ip_prefix_hash is not null;

-- Dashboard query: rejections by route.
create index if not exists bot_signal_events_outcome_occurred_idx
  on public.bot_signal_events (outcome, occurred_at desc);

alter table public.bot_signal_events enable row level security;

-- No policies are defined on purpose. Only the service role (which bypasses
-- RLS) writes these rows and reads them for the admin dashboard. There is no
-- legitimate reason for an end user to read this table.

-- Retention. Called by /api/cron/bot-traffic-alert on each run so the table
-- cannot grow unbounded the way public.rate_limits has since migration 018.
create or replace function public.prune_bot_signal_events(p_retain_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.bot_signal_events
  where occurred_at < now() - make_interval(days => greatest(p_retain_days, 1));

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Only the service role calls this. The explicit grant is belt-and-braces: the
-- revoke below strips PUBLIC, and we do not want to rely on Supabase default
-- privileges to have already granted service_role separately.
revoke execute on function public.prune_bot_signal_events(integer) from public, anon, authenticated;
grant execute on function public.prune_bot_signal_events(integer) to service_role;

-- Hourly rollup used by both the dashboard chart and the alert baseline, so the
-- number that fires an alert and the number drawn on screen come from one place.
create or replace function public.bot_signal_hourly_rollup(p_hours integer default 168)
returns table (
  bucket          timestamptz,
  total_requests  bigint,
  bot_requests    bigint,
  rate_limited    bigint
)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('hour', occurred_at)                             as bucket,
    count(*)                                                    as total_requests,
    count(*) filter (where bot_score >= 60)                      as bot_requests,
    count(*) filter (where outcome = 'rate_limited')             as rate_limited
  from public.bot_signal_events
  where occurred_at >= now() - make_interval(hours => greatest(p_hours, 1))
  group by 1
  order by 1;
$$;

revoke execute on function public.bot_signal_hourly_rollup(integer) from public, anon, authenticated;
grant execute on function public.bot_signal_hourly_rollup(integer) to service_role;
