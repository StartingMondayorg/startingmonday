-- Shared fixed-window rate-limit counters (code review 2026-10-22, P1-9).
--
-- src/lib/rate-limit.ts and src/lib/burst-limit.ts protect login, signup,
-- the public endpoint guard and the paid LLM routes. Their shared path used
-- check_and_increment_rate_limit (migration 018), which anon and
-- authenticated can execute, so anyone holding the public anon key could
-- increment another client's counter (for example `login_submit:<ip>`) and
-- lock that client out. Every caller also fell back to a per-process Map
-- silently, and minute windows were stored as text periods that were never
-- deleted.
--
-- This migration adds a service-role-only counter table and function. The
-- app falls back to its in-memory limiter, with a logged warning, until this
-- migration is applied, so deploy order does not matter.
--
-- Keys are namespaced by the app (`rl:`, `burst:`). Email addresses inside a
-- key are hashed by the app before they reach this table.

create table if not exists public.rate_limit_counters (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (key, window_start)
);

comment on table public.rate_limit_counters is
  'Fixed-window request counters for app rate limits. Written only through public.check_rate_limit by the service role.';

-- Supports the opportunistic cleanup of expired windows below.
create index if not exists rate_limit_counters_window_start_idx
  on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;

revoke all on table public.rate_limit_counters from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limit_counters to service_role;

-- Atomically counts one request against p_key in the current fixed window of
-- p_window_seconds and reports whether it is within p_max.
create or replace function public.check_rate_limit(
  p_key            text,
  p_window_seconds integer,
  p_max            integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now          timestamptz := pg_catalog.now();
  v_window_start timestamptz;
  v_count        integer;
begin
  if p_key is null or pg_catalog.length(p_key) = 0 or pg_catalog.length(p_key) > 512 then
    raise exception 'check_rate_limit: p_key must be 1-512 characters'
      using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'check_rate_limit: p_window_seconds must be between 1 and 86400'
      using errcode = '22023';
  end if;
  if p_max is null or p_max < 1 then
    raise exception 'check_rate_limit: p_max must be at least 1'
      using errcode = '22023';
  end if;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters as c (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = c.count + 1
  returning c.count into v_count;

  -- About 1 call in 100 deletes up to 1000 windows that ended more than a day
  -- ago. Windows are at most one day long, so nothing live is removed.
  if pg_catalog.random() < 0.01 then
    delete from public.rate_limit_counters d
    using (
      select e.key, e.window_start
      from public.rate_limit_counters e
      where e.window_start < v_now - interval '2 days'
      limit 1000
    ) expired
    where d.key = expired.key
      and d.window_start = expired.window_start;
  end if;

  allowed := v_count <= p_max;
  remaining := greatest(p_max - v_count, 0);
  reset_at := v_window_start + pg_catalog.make_interval(secs => p_window_seconds);
  return next;
end;
$$;

comment on function public.check_rate_limit(text, integer, integer) is
  'Service-role only. Increments the fixed-window counter for p_key and returns allowed, remaining and reset_at.';

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
