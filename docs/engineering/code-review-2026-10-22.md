# Starting Monday code, system, deployment, operations and security review (2026-10-22)

Reviewed: `origin/main` at `f693908b` (2026-10-22 21:45 UTC). Production serves `5eb737f9`; the only difference is test and docs changes.
Method: five parallel read-only reviews (security, data layer, worker and jobs, CI/CD and operations, code quality), followed by direct verification of every P0 and P1 finding against code, GitHub, Railway and the live Supabase projects.

- **Verified** means I reproduced the finding myself. The evidence column says how.
- **Cited** means a reviewer read the code and cited file and line, and I did not re-run it.
- I tried to query the Supabase system catalogs directly (`supabase db query`) and the CLI hung at "Initialising login role" on both projects. The RLS questions were answered through PostgREST instead (finding P2-1).

## Summary

The product has a sound security foundation: a strict nonce CSP, webhook signature verification, RLS on 229 of 234 tables, a coach-access helper on every coach route, and same-origin redirect checks. The serious risks are in **release safety and operational truthfulness**, not in the application code:

1. The privacy promise "delete your account in Settings" is published but not implemented.
2. The production post-deploy synthetic gate cannot fail, and it posts a failure alert after every *successful* deploy.
3. Schema changes reach each environment by hand, with no drift detection. Staging was missing three migrations today.
4. The `main` branch protection does not protect `main`. It requires 0 reviews, does not apply to admins, and none of its 5 required checks is E2E. E2E was red for 69 days while merges continued.

## P0: fix now

| # | Finding | Evidence | Status | Fix |
| --- | --- | --- | --- | --- |
| P0-1 | **Account deletion is promised but does not exist.** `src/app/(marketing)/security/page.tsx:109` tells users to "go to Settings and use the account deletion option. All records are removed from our systems within 30 days", and `:143` repeats it as the CCPA mechanism. The user guide bundle (`src/data/features-docs.bundle.json`) says the same. | No `auth.admin.deleteUser` anywhere in `src` (the only `auth.admin` calls are `getUserById` and `createUser`). No delete or erase entry point in `src/app/(dashboard)/settings`, `src/app/api/(account)` or `worker/`. Export exists (`api/(account)/profile/export`). | Verified | Implement authenticated deletion: cascade through all user-owned tables, storage, third-party processors (Resend, PostHog, Stripe customer), a 30-day job and an audit row. Until it ships, change the published copy to the real process, such as email support. This is a regulatory and misrepresentation exposure, not only a missing feature. |
| P0-2 | **The production synthetic gate can never fail, and it alerts on every green deploy.** `post-deploy.yml:209-246` swallows Playwright's exit code (`\|\| EXIT_CODE=$?`), exits 0 on JSON parse failure, and counts `test.status === 'passed'`. Playwright's JSON `tests[].status` is `expected`/`unexpected`/`flaky`/`skipped`, so every passing test counts as failed. | Run `39816184549` attempt 1: the artifact showed 11 expected and 0 unexpected, yet "Alert on post-deploy synthetic failure" ran (`success`, not `skipped`). The same happened on `39840174606` attempt 2. The job conclusion is `success` regardless. | Verified | Count by `status === 'unexpected'`. Fail the step when `EXIT_CODE != 0` or parsing fails. Keep the Slack alert, but only for real failures. Add a fixture test for the parser. |
| P0-3 | **Migrations have no environment pipeline and no drift detection.** Migrations are applied by hand (Supabase MCP, or `apply-*-migrations.yml` hard-coded to the production ref). Two pairs of migrations share numbers (`175_lead_scoring_runs_rls`/`175_live_brief_foundation`, `176_live_brief_artifacts`/`176_sec_scanner_tables_rls`), and history mixes numeric and timestamp versions. | Staging lacked 180, 181 and 183 while production had them. PostgREST `user_profiles?select=search_posture` returned staging `400 42703` and production `200`. That one column caused a `/dashboard` â†” `/onboarding` redirect loop and 22 staging E2E failures today (`docs/evidence/production-promotion-2026-10-21.md`). | Verified | Run one ordered `supabase db push` per environment in CI, staging first, gated before promotion. Add a required check that compares repo migrations with `supabase_migrations.schema_migrations` in both projects. Renumber the duplicates. |
| P0-4 | **`main` branch protection does not enforce quality.** `required_approving_review_count: 0` and `enforce_admins: false`. The required checks are only Predeploy, Auth UX guard, Mobile visual smoke, First-value synthetic gate and Semgrep, with no Playwright E2E. "Mobile visual smoke" is required but skips on most PRs, and a skip satisfies it. | `gh api repos/StartingMondayorg/startingmonday/branches/main/protection`. Main CI was not green from `31771055411` (2026-08-14) to `39859814065` (2026-10-22). | Verified | Require at least 1 review (CODEOWNERS for `supabase/`, `.github/`, `src/lib/supabase`, auth), enforce for admins, and make the E2E job and a schema-parity check required. Replace conditional-skip required checks with a wrapper that always reports. |

## P1: fix this sprint

| # | Finding | Evidence | Status | Fix |
| --- | --- | --- | --- | --- |
| P1-1 | **Latent email-verification bypass at signup, combined with email-keyed admin access.** When Supabase reports signups disabled, `api/(auth)/auth/verify-and-signup/route.ts:79-86` calls `admin.auth.admin.createUser({ email, password, email_confirm: true })` and signs the user in, which creates a confirmed account for any address. Staff access is `getStaffMember(user.email)` (`src/lib/staff.ts:23-37`), and `:40-49` returns an `owner` record for **any** email when `NODE_ENV === 'development'`. | Production `/auth/v1/settings`: `disable_signup=false`, `mailer_autoconfirm=false`, so the fallback is not reachable in production today. It becomes reachable the moment signups are turned off, which is the situation it was written for. Anyone can then register an unclaimed staff, coach or invite email. **Staging** has `mailer_autoconfirm=true`, so on staging any email can be registered and confirmed today, and the email-keyed staff check is bypassable there for any staff email without a staging account. | Verified (latent in production; live on staging) | Remove the `createUser` fallback or require a verified OTP before it. Authorize staff by user id and `email_confirmed_at`. Restrict the dev owner bypass to loopback plus an explicit flag. Turn off autoconfirm on staging, or restrict staging signups. |
| P1-2 | **The automation service token can impersonate any user.** `src/lib/admin-automation-auth.ts:48-63` takes `x-automation-user-id` from the request when the token matches, and returns that id with a service-role client. | Code read. | Verified | Use only the configured `AUTOMATION_SERVICE_USER_ID`, or bind the identity into a signed token. |
| P1-3 | **Briefing email is not idempotent, and job timeouts do not stop jobs.** `worker/jobs/briefing-job.js:204-208` sends with Resend *before* recording anything. A crash afterwards causes a resend the next day, as the comment at `:212-214` accepts. `worker/index.js:350-358` races `fn()` against a timer, marks the job idle on timeout, and leaves `fn()` running, so the next tick can overlap it. | Code read. The cited reviewer also found no timeout or idempotency key on the Resend `fetch` (`worker/briefing/send-briefing.js:17-34`). | Verified / Cited | Claim a unique `(user_id, local_date)` send row before sending. Pass a Resend `Idempotency-Key`. Thread an `AbortSignal` through jobs and keep the job marked running until `fn()` actually settles. Use DB leases for every job that has external effects. |
| P1-4 | **Errors read as "no data" across the data layer.** `dashboard/page.tsx:207-224` ignores the `.single()` error and redirects to `/onboarding` on `null`. That was the cause of today's redirect loop. The pattern is widespread: 450 `catch` sites in 282 files, 97 that only `console.*`. | Today's incident (P0-3), plus the reviewer counts. | Verified / Cited | Add a typed query helper that separates `PGRST116` (no row) from schema, permission and network errors, and makes those throw to an error boundary and Sentry. Fix the dashboard first. |
| P1-5 | **Worker SSRF filter checks hostname strings only.** `worker/scanner/fetch-page.js:47-60` blocks a few literal patterns. It does not resolve DNS, does not cover `0.0.0.0`, most of `169.254/16`, IPv6 ULA/link-local or decimal/octal IPv4, and follows redirects (`:145`). | Code read. | Verified | Use one SSRF-safe fetcher that resolves every hop, rejects private, reserved and link-local v4/v6 addresses, caps redirects and size, and pins the connection to the vetted IP. Use it for every fetch of a user-supplied URL, in web and worker. |
| P1-6 | **Deploy gates are shorter than deploys, and production staleness is invisible.** `post-deploy.yml` and `release-completion-gate.yml` time out about 15 minutes after the `production` push, and today's Railway builds took about 26 minutes. CI "Wait for deployment" behaves the same way. The deployment watchdog checks that production serves the `production` branch, not that it is current with `main`, and production was once 46 days stale. | Gates `39840174606` and `39840174622` timed out at 19:42:33Z and 19:42:38Z; production went live at 19:44:30Z (evidence file). | Verified | Trigger on Railway `deployment_status`, or poll the Railway deployment API with a 45-minute bound that separates pending from failed. Alert when production is more than N commits or days behind `main`. |
| P1-7 | **Authenticated E2E skipped silently for weeks.** Specs `test.skip` when the session is missing. When auth setup failed, CI went amber or green while testing no logged-in flow. | Run `39783672540`: setup failed and every authenticated test skipped. Today's first real run found 23 failures. | Verified | In CI, make auth setup a hard failure, and fail the job if more than X% of authenticated specs skip. |
| P1-8 | **An account-wide Supabase management token sits in GitHub secrets.** `SUPABASE_ACCESS_TOKEN` drives `api.supabase.com/v1/projects/.../database/query` in `apply-*-migrations.yml`. The organization `vmxtvckxrwmaqmupbrca` also contains `mandatesignal` and `mandatesignal-staging`, so a leaked workflow token reaches another product's databases. | `supabase projects list` shows all four projects in one org. Workflow read. | Verified (org scope); token scope inferred | Run migrations in a GitHub environment with required reviewers, use a project-scoped credential (DB URL per project) instead of an account token, and keep MandateSignal in a separate org or token. |
| P1-9 | **Rate limits live in process memory.** `src/lib/rate-limit.ts:3` and `src/lib/burst-limit.ts:8` use `new Map`, so counters reset on every deploy and are per replica. They protect login, signup and the paid LLM endpoints. | Code read. | Verified | Move to a shared store (Postgres function or Redis) keyed by IP, user and email. |
| P1-10 | **No tested backup or restore.** No PITR retention, restore drill, RPO or RTO, or restore runbook was found in `docs/`. | Reviewer search of `docs/sre`, `docs/operations`. | Cited | Record PITR settings for both projects, set RPO and RTO, run and document a restore to a scratch project each quarter. |

## P2: schedule

| # | Finding | Status | Fix |
| --- | --- | --- | --- |
| P2-1 | Five tables (`regulatory_events`, `board_changes`, `insider_sales`, `activist_filings`, `reference_companies`) have no `enable row level security` in any migration. In production and staging, anon PostgREST returns `200` with `Content-Range: */0` even though `077` seeds 1,791 `reference_companies` rows. So RLS (or an equivalent) was applied outside the migrations, and a database rebuilt from the repo would expose them. | Verified (probe), with medium confidence on the cause | Add the RLS and revoke statements to a migration, and add a CI invariant that every `public` table has RLS. |
| P2-2 | 28 `using (true)` / `with check (true)` policies, including feedback tables (`087`, `088`) and `039_b2b_tables.sql:46`. | Cited | Inventory each one. Keep only for public reference data; scope everything else to `auth.uid()` or org. |
| P2-3 | `pr-autofix.yml` runs on `pull_request_target` with `contents: write`, checks out the PR head and runs `npm ci` and Playwright. It refuses forks and requires a maintainer comment or the `autofix:approved` label, so the exposure is same-repo branches, including agent-authored ones. | Verified | Run untrusted install and tests in a `pull_request` job without secrets. Let the privileged job only download artifacts and push. |
| P2-4 | LLM spend is monitored after the fact (`worker/jobs/usage-monitor-job.js`), with no per-user or global budget enforced before calls. Scraped content goes into prompts without an untrusted-data boundary (`worker/briefing/generate-briefing.js:142-172`, `api/(intelligence)/discover/route.ts:363`). | Cited | Reserve budget before each call and fail closed. Delimit untrusted content and validate structured output. |
| P2-5 | PII in logs: the worker logs `sent to ${user.email}` (`briefing-job.js:257`) and stores `to: user.email` in `user_events` (`:245`). | Verified | Log user ids only. Drop the email from event properties. |
| P2-6 | Worker image `node:22-alpine` is unpinned and runs as root (`worker/Dockerfile`). The robots check fails open on network error (`worker/scanner/robots-check.js:16-18`). There is no per-host rate limit for direct fetches. | Cited | Pin by digest, add `USER node`, fail closed on robots, add a per-host token bucket. |
| P2-7 | Synthetic production accounts (`PROD_PLAYWRIGHT_TEST_EMAIL`) run every deploy and schedule, and may count in PostHog and KPI metrics. | Cited (medium) | Flag synthetic users (`users.is_synthetic` exists; see 185) and exclude them everywhere. |
| P2-8 | Sentry traces sample 0% outside the selected P0 routes (`sentry.server.config.ts:33-55`). Alerts are defined only in Sentry and PostHog UIs (`docs/alerting.md`). | Cited | Keep a 1â€“5% baseline. Version alert definitions. |
| P2-9 | Unbounded dashboard reads (`dashboard/page.tsx:261-322`). An N+1 loop on the team settings page (`settings/team/page.tsx:99-101`) runs three queries per seat. | Cited | Use aggregate RPCs, limits and pagination. |
| P2-10 | The service-role factory `src/lib/supabase/admin.ts` lacks `import 'server-only'`. | Verified | Add the guard, plus a lint rule against admin-client use in route files that have no auth helper. |
| P2-11 | Toolchain drift: `engines` says Node `22.x`, local runs are 24 (`EBADENGINE` warnings today), there is no `.nvmrc`, and the worker `package.json` has no `engines`. | Verified | Pin with `.nvmrc` or Volta and run CI on exactly 22.x. |
| P2-12 | Third-party actions are pinned by tag (`dorny/paths-filter@v3`, `slackapi/slack-github-action@v1.24.0`). Workflow `permissions:` are inconsistent across 83 files. | Cited | Pin by SHA with Dependabot, and set a repo default of `contents: read`. |
| P2-13 | Hand-written row types next to generated `database.types.ts` (e.g. `profileRaw as ProfileRow`) hid today's schema drift from the compiler. | Verified (dashboard) | Derive types from `Database['public']['Tables']`. |
| P2-14 | `role="alert"` is hard-coded in `components/ui/alert.tsx` and used for non-urgent guidance, such as the company detail "Two things move this forward" banner, so screen readers interrupt for routine tips. | Verified | Default to `role="status"` and opt in to `alert`. |

## P3: hygiene

- God components: `prep-client.tsx` (1,811 lines, client), `client-data-view.tsx` (1,208), `briefing/page.tsx` (1,168), `outreach-hub-client.tsx` (1,104). Split data, domain hooks and presentation.
- Sprawl: 269 npm scripts (56 `guard`/`check`), 269 files in `scripts/`, 83 workflows of which 62 are scheduled, and one zombie run (`31314439296`, Manager Tools Launch Monitoring, `in_progress` since 2026-08-09). Consolidate, give each an owner, and add `timeout-minutes` everywhere.
- The process-local briefing cache (`briefing/page.tsx:75-92`) is lost on every deploy.
- Dead exports listed in `docs/evidence/onboarding-three-steps-2026-10-21.md`.
- Only 28 `error.tsx` boundaries for 271 pages.
- `waitForTimeout` sleeps in E2E specs; shared mutable test accounts.

## What is done well

- Strict nonce-based CSP with `object-src 'none'`, plus HSTS, COOP and CORP (`src/proxy.ts:27-47`, `next.config.ts:30-42`).
- Stripe, Slack and Resend webhooks verify signatures on the raw body.
- Every coach client route calls `verifyCoachAccess` before scoped queries.
- The auth callback rejects non-path and `//` redirects. Signup and login are rate-limited with captcha (subject to P1-9).
- `scripts/promote-to-production.mjs` refuses commits not on `main` and requires a successful staging deploy of the exact SHA.
- The worker has Sentry check-ins, timeout alerts and a Postgres advisory lock for briefings.

## Corrections to reviewer output

- "`/api/auth/verify-and-signin` has no rate limit" was **dropped**: the route calls the guard with `rateLimitKey: 'login'` (`route.ts:17`).
- "Five tables lack RLS (P0)" was **downgraded** to P2-1: neither live environment exposes rows to anon.
- "Main CI does not block merges" was **confirmed and sharpened** with the actual protection settings (P0-4).

## Suggested order

1. **This week:** P0-2 (a parser fix of a few lines), P0-1 (honest copy now, then the feature), P0-4 (settings change), P1-2 and P1-1 (small code changes).
2. **Next two weeks:** P0-3 (migration pipeline and parity check), P1-3, P1-6, P1-9, P1-8.
3. **Then:** P1-4 helper rollout, P1-5 fetcher, P1-10 restore drill, the P2 list.
