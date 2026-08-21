# Epic: SRE Council Backlog

Issues surfaced by the Software & SRE Synthetic Council review. Grouped into sprints by risk and coupling. The three required changes and the one "stop doing" were shipped in commit ef2cd92 and are not listed here.

## Execution Status (2026-06-03)

### Sprint E1 — Observability Foundation
- E1.1: complete. `streamErrorMessage` call sites pass feature/user context in AI routes.
- E1.2: complete. `recordTraceError` is implemented and invoked on AI-route error paths.
- E1.3: complete. Worker logging is structured via `worker/lib/logger.js` and top-volume jobs now emit structured events.

### Sprint E2 — Test Coverage Floor
- E2.1: complete. Utility tests exist in `src/lib/__tests__/stream-error.test.ts` and `src/lib/__tests__/trace.test.ts`.
- E2.2: complete. Conversation cap coverage exists in `src/app/api/conversation/__tests__/route.test.ts`.
- E2.3: complete. Chat retry E2E exists in `tests/e2e/chat-retry.spec.ts` and is executed in CI.

### Sprint E3 — Reliability Hardening
- E3.1: complete. Worker jobs execute through timeout-bounded `runJob` in `worker/index.js` with `job_timeout` logging.
- E3.2: complete. Scan dead-letter persistence added via `supabase/migrations/126_scan_failures_dead_letter.sql` and `worker/lib/scan-dead-letter.js`, wired into scan jobs.
- E3.3: complete. Playwright suites are first-class CI gates in `.github/workflows/ci.yml`.

### Sprint E4 — Production Safety
- E4.1: complete. Staging flow is active via `staging` branch CI coverage and `.github/workflows/sync-staging.yml`.
- E4.2: complete. `llm_traces.success` migration is present in `supabase/migrations/074_llm_traces_add_success.sql` and writes are in `src/lib/trace.ts`.
- E4.3: complete. Chat per-user rate limiting with 429 + `Retry-After` is in `src/app/api/chat/route.ts` and validated by tests in `src/lib/rate-limit.test.ts` and `src/app/api/chat/route.test.ts`.

---

## Sprint E1 — Observability Foundation

**Goal:** Every AI call and every background job is traceable in Railway logs within 48 hours of an incident.

### E1.1 — Pass feature/userId context into streamErrorMessage at every call site
- `streamErrorMessage` now accepts an optional `{ feature, userId }` context
- All 13+ call sites in `src/app/api/` still pass only `err`
- Update each route to pass the relevant context so Railway logs include feature + user on errors

**Files:** `src/app/api/discover/route.ts`, `src/app/api/prep/[id]/outreach/route.ts`, `src/app/api/prep/[id]/route.ts`, `src/app/api/salary-intelligence/route.ts`, `src/app/api/suggestions/route.ts`, and remaining API routes that call `streamErrorMessage`

### E1.2 — Add recordTrace to error paths in every AI route
- `recordTrace` is called on success in 6 routes but not on failure
- Add a `recordTraceError` export to `trace.ts` (success: false, no DB write, stdout only)
- Call it in each route's catch block that currently only enqueues `streamErrorMessage`

**Files:** `src/lib/trace.ts`, all API routes calling `streamErrorMessage`

### E1.3 — Add worker-side structured logging
- Worker jobs (`scan-job.js`, `executive-scan-job.js`, digest jobs, etc.) use `console.log` ad-hoc
- Add a `log(event, data)` helper to `worker/lib/logger.js` that emits `JSON.stringify({ ts, event, ...data })`
- Replace free-form console calls in the top 5 highest-volume jobs

**Files:** `worker/jobs/scan-job.js`, `worker/jobs/executive-scan-job.js`, `worker/index.js`

---

## Sprint E2 — Test Coverage Floor

**Goal:** CI catches regressions in the three most critical flows before they reach Railway.

### E2.1 — Vitest unit tests for streamErrorMessage and recordTrace
- Currently zero tests for these two shared utilities
- Add `src/lib/__tests__/stream-error.test.ts` and `src/lib/__tests__/trace.test.ts`
- Assert sentinel format, console.error called, console.log emitted with correct fields

### E2.2 — Vitest unit tests for the conversation 200-message cap
- `src/app/api/conversation/route.ts` enforces the cap but has no test
- Add `src/app/api/conversation/__tests__/route.test.ts`
- Test: PUT with 201 messages → 400; PUT with 200 → success path

### E2.3 — Playwright E2E test for chat error recovery
- Chat retry banner was added in E0 but has no automated test
- Add `e2e/chat-retry.spec.ts`: mock `/api/chat` to return `__ERROR__message`, assert banner appears, assert input is restored, assert "Try again" re-sends

---

## Sprint E3 — Reliability Hardening

**Goal:** The three highest-blast-radius worker jobs are idempotent and bounded.

### E3.1 — Add per-job timeout to worker cron jobs
- Worker jobs run inside `node-cron` with no per-job timeout
- A hung browserless.io call or a hung Claude stream can block the entire worker process
- Wrap the top 3 job bodies (`scan-job`, `executive-scan-job`, `weekly-digest`) in `Promise.race([jobFn(), timeout(300_000)])`
- Log `{ event: 'job_timeout', job }` on timeout

**Files:** `worker/jobs/scan-job.js`, `worker/jobs/executive-scan-job.js`, `worker/jobs/weekly-digest-job.js`

### E3.2 — Dead-letter logging for failed scan users
- When `scan-job` fails for a single user, it currently catches and logs but the user gets silently skipped
- Write failed user IDs to a `scan_failures` table (or at minimum structured log) with timestamp and error
- Allows ops visibility into which users consistently fail without manual log parsing

**Files:** `worker/jobs/scan-job.js`, new migration if adding `scan_failures` table

### E3.3 — Migrate Playwright tests to CI
- `playwright.config.ts` exists; tests run locally only (per council review)
- Add a `playwright` job to `ci.yml` that runs `npx playwright test` in headless mode
- Gate on a `PLAYWRIGHT_BASE_URL` secret pointing to a preview deployment, or use `next start` as the test server

**Files:** `.github/workflows/ci.yml`, `playwright.config.ts`

---

## Sprint E4 — Production Safety

**Goal:** Remove the remaining patterns where a single bad deploy can cause undetected data loss or silent failures.

### E4.1 — Add a staging environment on Railway
- Currently: no staging; every push to `main` auto-deploys to production
- Create a `staging` branch and a second Railway service pointed at it
- Run Playwright E2E suite against staging before merging to main

**Files:** Railway project config, `.github/workflows/ci.yml` (add staging deploy step)

### E4.2 — Add `success` field to `llm_traces` table
- `recordTrace` now logs `success: true` to stdout but the DB row has no success field
- Create migration `074_llm_traces_add_success.sql`: `ALTER TABLE llm_traces ADD COLUMN success boolean NOT NULL DEFAULT true`
- Update `recordTrace` to write `success` to the DB row

**Files:** `src/lib/trace.ts`, new migration

### E4.3 — Rate-limit `/api/chat` per user
- Chat endpoint has no per-user rate limit; a runaway client can exhaust Claude API quota
- Add an in-memory or Supabase-backed rate limit: max 20 requests per user per minute
- Return 429 with a retry-after header; the chat client already handles non-2xx as an error banner

**Files:** `src/app/api/chat/route.ts`, optionally a new `src/lib/rate-limit.ts`

---

## Priority Order

| Sprint | Risk | Effort | Ship by |
| --- | --- | --- | --- |
| E1 — Observability | High | Low | Next week |
| E2 — Test coverage | Medium | Medium | 2 weeks |
| E3 — Reliability | High | Medium | 2 weeks |
| E4 — Production safety | High | High | 4 weeks |

---

## Kill criteria

If any E1 item exceeds 3 hours of implementation time, it is a sign the routing structure needs refactoring first — stop and reassess before continuing.

If E4.1 (staging environment) is still unstarted 6 weeks after the first alpha user, stop all feature work until it ships.
