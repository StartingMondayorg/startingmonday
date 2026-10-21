# Route Collapse Phase 1 Evidence (R-3 / R-6)

Date: 2026-10-21
Repository: Starting Monday
Base: `59e71c40` (`origin/main`)
Implementation branch: `simplify/r3-redirect-only-routes`
Rulings: R-3 default and R-6 (default for coach/outplacement/partner/chat; delete `concierge` and `board-track`), Rich 2026-10-21. Packet: `docs/strategy/sm-rulings-packet-r3-r4-r6-2026-10-21.md`.

## Scope of this phase

The twelve routes that had **zero inbound links** at `0241efa8` and needed no destination UI to be built. Each is deleted and replaced by a permanent redirect in `next.config.ts`; the redirect entries carry a comment to delete them after 30 days of zero hits in `route-inventory`.

| Retired route | Redirects to | Why this destination |
| --- | --- | --- |
| `/dashboard/executive-brief` | `/dashboard` | Resolved within Zone 1 (2026-08-19 brief §2) |
| `/dashboard/kanban` | `/dashboard` | Was already a 29-line "moved to the main dashboard" tombstone |
| `/dashboard/wrap-up` | `/dashboard` | Already redirected to `placed`; the placed state renders on `/dashboard` (`DashboardPostPlacementView`) |
| `/dashboard/placed` | `/dashboard` | Same |
| `/dashboard/concierge` | `/dashboard` | R-6 alternative: deleted. `concierge_calls` table and the marketing `/concierge` page are untouched |
| `/dashboard/board-track` | `/dashboard` | R-6 alternative: deleted. Read only `user_profiles` |
| `/dashboard/pilot-outreach` | `/dashboard/contacts` | Outreach lives on the contact record |
| `/dashboard/results` | `/dashboard/progress` | Retrospective view |
| `/dashboard/post-search` | `/dashboard/progress` | Retrospective view; the dashboard's `careerMode === "post_search"` redirect now targets `/dashboard/progress` directly |
| `/dashboard/post-landing` | `/dashboard/progress` | Retrospective view; the only inbound link was from `/dashboard/optionality`, itself folding into profile in phase 2 |
| `/dashboard/invite` | `/settings` | Settings owns team/invite; the command-palette entry is removed |
| `/dashboard/support` | `/dashboard/help` | Help already answers "how can we help"; both fold into a settings tab in phase 2 |

Deferred from the original zero-inbound list: `/dashboard/discover/recommendation/[id]` — the discover API (`src/app/api/(intelligence)/discover/route.ts`) emits those URLs, so it is not an orphan; it goes with the discover fold in phase 2.

## Collateral

- `executive-brief-hub.tsx` moved from the dashboard route to `src/app/(marketing)/executive-brief/`, its only remaining importer (the public demo). `/api/executive-brief/*` (grill-me sessions, transcription) is now reachable only through that demo's interactions; flagged for the marketing-lane review.
- `src/lib/placed-proof-architecture.ts` (+ test) deleted: only the placed page imported it.
- `docs/lint-warning-baseline.json` re-keyed for the moved file and trimmed of the four deleted entries.
- 37 tracked paths changed; `src/app/(dashboard)` is down from 62 to **50** non-admin pages.

## Validation (local)

```text
npm run typecheck                         # clean
node scripts/check-lint-baseline.mjs      # passed, no file regressed
guards: guide freshness, prebuild, untracked-tests, plain-language, first-week-spine,
        template drift, outreach lint, route guards, mobile-ui gate, luxury static,
        ux:rubric:pages, dashboard-simplification, deps:check   # all pass
```

Full unit suite and staged coverage are in the commit message; hosted build, redirects, synthetics, and Lighthouse come from CI on the pull request.

## Next phases (same ruling, separate PRs)

- Phase 2 folds that need a destination section: `strategy` + `strategy/intake` → profile, `salary` → profile, `positioning` → profile, `optionality/*` → profile, `offers` → company stage, `calendar` → `/prep/interview`, `discover` (+ recommendation) → Zone 2 suggestions, `plan` → `/dashboard`, `prep/companies`, `prep/meetings`, `prep/relationships`, `prep/communications` → company / contact records, `start` → Zone 1 activation state, `feedback`/`help` → settings tabs.
- R-6 gating PR: `requireEntitlement` on `coach`, `outplacement/*`, `partner`, `chat`; hide from palette, nav, sitemap.
- R-4 onboarding 9 → 3.

## Rollback

Revert the PR. Redirects are the only behaviour change outside the deleted routes.
