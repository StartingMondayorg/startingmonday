# CI & Test Reliability Cleanup — 2026-08-20

## Context

The team had stopped trusting CI: `ci.yml` (~20 PR-gating jobs) and the test suite behind it were slow, flaky, and full of checks that either duplicated each other, could never fail, or failed silently open when they hit an error. Failures got ignored and merged past routinely. A prior audit report was independently re-verified line-by-line against the live code (not just taken on faith), then fixed as five separate, independently-branched PRs so each could be reviewed and reverted on its own. All five merged to `main` the same day.

## What changed, by PR

### #447 — Remove redundancy and pure CI theater
No behavior changes to what any real signal means — just removed duplicate work and checks that could never provide signal.
- Removed the duplicate `secret-scan` (gitleaks) job from `ci.yml`; kept the standalone `gitleaks.yml`, which already had a daily cron and config the `ci.yml` copy lacked.
- Merged `notify-failure` and `notify-test-summary` into one `notify` job — was posting two Slack messages per failed run on main/staging; fixed a bug where the `auth-ux-guard` failure branch never set the Slack message's log link; stopped emailing on every green run (now only on a failure streak or a red→green recovery).
- Removed the duplicate `npm run lint` step (`lint:check-baseline` already does a full fresh lint).
- Extracted duplicated git base-ref resolution logic out of `check-coverage-thresholds.mjs` and `check-diff-coverage.mjs` into `scripts/lib/git-diff-scope.mjs`.
- Deleted the `risky-change-rollout-policy` job — it only ever called `core.warning()` and could never fail.
- Deleted `check-release-ux-checklist.mjs` and its CI step — it grepped a static doc for section headers, with zero connection to whether a release actually happened.
- Path-scoped the `guard:signal-engine-plan` step so it only runs when the pinned docs actually change, instead of on every PR.
- Fixed the lint-baseline ratchet to compare **per-file** warning counts instead of one aggregate total (closes the "fix 10 warnings here, add 10 there, pass unchanged" loophole).
- Made Semgrep's advisory full-scan findings visible in the job summary instead of silently swallowed.
- **Kept** `check-marketing-trust-proof-gate.mjs`, despite the original audit flagging it alongside `release-ux-checklist`: it checks live marketing pages for required trust/legal copy (real anti-regression value), not a static doc nobody re-reads.

### #448 — Fix fail-open gates
A deliberate behavior change: several gates were swallowing errors and passing instead of blocking, on exactly the conditions they existed to catch.
- `pre-prod-gate`: zero completed `production-synthetics.yml` runs now fails the gate instead of logging "advisory, allowing deploy" and passing.
- `check-landing-page-change-approval.mjs`: an unresolvable diff (shallow clone, force-push, rebase) now fails closed with a diagnostic instead of silently treating it as "no changes."
- `check-coverage-thresholds.mjs` / `check-diff-coverage.mjs`: same fail-closed fix for their diff-scope resolution.
- `billing:readiness:strict`: now also runs on `pull_request` and staging pushes, not just main pushes; also added to `promote-staging-to-main.yml`, which didn't run it at all.
- `first-value-synthetic-gate`: now waits for the deployed commit before testing, matching its sibling jobs, guarded to skip on `pull_request` (that job has no local-build fallback, so waiting there would time out every PR run).
- **Follow-up fix, same PR**: making the billing check run on PRs surfaced that it conflated two different concerns — Stripe env-var presence (a property of the deploy config, fine to check on every PR) and live Supabase row-integrity for commerce data (a property of production state, unrelated to most PRs' actual diff). Added a `billing` path filter to `predeploy-gates` and a `--skip-rows` flag to the script, so unrelated PRs only get the cheap env-var check while PRs that actually touch billing-relevant code (or pushes to main/staging) get the full check. See "Open item" below — this surfaced a real, pre-existing data problem that is not yet fixed.

### #449 — Fix tests that were silently passing or hiding failures
- **Dead `.bg-red-50` selector**: the shadcn migration (#426/#427) changed the `Alert` component's destructive variant to `bg-destructive/10`, but the tests were never updated. Replaced every instance with `[role="alert"]`, which the Alert component sets unconditionally on its root regardless of variant. Fixed in `critical-paths.spec.ts`, `site-monitoring.spec.ts` (×2), `smoke.spec.ts` (×2), `synthetics.spec.ts` (×2), and `slo.spec.ts` — one instance the original audit missed entirely. Absence-checks were silently false-passing even with a real error banner on screen; presence-checks were hanging the full 90s timeout instead of skipping cleanly.
- **Non-idempotent "idempotent" test**: `/api/feedback/items`'s POST handler has zero dedup/idempotency-key logic — two concurrent identical submissions are expected to create two separate items. Renamed the test to describe what it actually verifies (concurrent writes don't crash the server) instead of promising a guarantee the backend doesn't provide.
- **Blind `waitForTimeout(1500)`** in "Synthetic-10": replaced with a condition-based wait racing the dashboard/onboarding URL against the "Check your email" heading.
- **Mass-skip blind spot**: added `tests/e2e/skip-rate-reporter.ts`, a custom Playwright reporter that fails the run if more than a threshold (default 8) of tests skip for a live-backend/auth-availability reason (429/500/401/403, "session unavailable") in one run — so a real outage that previously degraded into a wall of green-with-skips now fails loudly instead.
- **Shared-account audit**: found and fixed a real bug in `flow-synthetics.spec.ts`'s "Synthetic-06" — the synthetic contact's cleanup ran *after* the lifecycle assertions, so a failed assertion orphaned the contact in the shared test account instead of deleting it. Wrapped in try/finally.

### #450 — Delete no-op placeholder tests
163 unit test files (30% of the suite) were pure council-score-chasing placeholders in the shape:
```ts
describe('X placeholder coverage', () => {
  it('marks module as covered for council traceability', () => {
    expect(true).toBe(true)
  })
})
```
None of them imported their target module, so they contributed zero real coverage (verified empirically against `coverage/lcov.info`). They existed solely to satisfy a file-existence check in the weekly, non-blocking "code council" testability rubric.
- Deleted 161 files that were purely the placeholder template.
- One file (`value-lane-pricing.test.ts`) had real tests bolted onto a leftover placeholder block — removed just the placeholder, kept the real tests.
- Regenerated `docs/placeholder-test-baseline.json` and `docs/status/debt-ratchet.baseline.json` to reflect zero placeholders.

### #451 — Structural consolidation
The lowest-urgency, biggest-mechanical-diff item.
- **Shared `deploy-ready` job**: added one job that waits for the Railway deploy of the current commit once; `playwright`, `mobile-visual-smoke`, `auth-ux-guard`, and `accessibility-tier0` now depend on it instead of each independently polling the same URL — 4 independent timeout/flake surfaces reduced to 1. Updated both notify jobs' failure-attribution logic accordingly, since a `deploy-ready` failure now correctly skips (not fails) its 3 PR-triggerable dependents.
- **Start/stop local-app composite actions**: extracted the identical "start the app, poll `/api/health`, kill on teardown" bash (duplicated across 5 jobs) into `.github/actions/start-local-app` and `.github/actions/stop-local-app`.
- **Deliberately deferred**: reconciling two similar-but-not-identical `paths-filter` blocks (forcing them identical risked silently changing which PRs trigger which visual-test job), consolidating the repeated Playwright `container:` image pin across 7 jobs (composite actions can't extract job-level keys — needs a reusable `workflow_call`), and mobile/luxury visual spec file consolidation (real risk of silently dropping route coverage if rushed).

## New finding, not in the original audit

30% of the unit test suite was no-op placeholders (see #450) — this was discovered during verification, not flagged in the original report.

## Verification approach

Every change was verified locally before merge: `npm run typecheck`, full `vitest run`, targeted script runs simulating both the failure and success paths, `actionlint` (not just YAML parsing) for the `ci.yml` restructuring in #451, and the full pre-commit hook suite (lint, docs index, UX/UI rubric, plain-language lexicon, mobile-ui contract checks, etc.) on every commit.

## Open item — not fixed by this cleanup

Making `billing:readiness:strict` run on PRs (#448) surfaced that `main` had already been silently failing this exact check for days. Three live commerce items — `exec-interview-narrative-pack`, `board-transition-brief-kit`, `outplacement-accelerator-bundle` (seeded in migration `109_micro_product_back_office.sql`) — are marked `active` in the production database but still have placeholder Stripe IDs instead of real ones. A real customer trying to buy any of them today would hit a broken checkout. A fix script already exists (`scripts/fix-billing-placeholder-sql.mjs`) — it needs real Stripe product/price/coupon IDs to generate the update SQL, or the three items need their `product_status`/`bundle_status` flipped away from `active` if they aren't actually launch-ready. This is independent of the CI cleanup and was deliberately left unresolved pending a product/Stripe-side decision.

## Merged PRs

| PR | Title |
|---|---|
| [#447](https://github.com/richrothschild/startingmonday/pull/447) | ci: remove redundant checks and pure CI theater from the PR-gating pipeline |
| [#448](https://github.com/richrothschild/startingmonday/pull/448) | ci: fix fail-open gates so errors block merges instead of passing silently |
| [#449](https://github.com/richrothschild/startingmonday/pull/449) | test: fix e2e tests that were silently passing or hiding failures |
| [#450](https://github.com/richrothschild/startingmonday/pull/450) | test: delete no-op placeholder tests, keep real tests where they existed |
| [#451](https://github.com/richrothschild/startingmonday/pull/451) | ci: consolidate redundant deploy-wait polling and start/stop-app boilerplate |
