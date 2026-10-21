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
