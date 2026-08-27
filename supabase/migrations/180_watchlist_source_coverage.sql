-- WS11-01/02/03: Watchlist-scoped source coverage and search capacity.
-- Watchlists are product-local, service-role-only tables for account-monitoring
-- research (e.g. a sales territory) — distinct from the per-user `companies`
-- table and never exposed to anon/authenticated via PostgREST.

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist_entries (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  company_name text not null,
  domain text,
  sec_cik_padded text,
  ats_provider text,
  ats_board_token text,
  state text,
  canonical_company_id uuid references public.canonical_companies(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (watchlist_id, company_name)
);

create index if not exists watchlist_entries_watchlist_idx
  on public.watchlist_entries (watchlist_id) where active = true;
create index if not exists watchlist_entries_canonical_idx
  on public.watchlist_entries (canonical_company_id) where canonical_company_id is not null;

-- WS11-03: per (watchlist entry, source, run) coverage accounting.
-- coverage classifies whether the adapter call for this source returned
-- usable data (full), returned but yielded nothing new (thin), or errored
-- (failed). Acceptance target: >= 96% full per edition.
create table if not exists public.source_coverage (
  id uuid primary key default gen_random_uuid(),
  watchlist_entry_id uuid not null references public.watchlist_entries(id) on delete cascade,
  source text not null,
  run_id uuid not null,
  coverage text not null check (coverage in ('full', 'thin', 'failed')),
  error_class text,
  items_found int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists source_coverage_entry_source_idx
  on public.source_coverage (watchlist_entry_id, source, created_at desc);
create index if not exists source_coverage_run_idx
  on public.source_coverage (run_id);

-- WS11-01 kill switch: per-source adapter health. An adapter that fails
-- repeatedly (403/429s, bot-detection trips, OCR/parse garbage) auto-disables
-- and must be re-enabled by a human after review (mirrors the relationship
-- engine pilot's stop-condition/resume model).
create table if not exists public.adapter_health (
  source text primary key,
  enabled boolean not null default true,
  consecutive_failures int not null default 0,
  disabled_at timestamptz,
  disabled_reason text,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.watchlists enable row level security;
alter table public.watchlist_entries enable row level security;
alter table public.source_coverage enable row level security;
alter table public.adapter_health enable row level security;

drop policy if exists "watchlists_service_role_only" on public.watchlists;
create policy "watchlists_service_role_only" on public.watchlists
  for all using (false);
drop policy if exists "watchlist_entries_service_role_only" on public.watchlist_entries;
create policy "watchlist_entries_service_role_only" on public.watchlist_entries
  for all using (false);
drop policy if exists "source_coverage_service_role_only" on public.source_coverage;
create policy "source_coverage_service_role_only" on public.source_coverage
  for all using (false);
drop policy if exists "adapter_health_service_role_only" on public.adapter_health;
create policy "adapter_health_service_role_only" on public.adapter_health
  for all using (false);

revoke all on public.watchlists from anon, authenticated;
revoke all on public.watchlist_entries from anon, authenticated;
revoke all on public.source_coverage from anon, authenticated;
revoke all on public.adapter_health from anon, authenticated;

create or replace function public.touch_watchlist_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_watchlists_updated_at on public.watchlists;
create trigger trg_watchlists_updated_at
before update on public.watchlists
for each row execute function public.touch_watchlist_updated_at();

drop trigger if exists trg_watchlist_entries_updated_at on public.watchlist_entries;
create trigger trg_watchlist_entries_updated_at
before update on public.watchlist_entries
for each row execute function public.touch_watchlist_updated_at();

revoke all on function public.touch_watchlist_updated_at() from public, anon, authenticated;
