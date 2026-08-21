-- SEC ingestion observability and freshness alert state.

create table if not exists public.sec_ingestion_runs (
  id                   uuid primary key default gen_random_uuid(),
  source               text not null,
  status               text not null check (status in ('running', 'success', 'error', 'stale', 'fresh')),
  company_id           uuid references public.companies(id) on delete set null,
  company_name         text,
  company_cik          text,
  started_at           timestamptz not null default now(),
  finished_at          timestamptz,
  filings_considered   integer not null default 0,
  filings_indexed      integer not null default 0,
  sec_articles         integer not null default 0,
  signals_emitted      integer not null default 0,
  latest_filing_date   date,
  latest_ingested_at   timestamptz,
  error_message        text,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_sec_ingestion_runs_source_started
  on public.sec_ingestion_runs (source, started_at desc);

create index if not exists idx_sec_ingestion_runs_company_started
  on public.sec_ingestion_runs (company_id, started_at desc)
  where company_id is not null;

create index if not exists idx_sec_ingestion_runs_status_started
  on public.sec_ingestion_runs (status, started_at desc);

create table if not exists public.sec_freshness_audit_state (
  id                      smallint primary key default 1 check (id = 1),
  last_status             text not null default 'unknown' check (last_status in ('unknown', 'fresh', 'stale')),
  last_checked_at         timestamptz,
  last_stale_alert_at     timestamptz,
  last_recovery_alert_at  timestamptz,
  last_details            jsonb not null default '{}'::jsonb,
  updated_at              timestamptz not null default now()
);

insert into public.sec_freshness_audit_state (id, last_status)
values (1, 'unknown')
on conflict (id) do nothing;
