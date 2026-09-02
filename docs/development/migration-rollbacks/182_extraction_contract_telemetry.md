# 182_extraction_contract_telemetry rollback

Goal:
- Remove the SMK-489 text-shape telemetry columns, the widened `scan_results_status_check`
  constraint, and the live-brief acquisition telemetry columns if the extraction-contract
  change must be withdrawn.

Risk triggers:
- `scan_results` inserts fail after deploy (constraint or column mismatch).
- Live-brief scan writes fail on the new `live_brief_scan_companies` columns.
- The `extraction_failed` outcome misfires broadly (healthy pages recorded as extraction
  failures) and the worker release is being rolled back.

Pre-rollback safety checks:
- Roll back or configure the worker FIRST. A worker still writing `status = 'extraction_failed'`
  will fail inserts the moment the constraint is narrowed. `BROWSERLESS_RENDER_MODE=content`
  reverts only the render mode, not the outcome writes; a full withdrawal needs the prior
  worker release deployed before this SQL runs.
- Confirm no reporting query depends on `extracted_chars`, `extracted_line_count`,
  `extracted_max_line_chars`, or the live-brief `acquisition_path` / `render_ms` columns.
- Optionally export existing `extraction_failed` rows and shape stats if the telemetry
  should be retained for analysis; dropping the columns discards it.
- Record the migration SHA and rollback reason in the deployment log.

Constraint note (pre-drift states differ per instance, verified 2026-09-01):
- Production carried `scan_results_status_check` allowing
  `('success','no_change','error','blocked')`; that constraint appears in no migration file.
- Staging carried no check constraint on `scan_results.status` at all.
- Migration 182 normalized both instances to one widened constraint. Rolling back either
  restores that instance's pre-drift state, or (preferred) narrows both to the four-value
  set so the two instances stay aligned.

Rollback SQL (preferred: aligned four-value constraint on both instances):
```sql
-- Requires zero rows with the new status; re-label any that exist first:
-- update public.scan_results set status = 'error',
--   error_message = coalesce(error_message, 'was extraction_failed (SMK-489 rollback)')
--   where status = 'extraction_failed';
alter table public.scan_results drop constraint if exists scan_results_status_check;
alter table public.scan_results add constraint scan_results_status_check
  check (status in ('success', 'no_change', 'error', 'blocked'));

drop index if exists scan_results_status_scanned_at_idx;

alter table public.scan_results
  drop column if exists extracted_chars,
  drop column if exists extracted_line_count,
  drop column if exists extracted_max_line_chars;

alter table public.live_brief_scan_companies
  drop column if exists acquisition_path,
  drop column if exists render_ms;
```
To restore staging's literal pre-drift state instead, drop the constraint there without
re-adding one.

Validation queries:
```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.scan_results'::regclass and contype = 'c';
select count(*) from public.scan_results where status = 'extraction_failed';
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'scan_results'
   and column_name like 'extracted_%';
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'live_brief_scan_companies'
   and column_name in ('acquisition_path', 'render_ms');
```

Forward-fix plan:
- Prefer additive correction over rollback: the columns are nullable, nothing gates on
  them, and a bad degenerate-shape threshold is fixed in `worker/scanner/extract-text.js`
  without touching schema.
- If only the render behavior misbehaves, set `BROWSERLESS_RENDER_MODE=content` (no
  redeploy) and leave the schema in place.
- Re-apply the forward migration in staging after correcting the fault, run the worker
  scanner test suites, and only then re-apply to production.
