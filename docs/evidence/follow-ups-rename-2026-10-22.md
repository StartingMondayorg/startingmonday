# R-3c Evidence: `/dashboard/calendar` → `/dashboard/follow-ups`

Date: 2026-10-22
Repository: Starting Monday
Base: `6344d1c5` (`main`)
Branch: `simplify/r3c-follow-ups-rename`
Ruling: R-3c, option A (Rich, 2026-10-22): withdraw the packet's `calendar → /prep/interview` row; rename the route to `/dashboard/follow-ups`, retitle, redirect. Options and evidence in `docs/evidence/route-collapse-phase2c-2026-10-21.md`.

## Change

| | Before | After |
| --- | --- | --- |
| Route | `/dashboard/calendar` | `/dashboard/follow-ups` (`/dashboard/calendar` → permanent redirect, query string preserved by Next) |
| `metadata.title` / `h1` | Calendar | Follow-ups |
| Footer label | Calendar | Follow-ups |
| Week navigation links | `/dashboard/calendar?week=` | `/dashboard/follow-ups?week=` |

No data, component or layout change. `calendar-item.tsx` keeps its name (it renders the "Add to Google Calendar" action, which *is* about a calendar).

## References updated (query: `Select-String '/dashboard/calendar'` over `src`, `tests`, `scripts`, `config` at `6344d1c5` → 30 hits, 0 after)

- Dashboard Zone 1 next move and Zone 3 tile (`dashboard/page.tsx` L104, L685)
- Briefing CTA target type, three assignments and the hidden form field (`briefing/page.tsx`, `briefing/actions.ts`)
- `revalidatePath` in `dashboard/actions.ts`, `contacts/actions.ts` (×2) and the `actions.test.ts` expectation
- `progress/page.tsx`, `admin/outreach/page.tsx`, `DashboardFooter.tsx`
- E2E: `dashboard-contract-consistency`, `dashboard-mobile-ui`, `mobile-key-routes`, `mobile-ui` (route lists, allowed labels and heading matchers)
- `scripts/trust-integrity-agent.mjs`, `config/dashboard-behavior-baseline.json` (budget key)
- `docs/lint-warning-baseline.json` re-keyed; `config/route-count-baseline.json` recorded at **39** (was 40, captured before #543 merged)
- Guide eval case "How do I check calendar events?" → "Where do I see my follow-ups that are due?" → `/dashboard/follow-ups`; strict recall@3 84%

## Validation (local)

typecheck clean · 467 unit files / 1,810 tests · staged coverage gate · eslint 0 errors · lint baseline (no file regressed) · route-count ratchet 39/39 + its 6 node tests · dashboard behaviour baseline tests · guide sync + strict eval · docs index · all hook guards (guide freshness, prebuild, untracked-tests, plain-language, first-week-spine, template drift, outreach lint, route guards, mobile-ui gate, luxury static, ux rubric 10/10, dashboard-simplification, public-assets).

## Rollback

Revert the PR.
