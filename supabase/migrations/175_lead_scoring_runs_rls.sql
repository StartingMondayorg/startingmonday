-- SMK-470: enable RLS on lead_scoring_runs.
--
-- The table was created in 097_ticket6_15_automation_and_logs.sql without an
-- "enable row level security" line. Because public is exposed through
-- PostgREST and anon/authenticated hold full DML grants by default, anyone
-- holding the (public) anon key could read, insert, or delete rows directly.
-- The insert path matters most: trg_automation_alert_lead_scoring_runs fires
-- on insert or update, so a forged row injects fake alerts into the admin
-- monitoring dashboard.
--
-- Safe to apply: every code path uses the service role, which bypasses RLS.
-- Writes in src/lib/lead-scoring-runner.ts, and the only read is the admin CRM
-- page via createAdminClient().
--
-- Already enabled on startingmonday-prod out of band; this records that state
-- in source control and adds the deny-all policy convention from
-- 083_remaining_rls.sql. Idempotent, so it is safe to re-apply to prod.

alter table public.lead_scoring_runs enable row level security;

drop policy if exists "lead_scoring_runs_admin_only" on public.lead_scoring_runs;
create policy "lead_scoring_runs_admin_only" on public.lead_scoring_runs
  for all using (false);

revoke all on public.lead_scoring_runs from anon, authenticated;
