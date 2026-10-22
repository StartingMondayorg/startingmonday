# Rollback playbook: 188_staff_only_reporting_policies

## Goal

Restore staff-session access to the internal reporting tables if migration 188 blocks a legitimate staff read or KPI write, without reopening them to anonymous visitors.

## Risk triggers

- A staff member using their own session (not the automation service token) gets empty results or a 403 from `/api/admin/automation/reporting/*`.
- `weekly-kpi-summaries` fails to upsert `emi_kpi_snapshots` with an RLS error.
- `public.is_staff()` returns false for a staff member, for example because their email in `staff_members` differs from their auth email, or their email is unconfirmed.

## Pre-rollback safety checks

```sql
-- Does the affected user resolve as staff?
select u.id, u.email, u.email_confirmed_at, s.role
from auth.users u
left join public.staff_members s on lower(s.email) = lower(u.email)
where lower(u.email) = lower('<staff email>');
```

If `s.role` is null, fix the `staff_members` row rather than rolling back. If `email_confirmed_at` is null, confirm the email.

## Rollback SQL

Do not restore the original `using (true)` policies without a `to` clause, because they exposed these tables to anonymous visitors. Use this interim state instead: any signed-in user can read, and anonymous visitors cannot.

```sql
drop policy if exists "Staff read intelligence QA scorecards" on public.intelligence_qa_weekly_scorecards;
create policy "Staff read intelligence QA scorecards" on public.intelligence_qa_weekly_scorecards for select to authenticated using (true);
drop policy if exists "Staff read onboarding QA scorecards" on public.onboarding_qa_weekly_scorecards;
create policy "Staff read onboarding QA scorecards" on public.onboarding_qa_weekly_scorecards for select to authenticated using (true);
drop policy if exists "Staff read EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Staff read EMI KPI snapshots" on public.emi_kpi_snapshots for select to authenticated using (true);
drop policy if exists "Staff insert EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Authenticated insert EMI KPI snapshots" on public.emi_kpi_snapshots for insert to authenticated with check (true);
drop policy if exists "Staff update EMI KPI snapshots" on public.emi_kpi_snapshots;
create policy "Authenticated update EMI KPI snapshots" on public.emi_kpi_snapshots for update to authenticated using (true) with check (true);
drop policy if exists "Staff read proof assets" on public.proof_assets;
create policy "Staff read proof assets" on public.proof_assets for select to authenticated using (true);
drop policy if exists "Staff read tier1 claims" on public.tier1_claims;
create policy "Staff read tier1 claims" on public.tier1_claims for select to authenticated using (true);
drop policy if exists "Staff read wedge funnel weekly scorecards" on public.wedge_funnel_weekly_scorecards;
create policy "Staff read wedge funnel weekly scorecards" on public.wedge_funnel_weekly_scorecards for select to authenticated using (true);
drop policy if exists "Staff read wedge funnel cron runs" on public.wedge_funnel_scorecard_cron_runs;
create policy "Staff read wedge funnel cron runs" on public.wedge_funnel_scorecard_cron_runs for select to authenticated using (true);
```

`public.is_staff()` can stay; nothing else depends on it.

## Validation queries

```sql
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('intelligence_qa_weekly_scorecards','onboarding_qa_weekly_scorecards','emi_kpi_snapshots',
                    'proof_assets','tier1_claims','wedge_funnel_weekly_scorecards','wedge_funnel_scorecard_cron_runs')
order by tablename, policyname;
```

Anonymous check: `HEAD <SUPABASE_URL>/rest/v1/<table>?select=*` with the anon key and `Prefer: count=exact` must return `Content-Range: */0` or a 401 for every table above.

## Forward-fix plan

Correct the `staff_members` row or the staff email confirmation, then re-apply migration 188's policies.
