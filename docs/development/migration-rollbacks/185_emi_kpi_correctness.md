# 185_emi_kpi_correctness rollback

Goal:
- Withdraw the SMK-445 EMI KPI correctness schema if it must be rolled back: drop the
  two aggregate RPCs, narrow the `emi_kpi_snapshots.metric_status` constraint back to
  its three-value set, and drop the `quality_flag` annotation column and the
  `users.is_synthetic` tagging column.

Risk triggers:
- The weekly KPI job records `query_error` for every user-denominated metric after
  deploy (RPC missing, renamed, or failing).
- `emi_kpi_snapshots` upserts fail on the `metric_status` check constraint (the
  SMK-445 code deployed before this migration was applied, or the constraint was
  narrowed while the new code is still live).
- `users` writes fail after the `is_synthetic` column change (not expected; the
  column is additive with a default).

Pre-rollback safety checks:
- Roll back the application code FIRST. The SMK-445 `weekly-kpi-summaries` route
  calls `emi_kpi_event_funnel` / `emi_kpi_day7_cohort` and writes
  `metric_status = 'insufficient_data'`; dropping the RPCs or narrowing the
  constraint while that code is deployed makes every weekly run fail.
- Re-label any `insufficient_data` snapshot rows before narrowing the constraint
  (the SQL below does this); the constraint change fails or strands rows otherwise.
- Decide whether the `quality_flag` annotations should be exported first. The column
  is annotate-only (no code writes it), so its rollback is a simple column drop, but
  dropping it discards the pre-fix/post-fix methodology marker that keeps trend lines
  honest. Prefer keeping the column even in a partial rollback.
- Confirm nothing but the two RPCs reads `users.is_synthetic` (true at time of
  writing; re-check with a repo grep before dropping).
- Record the migration SHA and rollback reason in the deployment log.

Rollback SQL:
```sql
-- 1. RPCs. Both are security definer; drop removes the definer execution path and
-- all granted execute rights with it. To disable without dropping, revoke instead:
--   revoke execute on function public.emi_kpi_event_funnel(timestamptz, timestamptz, text[], text[]) from authenticated;
--   revoke execute on function public.emi_kpi_day7_cohort(timestamptz, timestamptz) from authenticated;
drop function if exists public.emi_kpi_event_funnel(timestamptz, timestamptz, text[], text[]);
drop function if exists public.emi_kpi_day7_cohort(timestamptz, timestamptz);

-- 2. Narrow metric_status back to the pre-SMK-445 set. Requires zero
-- insufficient_data rows; re-label them first, keeping an audit note:
update public.emi_kpi_snapshots
   set metric_status = 'no_data',
       source_notes = coalesce(source_notes, '') || ';was_insufficient_data_smk445_rollback'
 where metric_status = 'insufficient_data';

alter table public.emi_kpi_snapshots drop constraint if exists emi_kpi_snapshots_metric_status_check;
alter table public.emi_kpi_snapshots add constraint emi_kpi_snapshots_metric_status_check
  check (metric_status in ('ok', 'no_data', 'query_error'));

-- 3. Annotation column (annotate-only; nothing writes it, simple drop, discards
-- the pre-fix methodology flags):
alter table public.emi_kpi_snapshots drop column if exists quality_flag;

-- 4. Synthetic tagging column:
alter table public.users drop column if exists is_synthetic;
```

Validation queries:
```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.emi_kpi_snapshots'::regclass and contype = 'c';
select count(*) from public.emi_kpi_snapshots where metric_status = 'insufficient_data';
select proname from pg_proc
 where pronamespace = 'public'::regnamespace
   and proname in ('emi_kpi_event_funnel', 'emi_kpi_day7_cohort');
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'emi_kpi_snapshots'
   and column_name = 'quality_flag';
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'users'
   and column_name = 'is_synthetic';
```

Forward-fix plan:
- Prefer additive correction over rollback: a wrong aggregate is fixed with
  `create or replace function` on the RPC (no table change), a wrong floor is a
  one-line change to `EMI_KPI_MIN_DENOMINATOR` in `src/lib/emi-kpi.ts`, and a
  mis-tagged account is a one-row `users.is_synthetic` update.
- If only scoring misbehaves, remember the success-criteria gate is advisory
  (SMK-445); no automated red/green depends on these values until re-baseline.
- Re-apply the forward migration in staging after correcting the fault, run the
  emi-kpi vitest suites (`src/lib/emi-kpi.test.ts` and the four reporting route
  tests), and only then re-apply to production.
