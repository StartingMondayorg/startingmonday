-- 169: Versioned backtest matching dimensions for WS2-08.
-- Preserves v1 cohorts while enabling a v2 cohort per opening with explicit
-- broad-sector, size-band, match-tier, and exclusion-denominator evidence.

alter table public.canonical_companies
  add column if not exists broad_sector_slug text,
  add column if not exists size_band text,
  add column if not exists matching_dimension_version text;

alter table public.canonical_companies
  drop constraint if exists canonical_companies_broad_sector_slug_check,
  add constraint canonical_companies_broad_sector_slug_check check (
    broad_sector_slug is null or broad_sector_slug in (
      'financial-services',
      'healthcare',
      'technology',
      'retail-consumer',
      'industrial-energy',
      'media-telecom',
      'professional-services',
      'public-sector'
    )
  ),
  drop constraint if exists canonical_companies_size_band_check,
  add constraint canonical_companies_size_band_check check (
    size_band is null or size_band in ('startup', 'midmarket', 'enterprise')
  );

create index if not exists canonical_companies_matching_dimensions_idx
  on public.canonical_companies (broad_sector_slug, size_band);

alter table public.backtest_cohorts
  add column if not exists broad_sector_slug text,
  add column if not exists size_band text,
  add column if not exists matching_policy_version text;

alter table public.backtest_cohorts
  drop constraint if exists backtest_cohorts_opening_id_key,
  drop constraint if exists backtest_cohorts_opening_version_key,
  add constraint backtest_cohorts_opening_version_key unique (opening_id, cohort_version),
  drop constraint if exists backtest_cohorts_matching_dimensions_check,
  add constraint backtest_cohorts_matching_dimensions_check check (
    cohort_version = 'v1'
    or (broad_sector_slug is not null and matching_policy_version is not null)
  );

create index if not exists backtest_cohorts_version_dimensions_idx
  on public.backtest_cohorts (cohort_version, broad_sector_slug, size_band, opened_on desc);

alter table public.backtest_controls
  add column if not exists broad_sector_slug text,
  add column if not exists match_tier text,
  add column if not exists matching_policy_version text;

alter table public.backtest_controls
  drop constraint if exists backtest_controls_match_tier_check,
  add constraint backtest_controls_match_tier_check check (
    match_tier is null or match_tier in ('broad_sector_size', 'broad_sector_size_unknown')
  ),
  drop constraint if exists backtest_controls_matching_evidence_check,
  add constraint backtest_controls_matching_evidence_check check (
    (matching_policy_version is null and match_tier is null)
    or (
      matching_policy_version is not null
      and match_tier is not null
      and broad_sector_slug is not null
    )
  );

create table if not exists public.backtest_cohort_build_runs (
  id uuid primary key default gen_random_uuid(),
  cohort_version text not null,
  matching_policy_version text not null,
  scanned_opening_count int not null default 0,
  included_cohort_count int not null default 0,
  excluded_cohort_count int not null default 0,
  exclusion_reasons jsonb not null default '{}'::jsonb,
  controls_per_cohort smallint not null default 3,
  status text not null default 'running' check (status in ('running', 'complete', 'failed')),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint backtest_cohort_build_runs_counts_check check (
    scanned_opening_count >= 0
    and included_cohort_count >= 0
    and excluded_cohort_count >= 0
    and controls_per_cohort > 0
    and included_cohort_count + excluded_cohort_count <= scanned_opening_count
  )
);

create index if not exists backtest_cohort_build_runs_started_idx
  on public.backtest_cohort_build_runs (cohort_version, started_at desc);

alter table public.backtest_cohort_build_runs enable row level security;

alter table public.backtest_replay_runs
  add column if not exists cohort_build_run_id uuid references public.backtest_cohort_build_runs(id) on delete set null,
  add column if not exists candidate_cohort_count int not null default 0,
  add column if not exists excluded_cohort_count int not null default 0,
  add column if not exists exclusion_reasons jsonb not null default '{}'::jsonb,
  add column if not exists controls_per_cohort smallint not null default 3,
  add column if not exists matching_policy_version text;

alter table public.backtest_replay_runs
  drop constraint if exists backtest_replay_runs_matching_counts_check,
  add constraint backtest_replay_runs_matching_counts_check check (
    matching_policy_version is null
    or (
      candidate_cohort_count >= 0
      and excluded_cohort_count >= 0
      and controls_per_cohort > 0
      and cohort_count + excluded_cohort_count <= candidate_cohort_count
      and (
        status <> 'complete'
        or control_count = cohort_count * controls_per_cohort
      )
    )
  );