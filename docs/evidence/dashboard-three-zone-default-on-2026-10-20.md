# Three-Zone Dashboard Default-On Evidence

Date: 2026-10-20
Repository: Starting Monday
Base: `945378c0` (branch `simplify/job-search-nudges-review`, PR #526)
Implementation branch: `simplify/p2-three-zone-default`

## Decision

Rich ruled R-2 on 2026-10-20 (`docs/strategy/sm-simplification-proposal-2026-10-20.md`): flip the three-zone dashboard for all users and delete the legacy layout. This widens the `DG-09` decision recorded in `docs/evidence/dashboard-simplification-foundation-2026-08-20.md` (`APPROVED_LIMITED_DEFAULT_OFF_COHORT`) to every Starting Monday user.

Governing stories are unchanged: `WS7-03`, `WS7-04`, `WS7-08`, `DG-09`. No MandateSignal code, data, host, runtime, or release dependency is involved.

## What this change does (P2a)

- `isStartingMondayDashboardSimplificationEnabled()` now returns `true` when `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED` is unset or blank. The variable becomes a kill switch: any explicit falsy value (`0`, `false`, `no`, `off`) restores the legacy dashboard for every user. No hosted environment variable needs to change for the flip to take effect on the next deployment.
- The three-zone page title "What should I do today?" is now the route's `h1` (it was an `h2`; the legacy layout carried a visually hidden `h1`). Exactly one `h1` and one `main` render.
- `tests/e2e/mobile-ui.spec.ts` targets the three-zone heading and the marked `next_move` action instead of the legacy "Today at a glance" section.
- `tests/e2e/dashboard-simplification-flagged.spec.ts` runs by default and skips only when the kill switch is explicitly off.

The legacy layout, its components, `momentum-job`, and the `weekly_goal` / `momentum_score` / `stall_nudge_dismissed_at` columns are untouched here; they are removed in P2b after the rollback window.

## Rollback

Set `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED=false` on the hosted app and redeploy. No data migration is involved in P2a.

## Validation (local)

```text
npm run typecheck
npx vitest run src/lib/feature-flags.test.ts "src/app/(dashboard)/dashboard"   # 61 files, 147 tests
npm run guard:dashboard-simplification                                            # OK (3 zones, 2 marked actions)
npm run test:dashboard-simplification-gate                                        # 3 pass
npx eslint (touched files)                                                        # clean
```

Hosted evidence (predeploy build, First-value synthetic gate, Playwright PR plan, Lighthouse mobile budgets) is produced by CI on the pull request.

## Outstanding from the 2026-08-19 brief

- §7 post-flip observational session with 2–3 users has not been run. It is scheduled after the flip reaches production; the pre-flip baseline is `docs/evidence/dashboard-observational-baseline-2026-08-20.md`.
- Word/CTA budgets (§3) remain seed targets; the static gate enforces zones and marked actions, not word counts.
