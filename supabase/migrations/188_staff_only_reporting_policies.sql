-- Staff-only access to internal reporting tables.
--
-- Migrations 110, 111, 115, 116, 151 and 152 created "Staff read ..." policies
-- with no `to` clause and `using (true)`, so they applied to every role,
-- including anon. On 2026-10-22, production returned rows to unauthenticated
-- PostgREST requests made with the public anon key (emi_kpi_snapshots 112,
-- tier1_claims 12, proof_assets 3, onboarding_qa_weekly_scorecards 1).
-- Migration 118 also let any authenticated user insert and update
-- emi_kpi_snapshots.
--
-- Staff are identified the same way the app does (src/lib/staff.ts): the
-- signed-in user's email is in staff_members. This also requires the email to
-- be confirmed. Admin pages and the automation service token use the service
-- role and are unaffected.

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members s
    join auth.users u on lower(u.email) = lower(s.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated, service_role;

drop policy if exists "Staff read intelligence QA scorecards" on public.intelligence_qa_weekly_scorecards;
create policy "Staff read intelligence QA scorecards"
  on public.intelligence_qa_weekly_scorecards for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff read onboarding QA scorecards" on public.onboarding_qa_weekly_scorecards;
create policy "Staff read onboarding QA scorecards"
  on public.onboarding_qa_weekly_scorecards for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff read EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Staff read EMI KPI snapshots"
  on public.emi_kpi_snapshots for select to authenticated
  using (public.is_staff());

drop policy if exists "Authenticated insert EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Staff insert EMI KPI snapshots"
  on public.emi_kpi_snapshots for insert to authenticated
  with check (public.is_staff());

drop policy if exists "Authenticated update EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Staff update EMI KPI snapshots"
  on public.emi_kpi_snapshots for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Staff read proof assets" on public.proof_assets;
create policy "Staff read proof assets"
  on public.proof_assets for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff read tier1 claims" on public.tier1_claims;
create policy "Staff read tier1 claims"
  on public.tier1_claims for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff read wedge funnel weekly scorecards" on public.wedge_funnel_weekly_scorecards;
create policy "Staff read wedge funnel weekly scorecards"
  on public.wedge_funnel_weekly_scorecards for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff read wedge funnel cron runs" on public.wedge_funnel_scorecard_cron_runs;
create policy "Staff read wedge funnel cron runs"
  on public.wedge_funnel_scorecard_cron_runs for select to authenticated
  using (public.is_staff());

revoke all on table
  public.intelligence_qa_weekly_scorecards,
  public.onboarding_qa_weekly_scorecards,
  public.emi_kpi_snapshots,
  public.proof_assets,
  public.tier1_claims,
  public.wedge_funnel_weekly_scorecards,
  public.wedge_funnel_scorecard_cron_runs
from anon;
