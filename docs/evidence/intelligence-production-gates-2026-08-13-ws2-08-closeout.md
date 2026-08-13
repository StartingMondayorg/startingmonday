# WS2-08 Production Closeout

Date: 2026-08-13

Status: `PASS`

Environment: production

Accountable owner: Richard Rothschild (AO)

AO direction: "finish WS2-08 completely before opening E3"

## Scope and Authority

- Governing story: WS2-08 Backtest-rail audit.
- Supporting stories: WS1-03, WS1-09, WS1-10, WS2-07, WS2-09.
- Applicable controls: GOV-02, GOV-03, EVD-01, INT-02, INT-03.
- Product-local repository: Starting Monday.
- Production deployment: web and worker `SUCCESS` at merge SHA
  `cc39fdf35dc9da66e489edf2d8068a0606ba22b5`.
- Machine evidence:
  `docs/evidence/intelligence-production-gates-2026-08-13-ws2-08-closeout.json`.

This closeout resolves the accepted WS1-10 re-plan recorded on 2026-08-12. It
does not claim completion of E3 or any later epic.

## Hosted Migration

Migration 169 was applied through default-off workflow run `31651334881` at
production SHA `cc39fdf3`.

The workflow passed:

- migration application and history recording;
- canonical, cohort, control, and replay column verification;
- build-ledger table verification;
- row-level security verification;
- matching-constraint verification; and
- migration-history verification.

## V2 Cohort Build

- Build run: `ed25bf70-77ed-46bb-9f97-1b155c803023`.
- Cohort version: `v2-c6f1a845-fd04-4b16-9265-a83d53f46df4`.
- Matching policy: `sector-size-v2`.
- Status: `complete`.
- Openings scanned: 438.
- Included cohorts: 300.
- Excluded openings: 138.
- Missing broad sector: 124.
- Insufficient eligible controls: 14.
- Persisted controls: 900.
- Controls per included cohort: exactly 3.
- Cohorts with invalid control cardinality: 0.
- Denominator reconciliation: 438 = 300 + 138.

Canonical matching-dimension reconciliation covered 577 companies. It
produced 337 broad-sector values, 22 size-band values, and 12 records with
both. Unknown or conflicting values remained unknown; unsupported openings
were excluded rather than coerced.

## Frozen Replay

- Replay run: `dcd12b96-40f8-43bf-bf2d-69b8859f208b`.
- Build run: `ed25bf70-77ed-46bb-9f97-1b155c803023`.
- Cohort version: `v2-c6f1a845-fd04-4b16-9265-a83d53f46df4`.
- Status: `complete`.
- Cohorts: 300.
- Controls: 900.
- Pattern results: 50.
- Error: none.

## Fresh Classifier Measurement

The accepted re-plan required a fresh post-deploy denominator below the strict
3% threshold. One normal advisory-locked signal cycle completed with no
remaining checkpoint:

- Run started: `2026-08-13T00:31:55.674Z`.
- Classifier calls: 1,974.
- Classifier failures: 1.
- Failure rate: 0.05%.
- Gate: pass, because 0.05% is strictly below 3%.

The rolling 24-hour rate at evidence capture was 6.43% because it still
contained 253 pre-repair failures. That historical metric remains in the
machine artifact and is not deleted or rewritten. It is not the accepted
fresh-run gate and does not override the completed post-repair measurement.

## Final Gate Table

| Gate | Result | Target | Status |
| --- | ---: | ---: | --- |
| Labeled openings | 939 | At least 500 | Pass |
| Event-outcome labels | 1,331 | At least 1,000 | Pass |
| Label sources | 5 | At least 4 | Pass |
| Fresh precursor statistics | 342 | At least 1 | Pass |
| Backtest cohort inventory | 954 | At least 300 | Pass |
| Latest replay cohorts | 300 | 300 | Pass |
| Latest replay controls | 900 | 900 | Pass |
| Controls per included cohort | 3 | Exactly 3 | Pass |
| Latest replay status | Complete | Complete | Pass |
| Fresh classifier failure rate | 0.05% | Less than 3% | Pass |
| Escaped duplicate rate, 24 hours | 0% | Less than 5% | Pass |
| Provenance coverage, 24 hours | 100% | At least 100% | Pass |

## WS1-10 AO Disposition

Disposition: `PASS` for the bounded WS2-08 production evidence gate.

Rationale:

1. the fresh classifier denominator passes the unchanged strict threshold;
2. canonical broad-sector and size-band matching dimensions are implemented;
3. unsupported openings are excluded with complete denominator reporting;
4. every included v2 cohort has exactly three controls;
5. replay is bound to the immutable completed build and finished at 300/900;
6. provenance and escaped-duplicate gates pass; and
7. rollback, advisory locks, v1 preservation, and fail-closed replay behavior
   remain available.

E3 may enter its Definition of Ready after this closeout is delivered through
the staging-first repository process. E3 implementation has not started in
this closeout branch.

## Rollback and Residual State

- Migration rollback/forward-fix playbook:
  `docs/development/migration-rollbacks/169_backtest_matching_dimensions.md`.
- V1 cohorts, controls, replays, and pattern evidence remain immutable.
- Advisory locks remain the operator kill boundary for cohort and replay jobs.
- Any future incomplete v2 build or non-three-control cohort fails replay.
- The rolling 24-hour classifier metric should return below threshold as the
  pre-repair rows age out; it remains an operations metric, not erased history.
- Broad-sector coverage and especially size-band coverage remain improvement
  opportunities, but unsupported openings are measured and excluded safely.

## Reproduction

From a clean checkout containing the evidence-script change and production
credentials stored locally:

```powershell
node --env-file='<production-env-path>' scripts/capture-intelligence-production-evidence.mjs --environment=production --output=docs/evidence/intelligence-production-gates-2026-08-13-ws2-08-closeout.json
```

The command is read-only and emits aggregate, redacted evidence only.
