# E3 Search-Lag Increment Readiness

Date: 2026-08-13

Status: `IMPLEMENTED_LOCAL_READY_FOR_STAGING`

Owner: ENG-SM + DATA

Accountable owner: Richard Rothschild (AO)

## Vertical Outcome

Use existing EDGAR-derived executive-position rows to produce one
deterministic, evidence-bounded departure-to-appointment search-lag baseline.
The increment does not add paid enrichment, customer rendering, or database
writes until the baseline and matcher contract pass review.

## Governing Scope

- Historical roadmap: E3 Executive History Database, especially E3.4.
- Canonical dependencies: WS1-03, WS1-09, WS1-10, WS2-07, WS2-08, WS3-02,
  WS3-03, WS6-01, WS6-02, and WS6-06 as applicable.
- WS2-08 production closeout: `PASS` at main SHA `e512b2cf`.
- Product-local repository: Starting Monday.

## Existing Anchors

- Schema: `supabase/migrations/068_executive_history.sql`.
- Historical loader: `scripts/backfill-edgar-exec-history.mjs`.
- Existing internal consumer: `src/app/api/cron/edgar-signals/route.ts`.
- New pure matcher: `worker/lib/search-lag-matcher.js`.
- New read-only baseline: `scripts/e3-search-lag-baseline.mjs`.

## Reproducible Baseline

Pre-matcher inventory captured at `2026-08-13T02:47:49.628Z`:

| Object | Rows |
| --- | ---: |
| Executive profiles | 4,658 |
| Executive positions | 5,284 |
| Non-current, role-normalized dated departure rows | 1,421 |
| Current, role-normalized dated appointment rows | 1,420 |
| Search-lag rows | 0 |
| Company tenure-stat rows | 0 |
| Industry tenure-stat rows | 0 |
| Departure-context rows | 0 |

The existing EDGAR backfill passes `node --check`. A local Anthropic key is
not configured, so no new model-backed backfill is authorized in this slice.
The first increment uses only existing rows and incurs no provider spend.

The matcher uses a broader canonical denominator: every position row with an
`end_date`, before identity, role, executive, and date-quality holds. The first
production baseline measured 2,556 departure candidates, 267 deterministic
matches, and 2,289 held departures. The reconciliation equation is
`2,556 = 267 + 2,289`. Median matched search lag is 95 days. These values
supersede the narrower pre-matcher
inventory for matcher acceptance and are preserved in the machine artifact.

## Matching Contract

1. Company identity is an exact normalized non-empty SEC CIK.
2. Role identity is exact `title_normalized` equality.
3. Appointment must start strictly after departure and within 18 calendar
   months.
4. The unique earliest eligible appointment is selected.
5. Tied earliest appointments are held; the matcher never guesses.
6. Same-executive appointments are excluded.
7. Both departure and appointment executive identities are required.
8. One appointment cannot satisfy multiple departures.
9. Calendar dates must round-trip exactly; impossible dates are held.
10. The 18-month boundary clamps to the final day of a shorter target month.
11. Appointments after the evidence `asOfDate` are held.
12. Replacement type remains `unknown` until prior-employer evidence exists.
13. Missing identity, role, or valid dates remain explicit held denominators.

## Data Governance

- Input is platform-internal executive history derived from public SEC filings.
- Tables remain service-role only with RLS enabled.
- The baseline emits aggregate counts and distributions only.
- No names, URLs, accessions, company rows, customer identifiers, or model
  prompts appear in the evidence artifact.
- Retention and deletion behavior are unchanged.
- PDL and Wikidata work remain outside this increment and require separate
  rights, cost, and readiness decisions.

## Acceptance Evidence

- Pure fixtures pass for unique, ambiguous, excluded, out-of-window, and
  reused-appointment cases.
- Read-only production baseline completes with a full denominator.
- Matched plus held departures reconcile to departure candidates.
- No row-level production data appears in output.
- DATA reviews the lag distribution and hold reasons before any write path.
- A later write slice must add idempotency, hosted schema evidence, dry-run,
  reconciliation, rollback/forward-fix, and no-look-ahead checks.

## Cost and Stop Rules

- Current cost ceiling: $0 provider spend for the read-only baseline.
- Stop if any row-level data appears in the artifact.
- Stop if denominators do not reconcile.
- Stop if ambiguous ties or reused appointments are silently selected.
- Stop before database writes if deterministic matches are zero or the lag
  distribution indicates a date-semantics defect.
- Do not start PDL enrichment without a separately approved bounded sample,
  explicit credit ceiling, and measured match-quality floor.

## Rollback and Kill Behavior

- Baseline command is read-only; rollback is deletion of its local artifact.
- No scheduler, migration, feature flag, or customer reader changes in this
  slice.
- Any future writer remains default off until its separate readiness gate.

## Closure Command

```powershell
node --env-file='<production-env-path>' scripts/e3-search-lag-baseline.mjs --environment=production --output=docs/evidence/e3-search-lag-baseline-2026-08-13.json
```

The command must exit nonzero on missing credentials, query errors, or
unavailable denominators.

## Readiness Decision

Independent exact-file confirmation found no unresolved P0/P1 blocker after
the identity, date, month-boundary, as-of, test, and evidence synchronization
remediations. The writer design is admitted as a default-off continuation of
this same vertical slice. Hosted migration and production writes remain gated
on review, staging deployment, migration verification, and a fresh dry-run.

The writer CLI's initial proof uses `--expect-empty` so a missing schema column
can be reconciled only when the existing table is also empty. Apply mode adds
bounded retries and remains idempotent through one-to-one database constraints
and the atomic RPC.

## Writer Implementation Evidence

- Additive migration: `supabase/migrations/170_exec_search_lag_matching.sql`.
- Operator CLI: `scripts/compute-search-lag.mjs`.
- Rollback playbook:
  `docs/development/migration-rollbacks/170_exec_search_lag_matching.md`.
- Hosted apply/verify workflow remains default off.
- Initial production dry-run: 267 proposed matches, zero attempted writes, zero
  applied writes, zero failures, zero persisted rows, hosted schema not yet
  applied.
- Independent writer review: `READY_FOR_STAGING`, no unresolved P0/P1.

No hosted migration or production write is authorized by this local state.
Deployment order is code first, exact-SHA verification, default-off migration
170 apply/verify, fresh dry-run, explicit apply, and post-write reconciliation.
