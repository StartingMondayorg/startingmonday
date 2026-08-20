# Starting Monday -- Architecture

> Written for engineers doing technical due diligence. Covers the system topology,
> data model, auth/billing, AI integration, and operational setup.

---

## System Topology

```text
Browser
  |
  +-- Next.js 16 App (Railway)          src/app/
  |     +-- Dashboard (RSC)             (dashboard)/dashboard/
  |     +-- API routes                  api/
  |     +-- Middleware                  middleware.ts
  |
  +-- Supabase                          managed Postgres + Auth + RLS
  |
  +-- Worker (Node.js cron, Railway)    worker/
  |     +-- signal-job                  company intelligence scan (Mon/Wed/Fri)
  |     +-- scan-job                    career page scan (Mon/Wed/Fri + exec daily)
  |     +-- briefing-job               daily email digest (per-user timezone)
  |     +-- followup-job               follow-up reminder emails
  |     +-- activation-reminder-job    onboarding nudges
  |     +-- (16 additional jobs)        see worker/index.js for full list
  |
  +-- External APIs
        +-- Anthropic (Claude)          AI classification, prep briefs, synthesis
        +-- Stripe                      subscription billing
        +-- Resend                      transactional email
        +-- SEC EDGAR                   8-K filing ingestion
        +-- GNews / Google News RSS     company news
        +-- Crunchbase                  funding round data
        +-- PDL (People Data Labs)      executive roster snapshots
        +-- Browserless                 career page scraping
        +-- PredictLeads                exec change signals (key not yet set)
```

---

## Data Model (key tables)

All user-facing tables have Row Level Security enabled. Service-role clients
(used by the worker and admin routes) bypass RLS.

| Table | Purpose | RLS scope |
| --- | --- | --- |
| `users` | Auth mirror + subscription state | `id = auth.uid()` |
| `user_profiles` | Career details, preferences, resume | `user_id = auth.uid()` |
| `companies` | User's target company pipeline | `user_id = auth.uid()` |
| `company_signals` | Intelligence signals per company | `user_id = auth.uid()` |
| `exec_snapshots` | Exec roster snapshots for diff | `user_id = auth.uid()` |
| `contacts` | Recruiter and network contacts | `user_id = auth.uid()` |
| `follow_ups` | Scheduled actions | `user_id = auth.uid()` |
| `conversations` | AI chat history | `user_id = auth.uid()` |
| `offers` | Job offer tracking | `user_id = auth.uid()` |
| `company_interview_logs` | Interview notes per company | `user_id = auth.uid()` |
| `briefs` | AI-generated prep, strategy, outreach briefs | `user_id = auth.uid()` |
| `llm_traces` | AI usage audit log | service role only |
| `processed_stripe_events` | Stripe webhook idempotency | service role only |
| `sec_filings` | SEC 8-K filing index | service role only |
| `partner_inquiries` | B2B partnership leads | service role only |

Migration files live in `supabase/migrations/` (sequential `NNN_name.sql` format).
Apply new migrations in the Supabase SQL Editor or via `scripts/migrate.sh`.

---

## Authentication & Session

- **Provider**: Supabase Auth (email/password + magic link)
- **Session**: JWT stored as HttpOnly cookie, refreshed by middleware on every dashboard request
- **API routes**: `requireAuth()` in `src/lib/require-auth.ts` validates the session via `supabase.auth.getUser()` and returns `{ ok, userId }` or a 401 response
- **Middleware** (`src/middleware.ts`): refreshes session cookies for `/dashboard/**`; API routes return early without refresh (the cookie is valid for 1 hour)

---

## Subscription & Feature Gating

Tiers (stored in `users.subscription_tier`): `free`, `intelligence`, `active` (Search), `executive`, `campaign`, `coach`

Feature access is defined in `src/lib/subscription.ts` as a `FEATURE_TIERS` map:

```text
scan                intelligence+
ai_chat             active+
prep_brief          active+
strategy_brief      active+
outreach_draft      active+
daily_briefing      active+
resume_tailor       active+
daily_scan          executive+
salary_intelligence executive+
coach_dashboard     coach only
```

Every AI API route calls `canAccessFeature(sub, 'feature_name')` before processing.
Stripe webhook (`api/webhooks/stripe/route.ts`) updates `subscription_tier` on checkout
and subscription events. The `plan` metadata field is validated against a known allowlist
before any DB write.

Billing is managed via `src/lib/stripe.ts`. Checkout sessions are created at
`api/billing/checkout/route.ts`.

Pricing (as of May 2026): Monitor $49/mo, Search $199/mo, Executive $499/mo.

---

## AI Integration

All Claude calls go through a single Anthropic client instance at `src/lib/anthropic.ts`.
Model constants (`MODELS.opus`, `MODELS.sonnet`, `MODELS.haiku`) are defined there.

- `claude-opus-4-7` -- Executive tier prep briefs and Search Strategy Brief
- `claude-sonnet-4-6` -- Prep briefs (non-executive), chat, outreach, resume tailoring
- `claude-haiku-4-5-20251001` -- Signal classification, short tasks

Two rate-limit layers:

1. **Burst limit** (`src/lib/burst-limit.ts`): in-memory sliding window, 10 req/min per user/IP.
2. **Monthly limit** (`src/lib/api-usage.ts`): DB-backed token counter via `isRateLimited()`.

AI usage is traced to `llm_traces` via `src/lib/trace.ts` (model, tokens, latency, feature, input/output snapshots).

---

## Worker

The worker is a standalone Node.js process (`worker/index.js`) running on Railway as a
separate service. It uses the Supabase service-role key and runs on cron intervals (UTC).

**Key jobs (21 total -- see `worker/index.js` for complete list):**

| Job | Schedule | What it does |
| --- | --- | --- |
| `scan-job` | Mon/Wed/Fri 08:00 | Career page scan, all users |
| `executive-scan-job` | Tue/Thu/Sat/Sun 08:00 | Career page scan, Executive tier |
| `executive-evening-scan` | Daily 20:00 | Second career page scan, Executive tier |
| `signal-job` | Mon/Wed/Fri 08:30 | Intelligence signals: news, SEC, PDL, Crunchbase, press rooms, PR wire |
| `briefing-job` | Every 5 min | Per-user timezone check; sends daily briefing when due |
| `momentum-nudge-job` | Daily 10:00 | Email when pipeline momentum drops 15+ points |
| `trial-reminder-job` | Daily 10:00 | T-3 and T-0 trial expiry emails |
| `activation-reminder-job` | Daily 10:30 | Day-3 and day-7 onboarding nudges |
| `cleanup-job` | Sunday 02:00 | Delete signals older than 90d, stale conversations older than 180d |

Jobs use a `runJob()` wrapper that enforces per-job timeouts and prevents concurrent execution.
Errors are captured to Sentry. SIGTERM handled gracefully.

---

## Security Posture

- **RLS**: All user-facing tables; admin tables default-deny to non-service-role clients
- **Auth**: Every mutation API route calls `requireAuth()` or `requireFeatureAccess()`
- **XSS**: User-controlled values in HTML email templates pass through `esc()`/`escHtml()`
- **SSRF**: User-supplied URLs validated via `isAllowedJobUrl()` before fetch (blocks RFC-1918, loopback, metadata endpoints)
- **Stripe**: Webhook signature verified via `stripe.webhooks.constructEvent()`; `plan` metadata validated against allowlist before DB write
- **Input validation**: Zod schemas on structured AI endpoints; field length caps on free-text inputs sent to Claude

Automated checks:

- `tsc --noEmit` and em-dash check run as git pre-commit hooks
- Semgrep custom rules (`.semgrep.yml`) run on every CI push/PR
- Weekly GitHub Actions job checks RLS coverage and auth guard presence on all API routes

---

## Key Files for Reviewers

| File | What it tells you |
| --- | --- |
| `src/lib/subscription.ts` | Feature gating logic and tier hierarchy |
| `src/lib/require-auth.ts` | Auth pattern used across all API routes |
| `src/lib/anthropic.ts` | Single Anthropic client; model config |
| `src/lib/trace.ts` | AI usage auditing |
| `worker/jobs/signal-job.js` | Core intelligence pipeline |
| `supabase/migrations/001_initial_schema.sql` | Full data model with RLS policies |
| `.github/workflows/ci.yml` | CI pipeline (typecheck, tests, Semgrep) |
| `.github/workflows/security-weekly.yml` | Weekly RLS and auth coverage checks |

---

## Local Development

```bash
cp .env.example .env.local   # fill in keys (see docs/onboarding/02-environment-setup.md)
npm install
npm run dev                  # Next.js on :3000

cd worker
npm install
node index.js                # worker (runs all jobs once then exits in dev mode)
```

Full environment variable reference: `docs/onboarding/02-environment-setup.md`.
