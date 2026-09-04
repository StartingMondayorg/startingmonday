-- SMK-445: EMI KPI metric correctness fixes.
--
-- Apply manually via the Supabase SQL editor, staging first, then prod,
-- and only after orchestrator/Chris approval.
--
-- ORDERING: apply this migration BEFORE deploying the SMK-445 application
-- code. The widened metric_status constraint must exist before the weekly
-- KPI job writes its first 'insufficient_data' row, and the RPCs below must
-- exist before the job calls them.

-- ---------------------------------------------------------------------------
-- 1. Synthetic/monitor account tagging (defect 4).
--    Monitoring and probe accounts generate hundreds of events per day and
--    swamp every denominator computed from user_events.
-- ---------------------------------------------------------------------------

alter table public.users
  add column if not exists is_synthetic boolean not null default false;

comment on column public.users.is_synthetic is
  'True for synthetic/monitoring accounts (uptime probes, smoke tests). Excluded from all EMI KPI denominators (SMK-445).';

update public.users
  set is_synthetic = true
  where lower(email) = 'prod-probe@startingmonday.app';

-- ---------------------------------------------------------------------------
-- 2. Widen the metric_status check constraint (defect 5).
--    'insufficient_data' marks a computed ratio whose denominator is below
--    the minimum-sample floor (20 non-synthetic users). Such rows keep their
--    computed value but are excluded from pass/fail scoring.
-- ---------------------------------------------------------------------------

alter table public.emi_kpi_snapshots
  drop constraint if exists emi_kpi_snapshots_metric_status_check;

alter table public.emi_kpi_snapshots
  add constraint emi_kpi_snapshots_metric_status_check
  check (metric_status in ('ok', 'no_data', 'query_error', 'insufficient_data'));

-- ---------------------------------------------------------------------------
-- 3. Annotate historical snapshots rather than rewriting them (acceptance:
--    trend lines must not silently mix pre-fix and post-fix methodology).
--    Values are retained verbatim; the flag marks them as computed with the
--    defective pre-SMK-445 method (truncated denominators, dead source table,
--    rolling immature cohorts, synthetic traffic included).
-- ---------------------------------------------------------------------------

alter table public.emi_kpi_snapshots
  add column if not exists quality_flag text;

comment on column public.emi_kpi_snapshots.quality_flag is
  'Data-quality annotation. pre_smk445_defective_method: row computed before the SMK-445 correctness fixes; do not trend against post-fix rows. Null: computed with the corrected method.';

update public.emi_kpi_snapshots
  set quality_flag = 'pre_smk445_defective_method'
  where quality_flag is null;

-- ---------------------------------------------------------------------------
-- 4. Server-side aggregate RPCs (defect 1, 2, 3).
--    Replaces the pull-all-rows-and-dedupe-client-side pattern that PostgREST
--    silently truncated. Both functions exclude synthetic accounts and
--    guarantee numerator <= denominator (numerator users are drawn from the
--    denominator set), so no ratio can exceed 100 percent.
-- ---------------------------------------------------------------------------

create or replace function public.emi_kpi_event_funnel(
  p_start timestamptz,
  p_end timestamptz,
  p_denominator_events text[],
  p_numerator_events text[]
)
returns table (denominator bigint, numerator bigint)
language sql
stable
security definer
set search_path = public
as $$
  with denom as (
    select distinct e.user_id
    from public.user_events e
    where e.created_at >= p_start
      and e.created_at <= p_end
      and (p_denominator_events is null or e.event_name = any(p_denominator_events))
      and not exists (
        select 1 from public.users u
        where u.id = e.user_id and u.is_synthetic
      )
  ),
  numer as (
    select distinct e.user_id
    from public.user_events e
    join denom d on d.user_id = e.user_id
    where e.created_at >= p_start
      and e.created_at <= p_end
      and e.event_name = any(p_numerator_events)
  )
  select
    (select count(*) from denom) as denominator,
    (select count(*) from numer) as numerator;
$$;

comment on function public.emi_kpi_event_funnel(timestamptz, timestamptz, text[], text[]) is
  'SMK-445: distinct-user funnel over user_events for a window. Null denominator events = any event. Excludes users.is_synthetic. Numerator is intersected with the denominator set so it can never exceed it.';

-- Fixed weekly day-7 return cohort (defect 3). The cohort is users whose
-- FIRST-EVER activation event falls inside [p_cohort_start, p_cohort_end];
-- a user counts as returned if any event lands 1 to 7 days after that first
-- activation. Callers must only pass cohort windows that closed at least
-- 7 days before the reporting time (maturity is the caller's contract).
create or replace function public.emi_kpi_day7_cohort(
  p_cohort_start timestamptz,
  p_cohort_end timestamptz
)
returns table (activated bigint, returned bigint)
language sql
stable
security definer
set search_path = public
as $$
  with first_activation as (
    select e.user_id, min(e.created_at) as activated_at
    from public.user_events e
    where e.event_name in ('onboarding_started', 'emi_onboarding_started')
      and not exists (
        select 1 from public.users u
        where u.id = e.user_id and u.is_synthetic
      )
    group by e.user_id
  ),
  cohort as (
    select user_id, activated_at
    from first_activation
    where activated_at >= p_cohort_start
      and activated_at <= p_cohort_end
  ),
  returned_users as (
    select distinct c.user_id
    from cohort c
    join public.user_events e on e.user_id = c.user_id
    where e.created_at >= c.activated_at + interval '1 day'
      and e.created_at <= c.activated_at + interval '7 days'
  )
  select
    (select count(*) from cohort) as activated,
    (select count(*) from returned_users) as returned;
$$;

comment on function public.emi_kpi_day7_cohort(timestamptz, timestamptz) is
  'SMK-445: fixed weekly activation cohort day-7 return aggregate. Cohort membership is by first-ever activation event; excludes users.is_synthetic; returned is a subset of activated.';

-- Aggregates only, but lock execution down to authenticated staff jobs and
-- service role; these run as security definer over RLS-protected tables.
revoke all on function public.emi_kpi_event_funnel(timestamptz, timestamptz, text[], text[]) from public, anon;
revoke all on function public.emi_kpi_day7_cohort(timestamptz, timestamptz) from public, anon;
grant execute on function public.emi_kpi_event_funnel(timestamptz, timestamptz, text[], text[]) to authenticated, service_role;
grant execute on function public.emi_kpi_day7_cohort(timestamptz, timestamptz) to authenticated, service_role;
