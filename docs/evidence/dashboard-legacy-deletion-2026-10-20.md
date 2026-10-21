# Legacy Dashboard Deletion Evidence (P2b)

Date: 2026-10-20
Repository: Starting Monday
Base: `c7195f6d` (branch `simplify/p2-three-zone-default`, PR #528)
Implementation branch: `simplify/p2b-delete-legacy-dashboard`
Governing ruling: R-2 (`docs/strategy/sm-simplification-proposal-2026-10-20.md`)

## What was removed

- The legacy render tree in `src/app/(dashboard)/dashboard/page.tsx` and every piece of data preparation that only it consumed: the filtered/paginated company query, momentum score fetch, enrichment stats, draft-ready count, outreach-this-week count, prospect-contact count, briefed-company rows, weekly activity chart, pipeline velocity, stalled-campaign list, campaign health score, decision timeline, warm-paths query, intel-gap counters, profile completeness score, executive risk model, offer cockpit, path-welcome and stall-nudge copy, week-one banner, week-three prompt, and the `q` / `stage` / `page` / `preview` / `timelinePage` / `timelineSort` search params. `page.tsx` went from 2,035 to 724 lines.
- 21 files that nothing else imported once the legacy tree was gone (listed in the PR). Among them: `welcome-nudge-section`, `path-welcome-card`, `NextBestActionPrompt`, `advanced-modules-section`, `decision-timeline-section`, `signal-sections`, `on-demand-actions`, `momentum-actions`, `executive-risk-utils`, `week-utils`, `decision-timeline-utils`, `opportunity-radar`.
- Server actions `dismissStallNudge` (`profile/actions.ts`) and `updateDecisionOwner` (`dashboard/actions.ts`).
- `isStartingMondayDashboardSimplificationEnabled` and `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED`. With no legacy layout left, the kill switch introduced in P2a has nothing to switch to; the parity e2e spec now runs unconditionally.

## What was deliberately kept

| Kept | Why | Follow-up |
| --- | --- | --- |
| `top-shell-section`, `pipeline-section`, `profile-intelligence-section`, `weekly-performance-section`, `progress-feed-section`, `pipeline-pulse`, `status-banners`, `primary-nav-sections`, `greeting-block`, `EmptyState`, `DailyMomentumPlan`, `PipelineVelocity`, `ActivityChart`, `saveWeeklyGoal` | Still imported by the marketing demo pages `src/app/(marketing)/demo/executive-dashboard` and `demo/michael-dashboard`, which render the retired dashboard as a product demo | R-8: retire or rebuild those two demos on the three-zone layout (owner decision) |
| `momentum-job` and `user_profiles.momentum_score` | Read by `/dashboard/coach`, `/api/coach/*`, `/dashboard/plan`, `/api/plan/weekly`, briefing context, `concierge-prep-job`, `weekly-report-job` | Retire with the coach/plan readers under R-6 / route collapse |
| `weekly_goal`, `stall_nudge_dismissed_at` columns | `stall_nudge_dismissed_at` still drives the Zone 1 stalled-state quiet window; `weekly_goal` is read by the kept `weekly-performance-section` | Drop after R-8 and after the Zone 1 dismissal path is decided |
| `ProfileInactivityNudge` | Still used by `/dashboard/profile`; removing it needs autosave on that form first | P3 |
| `DashboardPostPlacementView` | Placed-user branch; unrelated to the legacy candidate layout | Progress-route review (brief §2, day-60) |

## Behaviour fixes made while deleting

- Zone 2 sector labels came from the legacy filtered/paginated query, so companies outside the first page of that query rendered "Sector not set". Sectors are now read from the single unfiltered company list that produces the rows.
- The stalled state is one boolean (`isStalled`) with the same thresholds the legacy nudge used: ≥14 days into the search, nothing moved for 14 days or no contacts yet, no live conversation, not dismissed within 7 days.

## Gate changes

- `scripts/check-dashboard-simplification-gates.mjs` audits from `resolveThreeZoneDashboardPosture(` to end of file and fails if `isStartingMondayDashboardSimplificationEnabled` or `data-first-mile-section="dashboard_legacy"` reappears. A planted-fixture test covers the new failure.

## Validation (local)

```text
npm run typecheck                                                         # clean
npx vitest run "src/app/(dashboard)/dashboard" src/lib/feature-flags.test.ts   # 57 files, 120 tests
npm run guard:dashboard-simplification                                    # OK (3 zones, 2 marked actions)
npm run test:dashboard-simplification-gate                                # 4 pass
npm run guard:plain-language                                              # OK
npx eslint (touched files)                                                # clean
```

Full unit suite, staged coverage, and the remaining pre-commit steps are recorded in the commit message; hosted build, synthetics, Playwright, and Lighthouse evidence come from CI on the pull request.

## Rollback

Revert the PR. P2a's default-on flip (`c7195f6d`) remains in place either way.
