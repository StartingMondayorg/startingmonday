# 169_backtest_matching_dimensions rollback

Goal:
- Remove the WS2-08 v2 matching-dimension schema if dimension reconciliation,
  cohort inclusion, or replay denominator reporting is incorrect.

Risk triggers:
- Broad-sector normalization produces material cross-sector matches.
- Size conflicts are silently converted to a known value.
- A v2 replay includes a cohort with fewer than three controls.
- Replay exclusion counts do not reconcile to the scanned opening denominator.

Pre-rollback safety checks:
- Export v2 cohort, control, and replay rows for investigation.
- Stop cohort-builder and pattern-backtest jobs with their existing advisory locks.
- Confirm no customer-facing reader consumes v2 backtest rows.
- Preserve all v1 rows and pattern evidence.

Rollback SQL:
```sql
begin;

delete from public.pattern_backtests
where cohort_version <> 'v1';

delete from public.backtest_replay_runs
where cohort_version <> 'v1';

delete from public.backtest_cohorts
where cohort_version <> 'v1';

alter table public.backtest_cohorts
  drop constraint if exists backtest_cohorts_opening_version_key,
  drop constraint if exists backtest_cohorts_matching_dimensions_check,
  add constraint backtest_cohorts_opening_id_key unique (opening_id),
  drop column if exists broad_sector_slug,
  drop column if exists size_band,
  drop column if exists matching_policy_version;

drop index if exists public.backtest_cohorts_version_dimensions_idx;

alter table public.backtest_controls
  drop constraint if exists backtest_controls_match_tier_check,
  drop constraint if exists backtest_controls_matching_evidence_check,
  drop column if exists broad_sector_slug,
  drop column if exists match_tier,
  drop column if exists matching_policy_version;

alter table public.backtest_replay_runs
  drop constraint if exists backtest_replay_runs_matching_counts_check,
  drop column if exists cohort_build_run_id,
  drop column if exists candidate_cohort_count,
  drop column if exists excluded_cohort_count,
  drop column if exists exclusion_reasons,
  drop column if exists controls_per_cohort,
  drop column if exists matching_policy_version;

drop table if exists public.backtest_cohort_build_runs;

drop index if exists public.canonical_companies_matching_dimensions_idx;

alter table public.canonical_companies
  drop constraint if exists canonical_companies_broad_sector_slug_check,
  drop constraint if exists canonical_companies_size_band_check,
  drop column if exists broad_sector_slug,
  drop column if exists size_band,
  drop column if exists matching_dimension_version;

commit;
```

Validation queries:
```sql
select count(*) as non_v1_cohorts
from public.backtest_cohorts
where cohort_version <> 'v1';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('canonical_companies', 'backtest_cohorts', 'backtest_controls', 'backtest_replay_runs')
  and column_name in (
    'broad_sector_slug',
    'size_band',
    'matching_dimension_version',
    'matching_policy_version',
    'match_tier',
    'cohort_build_run_id',
    'candidate_cohort_count',
    'excluded_cohort_count',
    'exclusion_reasons',
    'controls_per_cohort'
  );

-- After rollback: non_v1_cohorts = 0 and the column query returns zero rows.

select to_regclass('public.backtest_cohort_build_runs') is null as build_run_table_removed;
```

Forward-fix plan:
- Correct the deterministic mapping or inclusion policy in isolation.
- Reapply migration 169.
- Reconcile dimensions and build a new cohort version; never overwrite v1 evidence.
- Require complete candidate, exclusion, cohort, and control denominators before replay acceptance.