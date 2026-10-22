# Route Collapse Phase 2c Evidence (R-3)

Date: 2026-10-21
Repository: Starting Monday
Base: `f4f08e59` (`main`)
Branch: `simplify/r3-phase2c-calendar-outreach`
Ruling: R-3 default adopted (Rich, 2026-10-21). Packet rows: `/dashboard/contacts` absorbs `outreach`; `/prep/interview` absorbs `calendar`.

## Shipped: `/dashboard/outreach` → `/dashboard/contacts` (40 → 39 non-admin pages)

At `f4f08e59` the Outreach Hub (`page.tsx` 472 lines, `outreach-hub-client.tsx` 1,104, `outreach-data.ts` 747) was a staff-only operations surface living under the solo-user tree: `if (!staff) redirect('/dashboard/contacts')` on L52, and it was already registered in `admin-page-config.ts` under Platform Operations. Nothing a solo user can reach rendered there.

- Directory moved to `src/app/(dashboard)/dashboard/admin/outreach/` (git rename; no content change beyond dropping the now-duplicate page-level staff gate — the admin layout returns 404 for non-staff).
- `next.config.ts`: `/dashboard/outreach` → `/dashboard/contacts`, permanent.
- Admin links repointed to `/dashboard/admin/outreach`: `admin/crm`, `admin/outreach-analytics`, `admin-page-config.ts`, `generate-monitoring-matrix.mjs` tier-0 list, `audit-outreach-momentum.ts` import, e2e specs (`smoke`, `outreach-canary`, `site-monitoring`, `flow-synthetics`, `mobile-key-routes`).
- Solo-user links repointed to `/dashboard/contacts`: `progress/page.tsx` ("Outreach briefs this week"), `post-placement-view.tsx` (two), `role-lane-learning.ts` toolkit asset (+ its test).
- `docs/lint-warning-baseline.json` re-keyed for the four moved files.

Inbound query at `f4f08e59`: `Get-ChildItem -Recurse src -Include *.tsx,*.ts | ? Name -notmatch '\.test\.' | Select-String "'/dashboard/outreach|\"/dashboard/outreach"` → 7 hits, listed above.

## Not shipped: `/dashboard/calendar` → `/prep/interview` — needs a ruling

The packet row rests on two premises that do not hold at `f4f08e59`:

| Packet said | Measured |
| --- | --- |
| "interview-centric" | The page reads `follow_ups` (L79–88) and renders overdue/upcoming **follow-ups** with company/contact joins and Google Calendar links. No interview data. |
| "2 inbound" | **14** non-test inbound references: dashboard Zone 1 next-move `"View follow-ups"` (`page.tsx` L104), Zone 3 `"follow-ups due"` tile (L685), briefing CTA target (`briefing/page.tsx` ×4, `briefing/actions.ts`), `progress/page.tsx`, `DashboardFooter`, `outreach/page.tsx`, and three `revalidatePath('/dashboard/calendar')` calls in server actions that write follow-ups. Query: `Select-String '/dashboard/calendar'` over `src` excluding tests and the route itself. |

Folding it into `/prep/interview` would send "3 follow-ups are due → View follow-ups" to an interview worksheet. That contradicts the three-zone brief, where Zone 1's next move must land on the thing to do.

**Drafted default for Rich:** withdraw the `calendar → /prep/interview` row. Keep the page as the follow-ups list and rename the route to `/dashboard/follow-ups` (with `/dashboard/calendar` redirecting) so the URL says what it is; retitle the `h1` from "Calendar" to "Follow-ups". That is a one-PR rename with no UI change. Alternative: fold the list into `/dashboard/contacts` as a "Due" section — larger, and it would make the contacts page the Zone 1 destination for company follow-ups too.

Until ruled, `/dashboard/calendar` stays. Current solo-user count is 39 pages.

## Validation (local)

typecheck clean · 467 unit files / 1,810 tests · staged coverage gate · eslint 0 errors · lint baseline (no file regressed) · guide sync 584 entries, strict eval recall@3 84% · docs index · all hook guards (guide freshness, prebuild, untracked-tests, plain-language, first-week-spine, template drift, outreach lint, route guards, mobile-ui gate, luxury static, ux rubric 10/10, dashboard-simplification, public-assets). `monitor:matrix:check:strict` fails identically on `main` (tier-1 route coverage 20.3% < 75%) and is not a PR gate.

## Rollback

Revert the PR. No data or API routes touched.
