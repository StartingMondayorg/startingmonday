# Intelligence Production Gate Evidence - 2026-08-12

Owner: OPS + ENG-SM

Environment: production

Repository baseline: `f745920b9a3bfdda341f976e56e5a4cc5f9d993f`

Evidence state: `MEASURED`, blocked pending repair deployment and recapture

## Governance

- Governing stories: WS0-02, WS0-03, WS0-04, WS0-07, WS0-08, WS1-03, WS1-09, WS1-10, WS2-07, WS2-08, WS2-09.
- Applicable controls: GOV-02, GOV-03, EVD-01, INT-02, INT-03.
- Product-local repository: Starting Monday.
- Production mutation during evidence capture: none.
- Rollback for the evidence tooling: remove the read-only script, package command, and evidence artifacts.
- Kill behavior: any query error or unavailable exact count exits nonzero and produces no passing disposition.

## Reproduction

Run from a clean Starting Monday worktree with production credentials present locally:

```powershell
npm run intelligence:evidence -- --environment=production --output=docs/evidence/intelligence-production-gates-2026-08-12.json
```

The command prints and stores aggregate counts, source names, the latest replay summary, and gate states. It does not print credentials or row-level company, user, opening, event, or relationship data.

## Measured Snapshot

Query timestamp: 2026-08-12T19:14:03.966Z

| Gate | Current | Target | Status |
| --- | ---: | ---: | --- |
| Labeled openings | 936 | 500 | Pass |
| Event-outcome labels | 845 | 1,000 | Blocked |
| Label sources | 5 | 4 | Pass |
| Fresh precursor-stat rows, 24 hours | 166 | 1 | Pass |
| Backtest cohort inventory | 650 | 300 | Pass |
| Latest replay matched controls | 74 | 900 for 300 replayed cohorts | Blocked |
| Pattern backtests and replay | 50; latest replay complete | At least 1; replay complete | Pass |

Label sources present: `ats_json`, `career_scan`, `exec_hire`, `proxy_diff`, and `user_pipeline`.

Latest replay:

- Run ID: `69c8747b-0952-406a-b4a5-3000ef7d7281`
- Started: 2026-08-09T04:40:00.398981+00:00
- Finished: 2026-08-09T04:40:15.608+00:00
- Status: `complete`
- Cohorts: 300
- Controls: 74

## Defect Evidence

### Missing event-opening labels

A read-only reconciliation audit at 2026-08-12T18:59:20.777Z measured:

- 936 openings.
- 1,676 canonical events.
- 845 existing event-opening labels.
- 1,414 eligible event-opening pairs inside the declared 180-day lookback.
- 569 eligible pairs missing across 199 openings.
- Projected count after idempotent reconciliation: 1,414.

Root cause: `recordRoleOpening` returned immediately when the opening already existed. Events canonicalized after the opening, or labels missed by a prior failed write, were never reconciled.

Repair: reconcile existing openings idempotently, insert only missing pairs, and preserve the `exec_hire` self-event exclusion.

### Insufficient matched controls

Root cause: the cohort builder held one global set of control company IDs and prohibited reuse across all cohorts. With 577 canonical companies, three controls for 300 replay cohorts were structurally unreachable even though the database contract permits a company to control multiple cohorts.

Repair: enforce uniqueness within each cohort, permit valid reuse across cohorts, and evaluate the matched-control gate against the latest replay's declared cohort and control counts. Historical total cohort/control counts remain inventory metrics.

## WS1-10 Disposition

Status: `BLOCKED_REPAIR_AND_RECAPTURE`.

The repair is locally implemented and tested but this artifact does not claim deployment or gate closure. Required next evidence:

1. Merge and deploy the repair through the normal staging-first release path.
2. Run outcome-label reconciliation and the cohort builder in production.
3. Run a fresh pattern replay after controls are populated.
4. Recapture production evidence at the deployed commit.
5. Require event-outcome labels at or above 1,000, latest replay controls at 900 for 300 cohorts, and all other gates passing.
6. Record AO gate review before beginning E3 enrichment or any later sequence item.

Until all six actions complete, this evidence does not permit downstream implementation.