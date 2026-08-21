-- 158: Outcome labels — the closed prediction loop.
-- role_openings records verified role-opening observations from four labelers
-- (career_scan, exec_hire, user_pipeline, proxy_diff). event_outcome_labels
-- back-links precursor events to openings. precursor_stats holds the nightly
-- calibration aggregates (trade-secret dataset; service-role only).

create table if not exists public.role_openings (
  id uuid primary key default gen_random_uuid(),
  canonical_company_id uuid not null references public.canonical_companies(id) on delete cascade,
  role_family text not null,
  role_title text,
  opened_on date not null,
  detected_at timestamptz not null default now(),
  label_source text not null,
  source_ref text,
  exclude_from_public_stats boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists role_openings_company_idx
  on public.role_openings (canonical_company_id, opened_on desc);
create index if not exists role_openings_source_ref_idx
  on public.role_openings (label_source, source_ref);

alter table public.role_openings enable row level security;

create table if not exists public.event_outcome_labels (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.company_events(id) on delete cascade,
  opening_id uuid not null references public.role_openings(id) on delete cascade,
  days_to_opening int not null,
  created_at timestamptz not null default now(),
  unique (event_id, opening_id)
);

create index if not exists event_outcome_labels_event_idx
  on public.event_outcome_labels (event_id);

alter table public.event_outcome_labels enable row level security;

create table if not exists public.precursor_stats (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  sector text,
  role_family text,
  window_days int not null default 90,
  n_events int not null,
  n_preceded int not null,
  hit_rate numeric not null,
  median_days_to_opening numeric,
  computed_at timestamptz not null default now(),
  unique (event_type, sector, role_family, window_days)
);

alter table public.precursor_stats enable row level security;

-- Officer snapshots from DEF 14A filings (T2.4). One row per CIK + accession.
create table if not exists public.officer_snapshots (
  id uuid primary key default gen_random_uuid(),
  sec_cik_padded text not null,
  accession_number text not null,
  filing_date date,
  officers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (sec_cik_padded, accession_number)
);

create index if not exists officer_snapshots_cik_idx
  on public.officer_snapshots (sec_cik_padded, filing_date desc);

alter table public.officer_snapshots enable row level security;

-- Service-role only for all four tables: RLS enabled with no user policies.
