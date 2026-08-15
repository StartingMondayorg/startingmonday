# Technical Reference — Starting Monday

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: monthly
Source of truth: yes

### Version 1.0 — May 2026

This document is the authoritative technical reference for the Starting Monday platform as deployed. It covers architecture, infrastructure, security, observability, test harness, deployment, and operational runbooks. It reflects the actual running system — not plans.

---

## 1. System Architecture

### Overview

Starting Monday is a two-service architecture deployed on Railway:

1. **Web application** — Next.js 16 App Router, serves all user-facing routes and API endpoints
2. **Worker service** — Node.js (ESM), runs all background jobs on cron schedules

Both services share a single Supabase PostgreSQL database with Row Level Security enforced at the database layer.

```
┌─────────────────────────────────────────────────────────────┐
│                      USERS (Browser)                        │
│              startingmonday.app / /optimize                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 16 WEB APP (Railway)                   │
│                                                             │
│  App Router:                                                │
│  /dashboard/*        — authenticated user dashboard         │
│  /optimize           — public LinkedIn Optimizer (no auth)  │
│  /onboarding         — first-run setup flow                 │
│  /api/*              — server-side API routes               │
│  /auth/*             — Supabase auth callbacks              │
│                                                             │
│  Key API routes:                                            │
│  POST /api/chat           AI advisor (streaming SSE)        │
│  POST /api/briefs/[id]    Prep brief (streaming)            │
│  POST /api/strategy       Search strategy (streaming)       │
│  POST /api/tailor         Resume tailoring                  │
│  POST /api/outreach       Outreach draft                    │
│  POST /api/optimize       LinkedIn optimizer                │
│  POST /api/profile        Profile save                      │
│  POST /webhooks/stripe    Stripe event handler              │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
┌─────────────────┐  ┌────────────┐  ┌──────────────┐
│  SUPABASE DB    │  │ CLAUDE API │  │    STRIPE     │
│  PostgreSQL     │  │ Anthropic  │  │  Billing +    │
│  + Auth + RLS   │  │ Haiku/     │  │  Webhooks     │
│                 │  │ Sonnet     │  └──────────────┘
│  25 migrations  │  └────────────┘
│  applied        │
└─────────────────┘
              ▲
              │
┌─────────────────────────────────────────────────────────────┐
│              WORKER SERVICE (Railway, separate)             │
│                                                             │
│  index.js — cron scheduler + HTTP health server             │
│                                                             │
│  Cron jobs (all times UTC):                                 │
│  */5 * * * *       briefing-job      (every 5 min)          │
│  0 8 * * 1,3,5     scan-job          (Mon/Wed/Fri 08:00)    │
│  30 8 * * 1,3,5    signal-job        (Mon/Wed/Fri 08:30)    │
│  0 6 * * *         followup-job      (daily 06:00)          │
│  0 23 * * 0        momentum-job      (Sunday 23:00)         │
│  30 23 * * 0       weekly-report-job (Sunday 23:30)         │
│  0 9 * * *         usage-monitor-job (daily 09:00)          │
│  0 10 * * *        trial-reminder-job(daily 10:00)          │
│  30 10 * * *       activation-reminder-job (daily 10:30)    │
│  0 11 * * *        offer-email-job   (daily 11:00)          │
│  30 11 * * *       reactivation-job  (daily 11:30)          │
│  0 2 * * 0         cleanup-job       (Sunday 02:00)         │
│                                                             │
│  Health endpoint: GET /health → JSON status + job state     │
│  Scan trigger: POST /trigger-scan → async immediate scan    │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                          │
│  Browserless.io  — headless Chrome for career page scanning │
│  Resend          — transactional email delivery             │
│  Sentry          — error tracking (both services)           │
│  PostHog         — product analytics (web app only)         │
│  UptimeRobot     — worker health endpoint monitoring        │
└─────────────────────────────────────────────────────────────┘
```

### Repository structure

```
startingmonday/
├── src/
│   ├── app/                      Next.js App Router pages
│   │   ├── (auth)/               login, signup (no layout wrapper)
│   │   ├── (dashboard)/          authenticated dashboard pages
│   │   │   └── dashboard/
│   │   │       ├── admin/        staff-only admin dashboard
│   │   │       ├── briefing/     daily briefing page (streaming)
│   │   │       ├── calendar/     follow-up calendar
│   │   │       ├── chat/         AI advisor chat
│   │   │       ├── companies/    pipeline + company detail
│   │   │       ├── contacts/     contact tracker
│   │   │       ├── profile/      user profile settings
│   │   │       ├── start/        activation checklist
│   │   │       └── strategy/     search strategy brief
│   │   ├── api/                  API route handlers
│   │   ├── auth/                 OAuth callback
│   │   ├── onboarding/           first-run flow
│   │   └── optimize/             public LinkedIn Optimizer
│   ├── components/               shared React components
│   └── lib/                      shared utilities
│       ├── supabase/             client + server Supabase clients
│       ├── activation.ts         six-actions completion logic
│       ├── prompts.ts            system prompts + anti-AI-copy guardrails
│       └── schemas.ts            Zod validation schemas
├── worker/
│   ├── index.js                  cron scheduler + health server
│   ├── briefing/                 briefing assembly + generation + delivery
│   ├── jobs/                     all cron job implementations
│   ├── lib/                      shared worker utilities
│   ├── scanner/                  Browserless career page scanner
│   └── signals/                  company intelligence signal classifier
├── supabase/
│   └── migrations/               28 applied migrations (numbered 001–028)
├── tests/
│   └── e2e/                      Playwright end-to-end tests
│       ├── global-setup.ts       auth setup
│       ├── smoke.spec.ts         core user flows
│       └── critical-paths.spec.ts auth + access control
└── playwright.config.ts
```

---

## 2. Infrastructure

### Railway (hosting)

Two separate Railway services in one project:

| Service | Runtime | Build | Port |
|---|---|---|---|
| Web (startingmonday) | Node 22 | `next build` | 8080 (Railway proxied) |
| Worker | Node 22 (ESM) | none (JS, no build step) | 3010 (health only) |

Auto-deploy: both services deploy on push to `main` branch of the GitHub repository. Railway watches the repo and triggers a build/restart on every commit.

The web service's `railway.toml` handles the proxy configuration required because Railway proxies requests through an internal address — `request.url` inside the app uses `localhost:8080`, not `startingmonday.app`. All redirect URLs use `x-forwarded-host` and `x-forwarded-proto` headers to construct the correct public URL.

**Important known issue:** A file named `proxy.ts` anywhere in `src/` causes a build conflict with Railway's internal proxy handling. Do not create files with that name.

### Supabase

- **Database:** PostgreSQL, hosted in Supabase's US East region
- **Auth:** Supabase Auth with JWT, email/password and Google OAuth
- **Storage:** Not currently used (resumes are stored as text in `user_profiles.resume_text`)
- **Project:** `mytnhoxcgvnzxhgcumkf.supabase.co`
- **Migrations:** 28 applied, numbered 001–028 in `supabase/migrations/`

Two Supabase clients:
- `src/lib/supabase/client.ts` — browser client (used in client components)
- `src/lib/supabase/server.ts` — server client with cookie-based session (used in server components and API routes)

The worker uses a service role client (`worker/lib/supabase.js`) that bypasses RLS — necessary for cross-user operations like the briefing job. This client must never be exposed to user-controlled inputs.

### Browserless.io

Headless Chrome service for career page scanning. The scanner (`worker/scanner/scan-company.js`) navigates to a company's career page URL, extracts job listings, and runs them through Claude for relevance scoring.

- API key stored as `BROWSERLESS_API_KEY` environment variable
- Sessions are isolated per scan request
- Scan failures (blocked by Cloudflare, timeout, zero results) are logged and the company record is updated with `last_scan_error`

### Resend

Transactional email delivery for:
- Daily briefings
- Weekly progress reports
- Trial reminders (T-3 and T-0)
- Activation reminders (day-3, day-7)
- Offer acceptance email
- Annual reactivation email

Sending domain: verified via DKIM/SPF DNS records. Sender identity: `briefing@startingmonday.app` (briefings) and `hello@startingmonday.app` (notifications).

### Stripe

Subscription billing. Public pricing ladder: Intelligence ($49/month), Search ($199/month), and Executive ($499/month). Internal subscription keys still use legacy tier identifiers in code. Concierge and coach offers are separately packaged.

Stripe webhook endpoint: `POST /api/webhooks/stripe`. Handles:
- `checkout.session.completed` — activates subscription
- `customer.subscription.updated` — plan changes
- `customer.subscription.deleted` — cancellation
- `invoice.payment_failed` — dunning state

Webhook signature verified via `STRIPE_WEBHOOK_SECRET` on every request.

---

## 3. Database Schema

### Core tables

| Table | Purpose |
|---|---|
| `users` | Auth identity, email, `subscription_status`, `trial_ends_at`, `plan_at_trial_end` |
| `user_profiles` | All user profile data — resume, target titles, briefing settings, persona, momentum score |
| `companies` | Pipeline companies per user — name, stage, career page URL, fit score, archived state |
| `scan_results` | Per-company scan outcomes — AI score, summary, raw hits, status |
| `company_signals` | Triggering event intelligence — signal type, summary, outreach angle, notified state |
| `follow_ups` | Follow-up reminders — due date, action, contact link, status (pending/done/snoozed) |
| `contacts` | Contact tracker — name, title, company, channel, notes |
| `conversations` | AI chat message history — role, content, tool calls, per user |
| `briefs` | Saved prep brief state — raw sections, generation timestamp |
| `signal_action_events` | Tracks which signals led to downstream action (outreach, stage update) |
| `brief_quality_log` | Context richness metrics logged at brief generation time |
| `user_events` | Server-side behavior log — event type, metadata, timestamp |
| `momentum_scores` | Weekly momentum score history — `week_of` date, score, component breakdown |
| `staff_members` | Internal admin access — email addresses of staff who can access /admin |
| `testimonials` | Offer completion feedback — collected when `offer_accepted_at` is set |

### Row Level Security

Every table has RLS enabled. The pattern:

```sql
create policy "users_own" on public.companies
  for all using (auth.uid() = user_id);
```

All user-facing queries are automatically scoped to the authenticated user's `auth.uid()`. No application-level user ID filtering is required — but it is added as a defense-in-depth measure in all Supabase queries (`.eq('user_id', user.id)`).

The worker service uses a service role key that bypasses RLS. The service role key is stored as `SUPABASE_SERVICE_ROLE_KEY` and is never sent to the browser.

### Migration convention

All schema changes are applied as numbered migration files in `supabase/migrations/`. Applied manually via the Supabase SQL editor. Migration files are version-controlled and serve as the schema source of truth.

Current migration count: 028.

---

## 4. Security

### Authentication

- Supabase Auth with JWT. Sessions stored in `HttpOnly` cookies via the Supabase SSR package.
- Email/password and Google OAuth (mobile-friendly, server-side callback through `/auth/callback`).
- All authenticated routes use `supabase.auth.getUser()` at the top of each server component or API route — no cached session state assumed.
- Unauthenticated requests to `/dashboard/*` are redirected to `/login`.
- Admin routes (`/dashboard/admin`) check `staff_members` table in addition to auth.

### API key management

All secrets are stored as Railway environment variables. Never in source code, `.env.local` files committed to git, or client-side code.

| Secret | Used by |
|---|---|
| `ANTHROPIC_API_KEY` | Web app (chat, briefs, outreach), Worker (briefing, signals, weekly report) |
| `NEXT_PUBLIC_SUPABASE_URL` | Web app (public — URL only, not a secret) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web app (public — enforces RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker only — bypasses RLS |
| `BROWSERLESS_API_KEY` | Worker scanner only |
| `STRIPE_SECRET_KEY` | Web app API routes only |
| `STRIPE_WEBHOOK_SECRET` | Web app webhook handler only |
| `RESEND_API_KEY` | Worker email jobs only |
| `WORKER_SECRET` | Web app → Worker internal HTTP auth |
| `SENTRY_DSN` | Both services |
| `POSTHOG_KEY` | Web app only |
| `PLAYWRIGHT_TEST_EMAIL` | E2E test runner only — not in production |
| `PLAYWRIGHT_TEST_PASSWORD` | E2E test runner only — not in production |

### WORKER_SECRET

The Next.js app triggers immediate company scans by calling `POST /worker-url/trigger-scan` with the `x-worker-secret` header. This prevents anyone from triggering arbitrary scans by calling the worker directly. The worker validates this header on every `/trigger-scan` request.

### Input validation

- All form submissions validated with Zod schemas (`src/lib/schemas.ts`) before database writes
- Resume text capped at 100,000 characters before acceptance
- SQL injection: not possible via Supabase client library (parameterized queries)
- XSS: Next.js escapes JSX output by default; no `dangerouslySetInnerHTML` in user-controlled content
- API routes that accept user input validate shape and size before passing to Claude

### Data handling

- Resume text stored as plaintext in `user_profiles.resume_text` — encrypted at rest by Supabase (AES-256)
- No PII sent to Claude beyond what is necessary for the specific prompt
- No user data used for AI model training (Anthropic API policy for direct API customers)
- Conversation history stored in `conversations` table; cleaned up after 180 days of inactivity by the Sunday cleanup job

### Web scraping posture

- Only publicly accessible career pages are scanned (no login required)
- Rate limit: one scan per company per scan window (Mon/Wed/Fri), plus one immediate scan on company add
- `robots.txt` is not currently enforced — this is a known gap to address before scale
- Cloudflare and Imperva blocks are detected (HTTP 403, challenge page detection) and logged as scan failures

---

## 5. Observability

### Sentry (error tracking)

Configured in both the web app and the worker. DSN stored as `SENTRY_DSN` environment variable.

**Web app:** Errors captured via `@sentry/nextjs`. Client-side and server-side errors both reported. Source maps uploaded on build.

**Worker:** Initialized at startup via `@sentry/node`. Unhandled exceptions and unhandled rejections both captured via `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers in `worker/index.js`. Each job wrapped in a try/catch that reports to Sentry with a `tags.job` label for filtering.

**Alerts:** Configured in Sentry dashboard for new error types and spike detection.

### UptimeRobot (uptime monitoring)

Monitors the worker's health endpoint every 5 minutes: `GET /health`. Response is JSON with:
```json
{
  "status": "ok",
  "uptime": 86400,
  "jobs": { "briefing-job": "idle", "scan-job": "idle" },
  "ts": "2026-05-06T14:00:00.000Z"
}
```

Alert: email to `rothschild@gmail.com` if health check fails for 2 consecutive checks (10-minute outage threshold).

### PostHog (product analytics)

Configured in the web app. Tracks:
- Page views (automatic)
- Signup, onboarding completion, trial start, subscription start (custom events)
- Feature usage: chat session, brief generation, outreach draft, company add, scan match click

Used for: activation funnel analysis, feature adoption, cohort retention.

### Structured logging (worker)

The worker uses a structured logger (`worker/lib/logger.js`) that outputs JSON to stdout. Railway captures stdout and makes it searchable in the Railway dashboard.

Log format:
```json
{ "level": "info", "message": "briefing-job: sent to user@email.com", "ts": "2026-05-06T14:01:00.000Z" }
```

Key log patterns to search in Railway:
- `briefing-job: skip` — see why each user was skipped
- `briefing-job: sent` — confirm delivery
- `scan-job: complete` — scan job summary
- `signal-job: classified` — signal classification results
- `trigger-scan: received` — immediate scan trigger

### Usage monitoring

`runUsageMonitorJob` runs daily at 09:00 UTC. Queries a `usage_tracking` table that records API call counts by service (Anthropic, Resend, Browserless) and date. Alerts if any service is on track to exceed monthly budget thresholds.

---

## 6. Test Harness

### TypeScript type checking

```bash
cd startingmonday && npx tsc --noEmit
```

Run as the first step in the pre-commit hook. Fails the commit if there are type errors.

### Pre-commit hooks

Configured via a shell hook in `.git/hooks/pre-commit` (or equivalent). Two checks run on every commit:

1. `tsc --noEmit` — TypeScript type check across the entire project
2. Em dash check — scans source files for `—` (U+2014 em dash) which causes build failures in the Railway environment. All em dashes must be replaced with hyphens or reworded.

Both checks must pass before a commit is created. Bypass is not permitted (`--no-verify` is not used).

### Playwright end-to-end tests

Location: `tests/e2e/`

**Setup:** `global-setup.ts` authenticates as the test user (`PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD`) and saves the session state to `tests/e2e/.auth/user.json`.

**Test files:**

| File | Coverage |
|---|---|
| `smoke.spec.ts` | Dashboard loads, add company, add contact, profile save (with restore), prep brief generates |
| `critical-paths.spec.ts` | Unauthenticated redirects, admin access control |

**Key design decisions:**
- All E2E tests run against a live environment (not mocked)
- The profile save test reads the original `positioning_summary` before writing a test value, then restores it afterward — prevents permanent data corruption in the test account's production row
- Unauthenticated contexts use `browser.newContext({ storageState: { cookies: [], origins: [] } })` — explicit empty storage to prevent cookie contamination from other test contexts
- Company submit redirect uses a regex match (`/\/dashboard/`) because the action redirects to either `/dashboard` or `/dashboard/companies/{id}?scanning=1` depending on server state

**Running tests:**
```bash
npx playwright test                    # run all tests
npx playwright test smoke              # smoke tests only
npx playwright test --debug            # interactive debug mode
```

**Test account:** `017c36a5-6578-49ba-8544-b64b46a000d5` — dedicated test row in `user_profiles`. `briefing_time` is null to prevent the test account from receiving real briefings.

---

## 7. Deployment Pipeline

### Trigger

Push to `main` branch on GitHub → Railway detects the push → builds and deploys both services.

### Web app build

```bash
next build
```

Railway runs this automatically. Build time: ~45–90 seconds. Zero-downtime deploy via Railway's rolling restart.

### Worker deploy

No build step. Railway restarts the Node process with the new code. The worker registers all cron schedules at startup; in-flight jobs complete before restart if Railway sends SIGTERM (5-second graceful shutdown window).

### Environment promotion

There is no staging environment. All changes deploy to production. Mitigation:
- TypeScript check and E2E tests must pass before merging
- Feature changes are tested locally against a local Supabase instance when possible
- Worker job changes are tested by reading logs in Railway after deploy

### Rollback

Railway supports one-click rollback to the previous deployment in the Railway dashboard. Use this if a deploy breaks the health check or causes errors visible in Sentry within the first 10 minutes.

---

## 8. Worker Jobs — Operational Notes

### briefing-job (every 5 minutes)

Uses a Postgres advisory lock (`try_advisory_lock` / `advisory_unlock`) to prevent concurrent runs. Fetches all `trialing` and `active` users with `briefing_time` set. For each user: checks day name (full name — "Monday" not "Mon"), checks current time within ±10 minutes of `briefing_time` in the user's timezone, checks `last_briefing_sent_at` not already today.

**Debugging missed briefings:** Search Railway worker logs for `briefing-job: skip {email}`. The log includes the specific skip reason (no profile, day mismatch, outside window, already sent today, no companies).

**Known issue (resolved):** `briefing_days` was stored as abbreviated names (`["Mon","Tue",...]`) for users who set days before migration 026. Migration 026 normalizes existing rows. The job also normalizes at runtime via `ABBR_TO_FULL` map as belt-and-suspenders.

### scan-job (Mon/Wed/Fri 08:00 UTC)

Fetches all active companies with a `career_page_url`. Calls `scanCompany()` for each. Rate limited to avoid overwhelming any single site. Scan results written to `scan_results` table with `ai_score` and `raw_hits`.

### signal-job (Mon/Wed/Fri 08:30 UTC)

Runs after the scan job. Fetches unprocessed signals from the signals pipeline. Classifies each signal type (funding, exec hire, exec departure, acquisition, expansion, layoff) using Claude. Writes classified signals to `company_signals` table.

### momentum-job (Sunday 23:00 UTC)

Computes a 0–100 momentum score per user based on: active pipeline count, companies added in 30 days, pipeline updated in 7 days, follow-ups completed in 30 days, and average scan score. Writes to both `user_profiles.momentum_score` and `momentum_scores` history table (with `week_of` = Sunday's date).

### weekly-report-job (Sunday 23:30 UTC)

Runs after momentum-job. Sends a pipeline snapshot email to all `trialing` and `active` users who have completed onboarding. Includes: pipeline breakdown, scan highlights (matches from the past 7 days), momentum score with week-over-week delta, and 3 Claude Haiku-generated suggested actions. Suppresses Claude call for users where `shouldSuppressNudge()` returns true.

### cleanup-job (Sunday 02:00 UTC)

Deletes `company_signals` older than 90 days and `conversations` with no activity in 180 days.

---

## 9. AI Model Usage

| Feature | Model | Why |
|---|---|---|
| AI chat advisor | Claude Sonnet | Full tool use, persistent context, quality matters |
| Daily briefing generation | Claude Haiku | High frequency (per user per day), cost-sensitive |
| Prep brief (full) | Claude Sonnet | Quality matters; user-facing premium feature |
| Search strategy brief | Claude Opus | Highest-stakes output; long-form strategic analysis |
| Outreach drafting | Claude Sonnet | Quality matters; user sends the output |
| Resume tailoring | Claude Sonnet | Quality matters; ATS stakes |
| Signal classification | Claude Haiku | Batch operation; cost-sensitive |
| Weekly email suggestions | Claude Haiku | Per-user weekly batch; cost-sensitive |
| LinkedIn Optimizer | Claude Haiku | Public, unauthenticated; high volume potential |

Model IDs are configured via environment variables (`ANTHROPIC_CHAT_MODEL`, `ANTHROPIC_HAIKU_MODEL`) to allow hot-swap without code changes.

### Anti-AI-copy guardrails

`src/lib/prompts.ts` contains a banned phrases list injected into every system prompt. Phrases that make AI output sound generic or corporate are explicitly prohibited in the prompt instruction. The list includes: "I hope this finds you well," "leverage your network," "it's important to," "touch base," "reach out," "streamline," "optimize your," and approximately 40 additional phrases.

---

## 10. Operational Runbooks

### The daily briefing isn't sending

1. Check Railway worker logs: search for `briefing-job: skip` for the affected user's email
2. The log will show the specific reason: no profile/briefing_time, day mismatch, outside window, already sent today, no companies
3. If "day mismatch": check `user_profiles.briefing_days` in Supabase — run migration 026 if abbreviated names are present
4. If "outside window": the cron ran but the user's local time was >10 minutes from their `briefing_time`. Check if the window was recently missed; next fire will catch the next scheduled day.
5. If "no companies": user has no companies in their pipeline. The briefing cannot send until at least one company is added.

### A scan is always failing for a company

1. Check `scan_results` for the company: `select * from scan_results where company_id = '...' order by scanned_at desc limit 5`
2. Look at `status` and `ai_score`. If status is `error`, look at the error message
3. Common causes: Cloudflare blocking (403), career page moved (404), site requires JavaScript that Browserless can't execute
4. Fix: update the `career_page_url` on the company to the correct direct URL, or flag the company as unscannable and notify the user

### Railway deploy broke something

1. Check Sentry for new errors introduced after the deploy
2. Check Railway logs for both services (web + worker) for startup errors
3. If critical: go to Railway dashboard → the affected service → Deployments → click the previous deployment → "Redeploy"

### The worker health check is failing

1. Go to UptimeRobot — check the alert details and when the failure started
2. Go to Railway → Worker service → check if the service is running (green status)
3. If service crashed: check Railway logs for the crash reason (uncaught exception, OOM, etc.)
4. If OOM: check if a large scan job caused memory spike; consider reducing batch size in scan-job
5. Railway will restart crashed services automatically; if it's in a crash loop, check the logs for the root cause before it restarts again

### Adding a new environment variable

1. Add to Railway dashboard: the affected service → Variables → add key/value
2. Trigger a redeploy (Railway does not auto-deploy on variable change)
3. Add the variable name (not value) to `.env.example` in the repo for documentation
4. If the web app needs it client-side: prefix with `NEXT_PUBLIC_` (it will be embedded in the bundle — do not use for secrets)

---

*Document owner: Richard Rothschild*
*Last updated: May 2026*
*Companion documents: product-requirements.md, product-architecture.md, dev-plan.md, business-plan.md*
