# Production Promotion Record — 2026-10-21

Repository: Starting Monday · Railway project `ample-blessing` · customer domain `startingmonday.app`

## What was found

| Fact | Evidence |
| --- | --- |
| Production serves `75986276` (#509, 2026-09-04) | `GET https://startingmonday.app/api/health` → `commit 7598627633…`, uptime ≈ 40.7 days; `/api/deploy-marker` → same SHA |
| `refs/heads/production` had not moved since 2026-09-04 | `git ls-remote --heads origin production` → `7598627633…` before promotion |
| `main` deploys to staging; the customer domain deploys from `production`; promotion is manual | `docs/onboarding/05-dev-workflow.md` "The One Rule"; Railway deployment triggers: web `branch=production`, worker `branch=production`, both `checkSuites=false` |
| 22 commits were waiting, including the critical `next/og` RCE patch (#516, 2026-09-10) | `node scripts/promote-to-production.mjs` dry run |
| The Deployment Watchdog reported `success=true` on the stale SHA for 46 days | run `39579896688`: `sha=75986276 age=67227m state=marker:7598627633… success=true` — it checks that the production branch is served, not how far behind `main` it is |
| `post-deploy.yml` and `release-completion-gate.yml` run **on the push** to `production` and assert the pushed SHA is already live, so they fail before any deploy exists | runs `39609035805`, `39609035821` on `0f428996`; the 2026-09-03 production deployment of `7e73a5c2` was `SKIPPED: "CI check suite failed"` while `checkSuites` was still enabled |
| The worker service is on the same stale commit, so P1's email retirements were not live either | Railway `Starting-Monday-worker-sub` production latest deployment `75986276` (2026-09-04) |

## What was done (owner-directed, Rich 2026-10-21: "Promote main HEAD to production now")

1. Staging gate verified through the guarded script: `SUCCESS` deployment of `0f428996` at 2026-10-21T05:00:10Z. `0241efa8` (main HEAD, #532) was never built on staging because it changed no runtime files; it differs from `0f428996` only in CI config, tests, and a JSON record, so `0f428996` was promoted under the rule rather than skipping the staging check.
2. `node scripts/promote-to-production.mjs --to 0f428996 --apply` → `production moved 7598627 -> 0f42899` (13:33 UTC). Required a Windows fix to the script's Railway call (this PR).
3. Railway created **no** deployment for the push. `serviceInstanceDeployV2` for both the web and worker services returned `"Deploys have been paused temporarily"`; `https://status.railway.com` reads "Builds remain paused" (platform incident). Retried every 3 minutes from 14:05 to 14:47 UTC; still paused.

## State at hand-off

- `production` = `0f428996`. Customer domain still serves `75986276` until Railway resumes builds.
- When builds resume, either Railway redelivers the push, or run for each service:
  `mutation { serviceInstanceDeployV2(serviceId: "<id>", environmentId: "4b51d032-d48c-4d13-a2a6-684edf0e6e07", commitSha: "0f428996c816ca43816f46a26011150e673e71cf") }`
  (web `fdfc580a-0872-490b-a08c-e78b5f751a1b`, worker `0e2b55ed-fd89-4ecc-bb42-5e309af36745`), or click **Deploy** on the latest `production` commit in the Railway dashboard.
- Then re-run the two failed gates on `0f428996` (`gh run rerun 39609035805`, `gh run rerun 39609035821`) so the production check suite reflects reality.

## Defects to fix separately

1. `deployment-watchdog.yml` should fail (or at least alert) when `production` is more than N commits/days behind `main`; today it only confirms the branch is served.
2. `post-deploy.yml` and `release-completion-gate.yml` should trigger on `deployment_status` for `ample-blessing / production` (Railway emits those: 35 records exist) instead of on `push`, or wait for the deploy marker before asserting.
3. `scripts/promote-to-production.mjs` Windows spawn — fixed in this PR.

## Update 2026-10-22 (Chris, with Claude): schema readiness for the next promotion

- 08:01 UTC: Railway queued the web and worker deployments of `0f428996` on its own as the platform incident wound down (builds re-enabled for Pro workspaces 07:11 UTC). No manual deploy call was needed.
- Migrations `184` and `185` were verified present in the production database (`ats_boards.probed_providers`, `users.is_synthetic`, `emi_kpi_snapshots.quality_flag`, `emi_kpi_event_funnel`, `emi_kpi_day7_cohort`), so `0f428996` needs no schema work.
- `main` had moved 13 commits past `0f428996` (#533 to #542) and two of them carry migrations that were NOT in production or staging: `186_weekly_summary_opt_in.sql` and `187_interview_preps.sql`.
- Both applied 2026-10-22 ~08:30 UTC through the Supabase MCP, staging (`yeimmrcgnwhrczgqrofn`) first, then production (`mytnhoxcgvnzxhgcumkf`). `187` was applied without its `drop ... if exists` guards (no-ops: the table did not exist), end state identical. Verified on both projects: column present; table, index, RLS enabled, 4 policies, trigger present.
- Result: `main` HEAD (`f4f08e59`) is schema-ready for promotion.

## Update 2026-10-22 13:08–13:28 UTC: promotion to `7c4c1de6`

- Railway builds for this workspace resumed ~05:09 UTC (first accepted staging deploy after 18 "Deploys have been paused temporarily" refusals between 04:04 and 04:56 UTC; Railway's GitHub-App pushes made during the pause were dropped, so staging had no record for any of the 13 commits after `0f428996` until one was triggered by API).
- Staging verified `f4f08e59` (05:09 UTC), then auto-built `84fe4714`, `bad3842e`, `7c4c1de6` as #543–#545 merged — webhooks live again.
- Schema gate: migrations 186 and 187 applied to staging and production by the Cowork lane at ~08:30 UTC (section above). The dispatchable workflow added in #545 failed its first run (`39780792227`, `ERROR 25006` read-only transaction); #547 adds `read_only: false` and remains useful as an idempotent re-verify.
- `node scripts/promote-to-production.mjs --to 7c4c1de6 --apply` at 13:08 UTC: `staging verified: SUCCESS deployment of 7c4c1de at 2026-10-22T12:42:46Z`; `production moved 0f42899 -> 7c4c1de`. `6344d1c5` (main HEAD) is docs-only (`git diff --stat 7c4c1de6 6344d1c5` → 1 file, 8 insertions).
- Railway: worker `SUCCESS` 13:16:50 UTC, web `SUCCESS` 13:28:16 UTC. `GET https://startingmonday.app/api/health` → `commit 7c4c1de63bddbbfbe39cbd653c51d7af4ab18664, status ok`; `/api/deploy-marker` → same SHA.
- Gates: Deployment Watchdog `39784229082` success. Release Completion Gate `39784229240` failed at push time (deploy did not yet exist — defect D2 above), success on re-run. Post-Deploy Gate `39784229085` fails on re-run in the outreach canary: #543 moved the hub under `/dashboard/admin`, where non-staff get a 404 at the same URL, so the canary's URL-based staff skip no longer trips. Fix in #549 (test-only); the gate runs from the `production` branch and will clear on the next promotion.

What is now live for customers: three-zone dashboard, P1 email cadence, legacy demos retired, R-3 phases 1/2a/2b/2c (62 → 39 solo pages), R-6 entitlement gates, R-4 three-screen onboarding, P1b weekly summary opt-in, P3 primary nav and nudge retirement, interview prep persistence, route-count ratchet.

## Update 2026-10-22 16:37–17:15 UTC: promotion to `b5eb0e28` and staging schema drift (180, 181, 183)

- #548 (R-3c follow-ups rename) merged 13:52 UTC as `9d5a28a5`; #549 (outreach canary skip guard) merged 16:37 UTC as `b5eb0e28`. Staging served `b5eb0e28` from 16:42:09 UTC.
- `node scripts/promote-to-production.mjs --to b5eb0e289ab4ec041f5d2750fc5072c88a28f5a1 --apply`: `staging verified: SUCCESS deployment of b5eb0e2 at 2026-10-22T16:37:39.793Z`; `production moved 7c4c1de -> b5eb0e2` (ships #546, #548, #549). `GET https://startingmonday.app/api/health` → `commit b5eb0e289ab4ec041f5d2750fc5072c88a28f5a1` from 16:49:34 UTC; `/api/deploy-marker` → same SHA. `/dashboard/calendar` → `308 /dashboard/follow-ups`.
- Gates on `b5eb0e28`: Deployment Watchdog `39816184833` success; Release Completion Gate `39816184442` success; Post-Deploy Gate `39816184549` attempt 1 failed on one public test (`luxury-ux` first-click for `/for-coaches`, mobile only, `net::ERR_ABORTED`; desktop passed; the route returns 200), attempt 2 success. In attempt 1 the outreach canary passed (the #549 fix) and the authenticated P0 synthetics against production were 11 passed, 0 unexpected, 5 skipped (artifact `post-deploy-synthetic-results`), including Synthetic-03 (dashboard with auth session) and Synthetic-09 (dashboard route sweep).
- main CI `39815554919` (`b5eb0e28`) Playwright E2E against staging failed 23 tests, 22 with `net::ERR_ABORTED`. The call logs show `/dashboard` → `/onboarding` → `/dashboard` repeating. Cause: #538 (R-4) added `search_posture` to the dashboard's `user_profiles` select; the staging project `yeimmrcgnwhrczgqrofn` never received migration `183_user_profile_search_posture.sql`, so the select errored, the dashboard read `profile = null` and redirected to `/onboarding`, and onboarding's narrower select saw `onboarding_completed_at` and redirected back. Probe: PostgREST `user_profiles?select=search_posture` → staging `400 42703 column user_profiles.search_posture does not exist`, production `200`. Production was never affected.
- Earlier runs did not show this because auth setup failed on staging and every authenticated test skipped (e.g. `39783672540`); main CI has not been green since `31771055411` (2026-08-14).
- Staging drift probe of the objects added by migrations 160–187: missing on staging only `180_watchlist_source_coverage.sql`, `181_watchlist_names_layer.sql`, `183_user_profile_search_posture.sql` (all present in production). Staging `supabase_migrations.schema_migrations` recorded `175`–`178` and timestamped MCP versions, not 180/181/183.
- Repair, completed before 17:03 UTC: applied 180, 181, 183 from `origin/main` to staging only, in one transaction, via `supabase db query --linked --project-ref yeimmrcgnwhrczgqrofn --file`; recorded versions `180`, `181`, `183` in `supabase_migrations.schema_migrations`; `notify pgrst, 'reload schema'`. Verified: `watchlists`, `watchlist_entries`, `source_coverage`, `adapter_health`, `watchlist_exec_snapshots` present, 5 policies, `user_profiles.search_posture` `text`; PostgREST `200`.
- main CI re-run (attempt 2, 17:03:19–17:09:56 UTC): 0 `ERR_ABORTED`, 113 passed, 8 failed. Six are tests left behind by this simplification series and are fixed test-only in the PR that carries this note: outreach smoke ×2 and site-monitoring outreach (non-staff 404 at `/dashboard/admin/outreach` after #543; shared staff guard `tests/e2e/outreach-hub.helpers.ts`); coach R-6 and outplacement R-6 (the entitlement redirect completes after `goto` resolves; wait for the rendered h1 before reading the URL); site-monitoring company detail (the three-zone dashboard from #529 links companies only to `/{id}/prep` and `/new`; derive the id from `a[data-dashboard-action="company_brief"]`; same latent selector in `global-setup.ts` and `critical-paths.spec.ts`).
- Two failures are older than this series and are left for a separate decision: `smoke.spec.ts` "add contact" uses `page.selectOption('select[name="channel"]')` against the shadcn `Select` (since 2026-05-27, `18837fa0`); `landing-hero.spec.ts` navigates to the real `mandatesignal.com/example` and expects a redirect to `/`, but `mandatesignal.com` is now the separate MandateSignal deployment.