# Intelligence Production Gates - Post-Repair Evidence

Date: 2026-08-12

Owner: OPS + ENG-SM

Environment: production

Repository baseline: `1a7ac4af1d1638d5b48601ac1184ed90fbd1c460`

Evidence state: `MEASURED`, blocked on classification and matched-control gates

## Governance

- Governing stories: WS0-02, WS0-03, WS0-04, WS0-07, WS0-08, WS1-03, WS1-09, WS1-10, WS2-07, WS2-08, WS2-09.
- Applicable controls: GOV-02, GOV-03, EVD-01, INT-02, INT-03.
- Product-local repository: Starting Monday.
- Production mutation during evidence capture: none.
- Production repair jobs were advisory-locked and idempotent.
- E3 and later Recommended Order items remain blocked.

## Deployment

Production web and worker are verified `SUCCESS` at exact main SHA `1a7ac4af1d1638d5b48601ac1184ed90fbd1c460`.

Delivered through:

- PR #367: initial staging repair.
- PR #370: metrics contract-test correction.
- PR #369: production promotion.

The deployed repair:

- reconciles missing event-opening labels;
- permits control-company reuse across cohorts while preserving within-cohort uniqueness;
- reports escaped canonical duplicates separately from successful merge rate;
- parses the first balanced classifier JSON object when model output contains trailing prose;
- raises the bounded classifier response ceiling from 512 to 768 tokens; and
- captures classification, duplicate, provenance, label, and backtest gates in one redacted artifact.

## Reproduction

Run from a clean worktree at the deployed main SHA with production credentials present locally:

```powershell
npm run intelligence:evidence -- --environment=production --output=docs/evidence/intelligence-production-gates-2026-08-12-post-repair.json
```

The command is read-only. It emits aggregate counts, source names, rates, and the latest replay summary. It does not emit credentials or row-level company, user, opening, event, or relationship data.

## Measured Snapshot

Query timestamp: 2026-08-12T22:14:14.817Z

| Gate | Current | Target | Status |
| --- | ---: | ---: | --- |
| Labeled openings | 939 | 500 | Pass |
| Event-outcome labels | 1,331 | 1,000 | Pass |
| Label sources | 5 | 4 | Pass |
| Fresh precursor-stat rows, 24 hours | 342 | 1 | Pass |
| Backtest cohort inventory | 654 | 300 | Pass |
| Latest replay matched controls | 620 | 900 for 300 replayed cohorts | Fail / re-plan |
| Pattern backtests and replay | 50; latest replay complete | At least 1; replay complete | Pass |
| Classification failure rate, 24 hours | 12.79% (253 / 1,978) | Less than 3% | Fail / repair deployed; fresh run pending |
| Escaped canonical duplicate rate, 24 hours | 0% (0 / 131) | Less than 5% | Pass |
| Provenance coverage, 24 hours | 100% (131 / 131) | At least 100% | Pass |

Successful canonical merge rate was 72.23% (320 merges across 443 canonical write outcomes). This is deduplication efficiency telemetry, not an escaped-duplicate rate and is not evaluated against the less-than-5% duplicate gate.

Latest replay:

- Run ID: `bb2eef03-0789-463e-8f4b-e0648dff9fdf`
- Started: 2026-08-12T22:02:22.993774+00:00
- Finished: 2026-08-12T22:03:13.677+00:00
- Status: `complete`
- Cohorts: 300
- Controls: 620

## Classification Finding

The pre-deploy 24-hour denominator contained 253 failures:

- 250: valid JSON followed by trailing non-whitespace model text;
- 3: truncated JSON arrays.

The parser and token-ceiling repair is deployed. The historical rolling window remains red until it expires. One normal advisory-locked post-deploy signal cycle began at 2026-08-12T22:12:12.578Z to provide a fresh directional denominator. Historical DLQ rows remain unresolved because they do not retain enough context for safe, atomic replay.

## Matched-Control Finding

The completed replay disproved the expected 900-control gate under the current matching contract.

Measured structural constraints:

- 300 selected cohorts produced 620 controls.
- The theoretical maximum under exact free-text sector matching was 742 before excluding companies with nearby openings.
- 70 selected cohorts had zero controls in the completed audit.
- Many raw sector values had only one canonical company.
- Of 185 canonical companies linked to user-company rows, 81 had sector data, 22 had a size value, and only 18 had both.
- Available size values were coarse: `startup`, `midmarket`, and `enterprise`.

The current matcher therefore cannot substantiate the inherited claim of three same-sector/size controls per cohort. The target is not lowered. WS2-08 requires a re-plan that establishes canonical broad-sector and size-band coverage before a new cohort version is built and replayed.

## Validation

- Focused intelligence slice: 6 files, 43 tests passed.
- Full repository suite: 584 files, 1,378 tests passed.
- Typecheck passed.
- Touched-file lint: 0 errors.
- Signal-engine plan pin passed.
- Untracked-test guard passed.
- Source secret scan passed.
- `git diff --check` passed.
- Staging health: HTTP 200 at exact SHA `afd48f58f1787f8085d91272d4fa58ee31b2908e`.
- Staging metrics route without credentials: HTTP 401.
- Production promotion checks passed, including predeploy, Lighthouse, focused Playwright, CodeQL, Semgrep, Gitleaks, dependency audit, debt, mobile, Auth UX, performance, and growth advisory gates.

## Gate Conclusion

Status: `FAIL_REPLAN_AND_CONTINUE_MEASUREMENT`.

Passing volume, duplicate, provenance, label, and replay-completion checks do not override the two failed gates. E3 remains blocked until:

1. a fresh post-deploy classifier denominator passes the strict less-than-3% threshold;
2. WS2-08 defines and implements a canonical matching-dimension contract;
3. a new cohort version produces three valid controls for each included cohort, or explicitly excludes unsupported cohorts before replay with complete denominator reporting;
4. the replay completes against that frozen cohort version; and
5. AO records the WS1-10 disposition.