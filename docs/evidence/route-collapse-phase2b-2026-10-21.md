# Route Collapse Phase 2b Evidence (R-3)

Date: 2026-10-21
Repository: Starting Monday
Base: `93b8e53e` (`simplify/r3-phase2-folds`, PR #537 — stacked because both phases edit `next.config.ts` redirects)
Branch: `simplify/r3-phase2b-folds`
Ruling: R-3 default adopted (Rich, 2026-10-21). Packet: `docs/strategy/sm-rulings-packet-r3-r4-r6-2026-10-21.md` §R-3 table rows for `/dashboard` (discover), `/dashboard/companies/[id]` (`prep/meetings`), `/dashboard/contacts` (`prep/relationships`, `prep/communications`).

## Routes folded (44 → 40 non-admin authenticated pages)

| Retired route | Redirect → | What was there | What happens to it |
| --- | --- | --- | --- |
| `/dashboard/discover` | `/dashboard/companies/new` | 284-line client page: AI company suggestions (`POST /api/discover`), seed-based "find similar", add-to-pipeline cards | Moved verbatim into `companies/new/discover-suggestions.tsx` and mounted below the add form as "Not sure who to add?". Suggestions now load **on request** (button), not on page open, so the add form stays primary and the Anthropic call is made only when asked. `recommendation/[id]` stays (its links come from API data via `narrativeUrl`); its two back-links now point at the add-company page. |
| `/prep/meetings` | `/prep/interview` | 237-line worksheet: `<form>` with eight textareas and **no action or handler** — nothing typed was ever saved — plus `MeetingDebriefPersistencePanel` (saves to `meeting_debriefs` via `/api/meetings/debrief`) and `CultureFitRetentionSignalsCard` (static copy) | Debrief panel and culture card moved onto `/prep/interview`; the unsaved worksheet is deleted. |
| `/prep/communications` | `/prep/interview` | 249-line worksheet, same pattern (`<form>` with no action) | Deleted. |
| `/prep/relationships` | `/dashboard/contacts` | 276-line client page over `user_relationships` — a parallel people list that nothing else reads (`user_relationships` has exactly one consumer at `93b8e53e`: this page) | Deleted. Table and rows untouched (no data deletion in R-3). Contacts is the one people list. |

The `/prep` layout drops its three-tab strip; interview prep is the only page left under it.

### Inbound links at `93b8e53e`

Query (from repo root): `Get-ChildItem -Recurse src -Include *.tsx,*.ts | ? Name -notmatch '\.test\.' | Select-String '<route>(?![\w/-])'`

| Route | Inbound `href`s | From |
| --- | ---: | --- |
| `/dashboard/discover` | 2 | only its own `recommendation/[id]` page and actions (both retargeted) |
| `/prep/meetings` | 1 | `prep/layout.tsx` tab (removed) |
| `/prep/communications` | 4 | `prep/layout.tsx`, `prep/interview`, `prep/meetings`, `prep/relationships` (all removed or retargeted) |
| `/prep/relationships` | 0 | — |

## Deferred to phase 2c (not in this PR)

- `/dashboard/calendar` → `/prep/interview` (packet row): **19 inbound** references including server actions that build calendar URLs (`dashboard/actions.ts`, `briefing/actions.ts`, `contacts/actions.ts`) and Google Calendar sync. Needs its own PR with the event list moved onto interview prep.
- `/dashboard/outreach` → `/dashboard/contacts`: 2,284 lines across five files; already redirects when ungated. Separate PR.
- `/prep/interview` itself is also an unsaved worksheet ("Save interview prep" posts nowhere). The ruling keeps the route; whether to wire persistence or retire the worksheet in favour of the company prep page (`/dashboard/companies/[id]/prep`, which has the AI brief) — **ruled 2026-10-21: wire persistence.** Shipped in `docs/evidence/interview-prep-persistence-2026-10-21.md`.

## Gates updated

- `scripts/check-ux-ui-rubric-pages.mjs`: `dashboard-discover` spec now points at `companies/new` (`page.tsx` + `discover-suggestions.tsx`); the dark-shell rule is replaced by "suggestions mounted on the add-company page"; grid-density and copy-drift rules kept.
- `tests/e2e/mobile-elite-visual.spec.ts`: route `dashboard-discover` → `dashboard-companies-new`; the recommendation-detail test opens suggestions first. The two `elite-dashboard-discover-*` baselines are removed (they pictured a page that no longer exists); the next authenticated mobile visual run writes `elite-dashboard-companies-new-*`.
- `docs/guide-retrieval-eval-set.json`: "Where can I run discovery?" → `/dashboard/companies/new`; strict eval recall@3 84% (50 cases).
- `docs/lint-warning-baseline.json`: four deleted files dropped (614 → 534 current warnings; no file regressed).

## Validation (local)

typecheck clean · 461 unit files / 1,777 tests · staged coverage gate (no covered-folder files changed) · eslint on changed files (0 errors) · guide sync (583 entries, 0 stale route refs) · docs index · all hook guards (guide freshness, prebuild, untracked-tests, plain-language, first-week-spine, template drift, outreach lint, route guards, mobile-ui gate, luxury static, ux rubric 10/10, dashboard-simplification, public-assets).

## Rollback

Revert the PR. No data or API routes were removed; `/api/discover`, `/api/meetings/debrief` and `user_relationships` are intact.
