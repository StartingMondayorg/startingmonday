# EMI Production Validation Rerun Procedure

Date: 2026-05-25
Owner: Data
Cadence: Weekly (Friday)
Purpose: Re-run EMI production validation in a consistent, audit-ready workflow.

## Inputs

1. Query pack:
- docs/strategy/emi-sprints/artifacts/emi-production-query-pack.sql

2. Export manifest:
- docs/strategy/emi-sprints/artifacts/emi-production-export-manifest-2026-05-25.md

3. Validation report:
- docs/strategy/emi-sprints/artifacts/emi-data-validation-pass-2026-05-25.md

4. Prior exports folder:
- docs/strategy/emi-sprints/artifacts/production-exports

## Weekly Rerun Steps

1. Prepare a dated output prefix.
- Format: `YYYY-MM-DD`
- Example: `2026-05-29`

2. Run Q1-Q6 in production.
- Preferred path: run SQL blocks from the query pack in Supabase SQL Editor.
- Alternative path: run via psql if production connection is available.
- Repo automation path: POST to `/api/admin/automation/reporting/emi-validation-reruns` after the weekly KPI snapshot job runs so canonical drift and null-streak alerts are recorded in automation observability.

3. Export result artifacts.
- Save one combined export and one per-query export when possible.
- Naming convention:
  - `emi-production-query-results-YYYY-MM-DD.csv`
  - `emi-production-query-results-YYYY-MM-DD.json`
  - Optional per-query files `q1-...csv` through `q6-...csv`

4. Update manifest rows.
- For each of Q1-Q6, fill:
  - Executed at (UTC)
  - Result value
  - Export file path
  - Reviewer

5. Compare with current published KPI values.
- Compare against latest scorecard and final success audit references.
- Mark each row as one of:
  - `match`
  - `within_tolerance`
  - `mismatch`

6. Record caveats and schema gaps.
- If a metric is null, add one explicit reason.
- If mapping changed, add one-line note in validation report.

7. Finalize weekly sign-off.
- Set manifest sign-off flags.
- Add one bullet in cadence log weekly record index linking new exports.

## Drift and Alert Rules

1. Raise a warning when any KPI differs from published value by more than 5 percentage points.
2. Raise a warning when any query returns null for two consecutive weekly reruns.
3. Open a schema-alignment ticket when a metric cannot be computed from canonical tables.

## Runtime Automation Notes

1. The rerun alerting path is implemented in `src/app/api/admin/automation/reporting/emi-validation-reruns/route.ts`.
2. The route reads canonical `emi_kpi_snapshots`, compares them to published sprint reference values, and writes a `scheduled_job_observability_runs` record.
3. A consecutive null streak (two weeks with no usable value for a metric) sets the run status to `failed`, which creates an automation alert through the existing observability trigger path. This alerts a human without blocking deploys.
4. Post-deploy smoke command: run `npm run emi:smoke:postdeploy` with `EMI_SMOKE_TOKEN` set.
5. `EMI_SMOKE_TOKEN` is validated only by `POST /api/internal/automation/emi-smoke`, which enforces constant-time token comparison and request rate limiting before executing the smoke action.
6. Rotation: update `EMI_SMOKE_TOKEN` in production environment variables and in GitHub Actions repository secrets in the same change window.
7. Incident fallback: if token checks fail after rotation, runbook owners should restore the previous known-good token, rerun the smoke command, then re-attempt rotation with synced secret updates.
8. Smoke check pass criteria (SMK-444): every automation route returns HTTP 200, operational routes return `ok=true`, the weekly job writes at least one KPI snapshot, and no metric reports `metric_status=query_error`. Value-level drift against a hardcoded baseline is no longer checked; `nullStreakCount` and the business success criteria are advisory and reported without failing the gate.
9. Export-file generation and manifest markdown updates still require an operator step in the repository workspace.

## Definition of Complete Rerun

1. All Q1-Q6 rows updated with UTC timestamp and value.
2. Export files stored in production-exports folder with dated filenames.
3. Validation report updated with pass/caveat status for the week.
4. Cadence log updated with links to the new weekly artifacts.
