# Route Collapse Phase 2a Evidence (R-3)

Date: 2026-10-21
Repository: Starting Monday
Base: `041bab6e` (`origin/main`, after phase 1)
Implementation branch: `simplify/r3-phase2-folds`
Ruling: R-3 default (Rich, 2026-10-21). Packet: `docs/strategy/sm-rulings-packet-r3-r4-r6-2026-10-21.md`.

## What this phase does

Two kinds of fold:

**A. Standalone routes whose content the three-zone dashboard already carries** — deleted, permanent redirect to `/dashboard`:

| Retired | Why the dashboard already covers it |
| --- | --- |
| `/dashboard/plan` | "Source of truth for Start Here" — Start Here was legacy; Zone 1 is the single next move |
| `/dashboard/start` | Setup checklist; Zone 1 precedence rule 5 renders the next setup step until activation completes. The dashboard's first-run redirect to `/start` and its `sm_first_run_seen` cookie are removed; onboarding now lands on `/dashboard` |
| `/dashboard/offers` | Offer-stage companies are rows in Zone 2 and the company record already renders offer fields; the AI **offer synthesis** moved onto the company record (renders on any offer-stage company, comparing all offers) |
| `/dashboard/optionality`, `/optionality/decision-cockpit` | Posture ("in-role, quiet") is a Zone 1 input; the cockpit was a 45-line wrapper around a component nothing else used |
| `/prep/companies` | Zone 2 is the company list; the Prep nav loses its Companies tab |

**B. Real features that were standalone routes** — moved under one primary destination with a tab strip, old paths redirect:

| Old | New | Tab |
| --- | --- | --- |
| `/dashboard/positioning` | `/dashboard/profile/positioning` | Profile › Positioning |
| `/dashboard/strategy`, `/strategy/intake` | `/dashboard/profile/strategy`, `/strategy/intake` | Profile › Strategy |
| `/dashboard/salary` | `/dashboard/profile/salary` | Profile › Compensation |
| `/dashboard/optionality/branding` | `/dashboard/profile/branding` | Profile › Brand |
| `/dashboard/help` | `/settings/help` | Settings › Help |
| `/dashboard/feedback` | `/settings/feedback` | Settings › Feedback |

`profile/layout.tsx` and `settings/layout.tsx` are thin client tab strips (same pattern as `prep/layout.tsx`). Feature code moved by directory, so co-located actions, tests, and components came along unchanged; only two `../logout-button` imports needed re-pointing.

## Corrections to the packet

- `calendar` was listed as "interview-centric → fold into `/prep/interview`". It is follow-ups-centric (`follow_ups` table) and is Zone 3's "follow-ups due" link target. **It stays.**
- `discover` (+ `recommendation/[id]`), `prep/meetings`, `prep/relationships`, `prep/communications` are deferred to phase 2b: each needs its content embedded in a record (company or contact), not a redirect.

## Collateral updated

- 17 `src/` files had inbound links rewritten; `DashboardFooter` drops "Weekly plan"; the outreach page's "Back to Start Here / Open weekly plan" buttons become one "Back to dashboard"; `HelpQuickButton` points at `/settings/help#how-this-works`.
- `scripts/user-guide-sync.ts`: the "Complete the setup checklist" guide entry now describes finishing setup from the dashboard; the help entry points at `/settings/help`.
- `docs/guide-retrieval-eval-set.json`: 12 expectations retargeted (`/dashboard/start` → `/dashboard`, `/dashboard/help` → `/settings/help`, `/dashboard/strategy` → `/dashboard/profile/strategy`, offers → compensation tab + add company). Strict eval: **recall@3 84%** (was 82% on `main`), 8 misses, all pre-existing.
- e2e: `critical-paths` asserts the retired `/start` lands on the dashboard; `mobile-key-routes`, `flow-synthetics`, `smoke` follow the moved routes.
- `docs/lint-warning-baseline.json` re-keyed for moved files.
- `src/app/(dashboard)`: **50 → 44** non-admin pages. Six pages deleted outright (`plan`, `start`, `offers`, `optionality`, `optionality/decision-cockpit`, `prep/companies`); the six moved pages still exist but as sub-routes of two primaries instead of standalone destinations.

## Validation (local)

```text
npm run typecheck                                   # clean
node scripts/check-lint-baseline.mjs                # passed, no file regressed
npx tsx scripts/eval-guide-retrieval.ts --strict    # recall@3 84.0%
guards: guide freshness, prebuild, untracked-tests, plain-language, first-week-spine,
        template drift, outreach lint, route guards, mobile-ui gate, luxury static,
        ux:rubric:pages, dashboard-simplification, deps:check    # all pass
vitest 460 files / 1768 tests; staged coverage gate passed
```

## Rollback

Revert the PR. Redirects and the two tab strips are the only behaviour changes outside the deleted routes.
