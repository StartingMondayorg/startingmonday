# WS2-08 Matching Policy v2

Date: 2026-08-12

Status: `IMPLEMENTED_LOCAL`, hosted schema and replay evidence pending

Owner: DATA + ENG-SM

Product-local repository: Starting Monday

## Governance

- Governing story: WS2-08 Backtest-rail audit.
- Supporting stories: WS0-03, WS0-04, WS0-07, WS1-03, WS1-09, WS1-10.
- Applicable controls: GOV-02, GOV-03, EVD-01, INT-02, INT-03.
- Decision basis: WS1-10 `FAIL_REPLAN_ACCEPTED` on 2026-08-12.
- Historical E3 remains blocked; this repair addresses only cohort/control integrity.

## Failed Baseline

Production replay `bb2eef03-0789-463e-8f4b-e0648dff9fdf` completed with:

- 300 cohorts;
- 620 controls;
- target of 900 controls; and
- 70 zero-control cohorts in the completed audit.

The exact raw-sector matcher could produce at most 742 controls before nearby-opening exclusions. Only 18 of 185 linked canonical companies had both raw sector and size data.

## Matching Contract

Canonical matching dimensions:

- `broad_sector_slug`: one of the existing eight governed sector slugs;
- `size_band`: `startup`, `midmarket`, `enterprise`, or unknown;
- `matching_dimension_version`: `v1`.

Control policy `sector-size-v2`:

1. Never select a cross-broad-sector control.
2. When both cohort and candidate size are known, sizes must match.
3. When either size is unknown, selection is allowed only within broad sector and records match tier `broad_sector_size_unknown`.
4. Exact broad-sector and size matches rank before unknown-size matches.
5. A candidate with any role opening within plus or minus 90 days of the cohort opening is excluded.
6. A cohort is included only after three eligible controls are selected.
7. Unsupported openings are counted by reason and are not persisted as v2 cohorts.
8. Every build receives an immutable `v2-<uuid>` cohort version; v1 and prior v2 evidence are never overwritten.
9. Replay binds to the latest completed build ledger's exact cohort version.
10. Replay fails if fewer than 300 supported cohorts exist or any included cohort has other than three controls.

Control companies may be reused across different cohorts. Uniqueness remains mandatory within each cohort. This is a deliberate accepted repair: with 577 canonical companies, a globally non-overlapping 900-control pool is impossible. Replay metrics count each cohort-control comparison, while every reused company is still independently checked against that cohort's opening window.

## Dimension Reconciliation

Broad sector and size are derived deterministically from existing canonical and linked user-company fields.

- One normalized value: persist it.
- No normalized value: persist unknown.
- Conflicting normalized values: persist unknown; never choose a majority or last writer.

The reconciliation reports canonical count, updates, broad-sector coverage, size coverage, and combined coverage.

## Read-Only Production Simulation

The v2 policy was simulated in memory against production before schema mutation:

| Measure | Result |
| --- | ---: |
| Canonical companies | 577 |
| Canonical companies with normalized broad sector | 337 |
| Canonical companies with normalized size | 22 |
| Eligible openings | 874 |
| Openings scanned to find 300 supported cohorts | 428 |
| Supported cohorts | 300 |
| Excluded: missing broad sector | 120 |
| Excluded: insufficient eligible controls | 8 |
| Three-control target attainable | Yes |

The simulation used the same pure normalization and candidate-selection functions as the builder. It did not write production data.

## Schema and Data Controls

Migration: `supabase/migrations/169_backtest_matching_dimensions.sql`

The migration:

- adds canonical broad-sector and size dimensions;
- changes cohort uniqueness from opening-only to opening plus cohort version;
- records cohort dimensions and matching policy;
- records control dimensions, match tier, and policy;
- adds a service-only cohort-build run ledger;
- adds replay build reference, candidate/exclusion denominators, reasons, controls-per-cohort, and policy; and
- enforces v2 dimension and completed-replay count invariants with database constraints.

RLS remains enabled with no end-user policies on the backtest tables. Data stays service-role only. No customer, contact, user, or relationship identifiers are added. Existing retention remains unchanged.

## Acceptance Evidence

Required before `MEASURED`:

1. Migration 169 applies successfully in the hosted database.
2. Dimension reconciliation reports complete denominators and no invalid values.
3. A completed build ledger records at least 300 included cohorts and all exclusions by reason.
4. Persisted controls reconcile to exactly three per included cohort.
5. A replay binds to the build run and reports 300 cohorts and 900 controls.
6. Replay status is `complete` with no error.
7. Production evidence capture includes cohort version, build run, scanned/excluded denominators, reasons, controls-per-cohort, and policy.
8. Focused and repository gates pass.

The expanded machine artifact uses schema version `intelligence-production-evidence/v2`. Existing v1 artifacts remain unchanged.

## Rollback and Kill Behavior

- Rollback playbook: `docs/development/migration-rollbacks/169_backtest_matching_dimensions.md`.
- Existing advisory locks remain the operator kill boundary.
- Any unknown broad sector excludes the opening.
- Any insufficient control pool excludes the opening.
- Any partial control write removes that v2 cohort.
- Any build exception marks the build ledger failed.
- Any incomplete included cohort fails replay.
- Any build below 300 supported cohorts fails replay before metrics are written.
- v1 remains immutable and available for comparison.
- No calibrated product or historical E3 work proceeds from a failed v2 replay.

## Deployment Sequence

Migration 169 changes the cohort conflict target from `opening_id` to `(opening_id, cohort_version)`. Use one controlled maintenance sequence:

1. Deploy the v2-capable worker and verify its exact SHA.
2. Do not run cohort-builder or pattern-backtest before migration verification; both fail closed if v2 schema is absent.
3. Dispatch the default-off `apply_backtest_matching_migration` workflow immediately after worker verification and outside the Sunday cohort/replay schedule.
4. Require the hosted workflow to verify columns, constraints, RLS, and migration history.
5. Run the cohort builder once, then replay once.
6. Recapture production evidence.

Do not apply migration 169 while an old cohort-builder process is running. The workflow is manual so the operator can enforce this ordering.

## Known Validation Limitation

Docker Desktop was not running during local validation, so migration 169 was not applied to a local Supabase instance. Migration rollback readiness, JavaScript syntax, pure contract tests, production read-only simulation, typecheck, and lint were available. Hosted migration evidence remains required before deployment claims.