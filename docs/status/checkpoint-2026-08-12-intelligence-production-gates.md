# Checkpoint: Intelligence Production Gate Closure

Date: 2026-08-12
Status: Resolved 2026-08-13 by WS2-08 production closeout

## Resolution

- Migration 169 applied and passed hosted verification.
- V2 build `ed25bf70-77ed-46bb-9f97-1b155c803023` completed with 300 cohorts
   and 900 controls.
- Replay `dcd12b96-40f8-43bf-bf2d-69b8859f208b` completed at 300/900.
- Fresh classifier measurement passed at 0.05% failures (1/1,974).
- PRs #374 and #375 merged through staging to main.
- Production web and worker are `SUCCESS` at exact main SHA `e512b2cf`.
- Canonical closeout:
   `docs/evidence/intelligence-production-gates-2026-08-13-ws2-08-closeout.md`.

The historical active-sequence and resume sections below are retained as
checkpoint evidence only. Do not use them to start duplicate jobs.

## Governing Scope

This checkpoint covers Recommended Sequence step 1 only: close production evidence for intelligence labels and backtests.

Governing stories:

- WS0-02, WS0-03, WS0-04, WS0-07, WS0-08
- WS1-03, WS1-09, WS1-10
- WS2-07, WS2-08, WS2-09

Applicable controls: GOV-02, GOV-03, EVD-01, INT-02, INT-03.

Do not begin E3 enrichment or later sequence items until the production evidence recapture passes every step-1 gate and AO records the WS1-10 disposition.

## Delivered Changes

The repair includes:

- Reproducible, read-only production evidence capture.
- Idempotent reconciliation of missing event-opening labels.
- Exclusion of original and deduplicated `exec_hire` proof events from precursor labels.
- Valid control-company reuse across cohorts while preserving within-cohort uniqueness.
- Matched-control readiness evaluated against the latest replay denominator.
- Incremental, retry-safe career-scan backfill with durable checkpointing.
- Staff/service-token authorization for both intelligence admin metrics routes.
- Focused regressions and dated redacted baseline evidence.

## Pull Requests and Commits

1. PR #364 - Stage intelligence production evidence gate repairs
   - Merged to staging: 2026-08-12T19:44:13Z
   - Merge commit: `33c48377f9cf7d6ff6943584d4464dfad5fb5ee0`
   - URL: https://github.com/richrothschild/startingmonday/pull/364
2. PR #365 - Sync main onboarding fixes into staging after intelligence repairs
   - Merged to staging: 2026-08-12T19:47:22Z
   - Merge commit: `d44247d481415824339db7203f9591ffd0f7b39c`
   - URL: https://github.com/richrothschild/startingmonday/pull/365
3. PR #366 - Promote intelligence production evidence gate repairs
   - Merged to main: 2026-08-12T20:14:53Z
   - Merge commit: `10e1a66f7b44c3bb486f1d3fe5403d42e9fa6124`
   - URL: https://github.com/richrothschild/startingmonday/pull/366

PR #366 required checks: 7 successful, 1 planned Playwright skip, 0 failures.

## Production Deployment

Railway production verified at exact SHA `10e1a66f7b44c3bb486f1d3fe5403d42e9fa6124`:

- `startingmonday`: `SUCCESS`
- `Starting-Monday-worker-sub`: `SUCCESS`

## Pre-Repair Production Evidence

Captured at 2026-08-12T19:14:03.966Z:

| Gate | Current | Target | Status |
| --- | ---: | ---: | --- |
| Labeled openings | 936 | 500 | Pass |
| Event-outcome labels | 845 | 1,000 | Blocked |
| Label sources | 5 | 4 | Pass |
| Fresh precursor-stat rows | 166 | 1 | Pass |
| Backtest cohort inventory | 650 | 300 | Pass |
| Latest replay matched controls | 74 | 900 for 300 cohorts | Blocked |
| Pattern backtests and replay | 50; latest replay complete | At least 1; replay complete | Pass |

A read-only audit found 569 legitimate missing event-opening pairs across 199 openings. Projected count after reconciliation: 1,414.

## Active Production Sequence

Terminal execution ID: `659962eb-cff2-45e2-ae16-0626a7b6dfed`

The command runs these advisory-locked jobs in order against production:

1. `runOutcomeLabelBackfillJob`
2. `runPrecursorStatsJob`
3. `runCohortBuilderJob`
4. `runPatternBacktestJob`

State at checkpoint:

- Sequence still active.
- Outcome-label backfill started at 2026-08-12T20:18:32.279Z.
- Latest observed writes were legitimate `exec_hire` openings with 6 and 2 precursor labels respectively.
- Precursor stats, cohort builder, and pattern replay had not yet reported start markers.
- Do not start a second copy; advisory locks will prevent overlap, but duplicate operator execution is unnecessary.

## Resume Procedure

1. Retrieve the active terminal result:

```text
get_terminal_output id=659962eb-cff2-45e2-ae16-0626a7b6dfed
```

2. Confirm all four `JOB_DONE` markers and no thrown production-job failure.
3. Confirm `C:\Users\roths\startingmonday-intelligence-evidence\.env.local` was removed by the command's `finally` block.
4. Recapture production evidence from a clean worktree containing main SHA `10e1a66f` or later:

```powershell
npm run intelligence:evidence -- --environment=production --output=docs/evidence/intelligence-production-gates-2026-08-12-post-repair.json
```

5. Require all gates to pass, including:
   - event-outcome labels at or above 1,000;
   - latest completed replay controls at 900 for 300 cohorts;
   - latest replay status `complete`;
   - no query errors or unavailable evidence.
6. Create a dated post-repair evidence/WS1-10 closeout artifact and deliver it staging-first.
7. Record AO gate disposition before starting E3.

## Validation Completed

- Focused tests: 6 files, 23 tests passed.
- Combined full suite: 583 files, 1,373 tests passed.
- Staging-base full suite: 582 files, 1,358 tests passed.
- Typecheck passed.
- Production builds passed.
- Signal-engine plan guard passed.
- Gitleaks, Semgrep, CodeQL, debt, Auth UX, mobile, Lighthouse, and required predeploy gates passed.
- Evidence secret scan passed.
- `git diff --check` passed.

## Starting Monday Worktree State

Primary checkout: `C:\Users\roths\startingmonday`

- Branch: `fix/generated-monitoring-policy-probe`
- Pre-existing dirty files remain untouched:
  - `.gitleaksignore`
  - `.vscode/settings.json`
  - resume/inbox artifacts
  - prior compatibility-sunset checkpoint
  - this checkpoint

Isolated checkout: `C:\Users\roths\startingmonday-intelligence-evidence`

- Branch: `staging-sync-main-intelligence-evidence`
- HEAD: `718427d3`
- Worktree clean.
- Remote delivery branch was deleted after merge.
- Current authority is `origin/main` at `10e1a66f`, not the local isolated branch name.

## CXO Radar Pivot State

Repository: `C:\Users\roths\cio-radar`

- Product name: CXO Radar.
- Repository/local path remains `cio-radar`.
- Branch: `feat/relationship-scan-lane`
- HEAD: `e45c2dd`
- Worktree contains the prior uncommitted scanner, relationship-lane, Apollo-enrichment, branding, tests, and strategy changes.
- Do not reset or overwrite `data/contacts-db.json`; it includes externally generated scan additions and must be reread before any edit.
- CXO Partners-facing brief:
  - `C:\Users\roths\cio-radar\docs\cxo-partners-board-relationship-strategy-brief-2026-08-12.md`
- Canonical internal strategy:
  - `C:\Users\roths\cio-radar\docs\board-relationship-strategy-2026-08-12.md`

The next user-directed work should occur in CXO Radar unless the production sequence reports a failure requiring immediate Starting Monday incident handling.