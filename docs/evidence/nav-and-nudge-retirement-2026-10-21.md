# Nav and In-App Nudge Retirement Evidence (P3)

Date: 2026-10-21
Repository: Starting Monday
Base: `93b8e53e` (`simplify/r3-phase2-folds`, PR #537 — stacked because #537 retargeted three palette entries)
Branch: `simplify/p3-nav-settings`
Rulings: R-1 (in-app nudges, 2026-10-20) and proposal §3d "One nav, not three" (adopted with R-1/R-2 defaults). Proposal: `docs/strategy/sm-simplification-proposal-2026-10-20.md` §2a rows `PersonalEmailNudge`, `ProfileInactivityNudge`; §3d; §5 P3.

## Before

| Surface | State at `93b8e53e` |
| --- | --- |
| Desktop navigation | None persistent. Pages carried their own headers; the command palette (⌘K) listed 13 quick actions including `Follow-ups` and `Calendar` (same destination twice), `LinkedIn optimizer`, `Strategy brief`, `Feedback`, `Guide`, `Help`, `Billing`. |
| Mobile navigation | `BottomNav` — five tabs (Home · Companies · Signals · Contacts · Profile). |
| `PersonalEmailNudge` | Layout-level banner on **every** authenticated page for any login on a non-consumer domain, dismissible via `localStorage`. |
| `ProfileInactivityNudge` | 90-second idle timer on `/dashboard/profile` → fixed bottom bar "Still with you. Save your progress so far." |

## After

- **One nav.** `PrimaryNav` (renamed from `BottomNav`, same five items and icons) renders the mobile tab bar unchanged **and** a 64px desktop left rail (`hidden md:flex`), with Settings anchored at the foot of the rail. The layout adds `md:pl-16` so content clears the rail. The proposal put Settings "under the avatar"; there is no avatar shell to hang it from, so the rail's foot is the equivalent — one tap, out of the primary five.
- **Palette shrunk** to the same five + Settings (+ Chat when entitled, per R-6): `Home · Add company · Signals · Contacts · Profile · Settings · Chat with AI`. Typing still searches companies and contacts. Dropped: Daily briefing (Zone 3 links there), Strategy brief / Feedback / Help / Billing (now tabs under Profile and Settings after #537), Follow-ups and Calendar (duplicate pair), LinkedIn optimizer (marketing tool), Guide.
- **`PersonalEmailNudge` retired as a banner.** The underlying risk is real (briefings to a work inbox an assistant reads), so the message moves to the one page where it can be acted on: `/dashboard/profile` shows an inline notice when `isCorporateEmail(user.email)` and no `briefing_email` is set, linking to the field. No dismissal state needed; it disappears when the field is filled. `src/lib/email-domains.ts` holds the domain list.
- **`ProfileInactivityNudge` retired.** Replaced by `FormDraftKeeper`: unsaved profile edits are mirrored to `sessionStorage` (debounced 400 ms; passwords/files/hidden fields skipped) and offered back after a reload or accidental navigation with a "Discard" button. Nothing is written to the server until Save. The pure serialise/diff helpers are unit-tested.

Not in this PR: `DashboardPrimaryNavSections` and the Pipeline/Signals pills named in §3d do not exist at `93b8e53e` (`Select-String -Pattern 'DashboardPrimaryNavSections' -Recurse src` → 0 hits); they were removed with the legacy dashboard in P2b. The single email-preferences card shipped in #539.

## Files

- `src/app/(dashboard)/_components/PrimaryNav.tsx` (renamed from `BottomNav.tsx`; exports `PrimaryNav`, `isPrimaryNavItemActive`, `PRIMARY_NAV_HREFS`)
- `src/app/(dashboard)/layout.tsx` — `PrimaryNav`, `md:pl-16`, no banner
- `src/app/(dashboard)/_components/CommandPalette.tsx` — `QUICK_ACTIONS` 13 → 7
- `src/app/(dashboard)/dashboard/profile/page.tsx` — inline notice; `FormDraftKeeper`
- `src/app/(dashboard)/dashboard/_components/FormDraftKeeper.tsx`, `form-draft.ts` (+ test)
- `src/lib/email-domains.ts` (+ test)
- Deleted: `_components/PersonalEmailNudge.tsx`, `dashboard/_components/ProfileInactivityNudge.tsx`
- Gates repointed to the renamed file: `scripts/check-mobile-ui-contract.mjs`, `scripts/precommit-mobile-ui-gate.mjs`, `scripts/check-landing-standard-all-pages.mjs`; `docs/lint-warning-baseline.json` re-keyed.

`tests/e2e/mobile-ui.spec.ts` still finds `nav[aria-label="Mobile navigation"]`; the desktop rail is `nav[aria-label="Primary navigation"]`.

## Validation (local)

typecheck clean · 463 unit files / 1,784 tests · staged coverage gate (src/app changed files 100% lines, 86.7% branches) · eslint 0 errors · lint baseline (no file regressed) · docs index · all hook guards (guide freshness, prebuild, untracked-tests, plain-language, first-week-spine, template drift, outreach lint, route guards, mobile-ui gate, luxury static, ux rubric, dashboard-simplification, public-assets, landing-standard).

## Rollback

Revert the PR. `sessionStorage` drafts are harmless if the keeper disappears.
