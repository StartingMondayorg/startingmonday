# Starting Monday — System Architecture

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: quarterly
Source of truth: yes


startingmonday.app | Last updated: May 2026

---

## Overview

Starting Monday is a Next.js 16 application deployed on Railway, backed by Supabase for data and auth, Stripe for billing, Anthropic Claude for AI, Resend for email delivery, and browserless.io for career page scanning. The system runs as two Railway services: a web application (user-facing) and a worker (background jobs).

---

## Infrastructure Map

```text
┌─────────────────────────────────────────────────────────────┐
│                         Railway                              │
│                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │   Web Service (Next.js) │   │   Worker Service (Node) │  │
│  │   startingmonday.app    │   │   Internal HTTP + cron  │  │
│  │   Build: nixpacks       │   │   jobs                  │  │
│  │   Health: /api/health   │   │                         │  │
│  └────────────┬────────────┘   └────────────┬────────────┘  │
│               │                              │               │
└───────────────┼──────────────────────────────┼───────────────┘
                │                              │
       ┌────────▼──────────────────────────────▼────────┐
       │                  External Services              │
       │                                                 │
       │  Supabase     Anthropic    Stripe    Resend      │
       │  (DB + Auth)  (Claude AI)  (Billing) (Email)    │
       │                                                 │
       │  browserless.io  PostHog      Sentry               │
       │  (Scanning)   (Analytics)  (Errors)             │
       └─────────────────────────────────────────────────┘
```

---

## Web Service (Next.js 16.2 — App Router)

Runtime: Node.js >=20.9.0, deployed on Railway via nixpacks.

Build: `npm run build` / Start: `npm run start`

Key configuration:

- Security headers on all responses: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- Server-only packages: `pdf-parse`, `mammoth` (PDF and Word document parsing)
- Sentry error capture on both client and server runtimes
- Health check endpoint: `GET /api/health` (returns uptime, timestamp, version)

Request middleware (`src/middleware.ts`):

- Logs all API requests (JSON: timestamp, method, path, IP) except `/api/health`
- Extracts client IP from `cf-connecting-ip`, falling back to `x-real-ip`, then `x-forwarded-for`

---

## Worker Service (Node.js)

A separate Railway service that runs scheduled jobs and handles background processing. Communicates with the web service via HTTP using a shared secret.

Immediate scan trigger: `POST /trigger-scan` — called by the web app when a user adds a new company. Authenticated via `x-worker-secret` header. Returns 202 immediately; scan runs async so the caller is not blocked.

Cron Schedule:

| Job | Schedule (UTC) | Purpose |
| --- | --- | --- |
| Scan job | Mon/Wed/Fri 08:00 | Career page scanning via browserless.io |
| Signal job | Mon/Wed/Fri 08:30 | Company intelligence monitoring |
| Briefing job | Every 5 min | Sends briefings per user timezone |
| Follow-up reminders | Daily 06:00 | Nudges for pending action items |
| Momentum score | Sunday 23:00 | Weekly engagement score calculation |
| Weekly report | Sunday 23:30 | Weekly digest email |
| UI/UX weekly review | Sunday 21:00 | Full-page UX audit and summary delivery (email + optional Slack) |
| Usage monitor | Daily 09:00 | Token usage tracking |
| Trial reminders | Daily 10:00 | T-3 and T-0 trial expiration emails |
| Activation reminder | Daily 10:30 | Day-3 and day-7 nudge for incomplete setup |
| Offer email | Daily 11:00 | Sends within 24h of offer_accepted_at being set |
| Reactivation | Daily 11:30 | Annual reactivation email on offer anniversary |
| Cleanup | Sunday 02:00 | Deletes signals >90d and stale conversations >180d |
| Outreach reconcile | Daily 14:50 | Backfills missing contacts from successful live sends and normalizes `reached_out` status before reporting |
| Outreach digest | Daily 15:00 | Delivery summary for recent outreach activity, including bounce/stuck alerts |

Operational command for outreach incidents:

- `npm run audit:outreach-sends -- 2026-05-26` - inspect send logs, failures, and any recipients still missing from `contacts` for a given UTC date.

AI Models in Worker:

- `claude-sonnet-4-6` (SONNET): briefing assembly, signal classification
- `claude-haiku-4-5-20251001` (HAIKU): lightweight classification tasks

---

## Database (Supabase / PostgreSQL)

Auth: Supabase Auth (email/password). Row Level Security (RLS) enforced on all user-facing tables — every query is scoped to the authenticated user's ID.

### Schema

| Table | Purpose |
| --- | --- |
| `users` | Accounts, Stripe customer ID, subscription tier/status, trial end, period end |
| `user_profiles` | Resume text/JSON, target titles, target sectors, locations, positioning, briefing preferences |
| `companies` | Pipeline companies: stage, career page URL, sector, fit score, scan threshold, archived state |
| `scan_results` | Career page scan output: raw role hits (JSONB), AI score, AI summary, notification state |
| `contacts` | Contacts at target companies: title, firm, channel, follow-up date, status |
| `follow_ups` | Action items: due date, action text, status (pending/done/snoozed) |
| `conversations` | AI chat history: messages as JSONB, capped at 300 messages by trigger |
| `drafts` | Generated email/cover letter/LinkedIn drafts |
| `company_signals` | Intelligence signals: funding, exec hire/departure, acquisition, expansion, layoffs, IPO, new product |
| `briefs` | Brief generation logs: type, output text, user rating |
| `pipeline_audit_log` | Full change log: old/new values, initiator (user/worker/system) |
| `api_usage` | Token and request counts by user, service, and month (rate limiting) |
| `processed_stripe_events` | Stripe webhook idempotency (unique constraint on event_id) |
| `user_events` | Server-side behavior event log: event name, metadata JSONB, session ID, timestamp |
| `signal_action_events` | Tracks which signals lead to downstream action (outreach, brief, contact) within 48h |
| `brief_quality_log` | Context richness score alongside every brief generation (has_resume, has_contacts, etc.) |
| `testimonials` | One-sentence testimonials submitted via the offer-completion email feedback link |
| `staff_members` | Internal admin access: email, role (owner/admin/viewer), created_at |

25 migrations applied, from initial schema through tech debt indexes and retention (migration 025).

---

## Auth Architecture

Flow: Supabase Auth (JWT-based). Tokens stored in cookies via `@supabase/ssr`.

Providers: email/password and Google OAuth. Google OAuth callback routes through Supabase's auth handler at `/auth/v1/callback`. The Next.js callback handler at `/auth/callback` reads `x-forwarded-host` and `x-forwarded-proto` headers to construct the correct public redirect URL — Railway's internal routing means `request.url` resolves to `localhost:8080`, not the public domain. Note: on the Supabase free tier, the Google OAuth consent screen shows the Supabase project domain rather than startingmonday.app; fixing this requires Supabase Pro with a custom domain.

Route guards:

- `requireAuth(request)` — validates JWT, returns `{ ok: true, userId }` or `{ ok: false, response: 401 }`
- `requireFeatureAccess(request, feature)` — chains: auth, subscription tier check, monthly rate limit check. Returns `{ ok: true, userId, supabase }` or error response (401/402/429).

Subscription tiers: `free | intelligence | active | executive | campaign`

Subscription statuses: `inactive | trialing | active | paused | past_due | canceled`

---

## AI (Anthropic Claude)

Models:

| Model | ID | Usage |
| --- | --- | --- |
| Opus | `claude-opus-4-7` | Search strategy brief generation |
| Sonnet | `claude-sonnet-4-6` | Prep briefs, chat, outreach drafts, resume tailoring |
| Haiku | `claude-haiku-4-5-20251001` | Signal classification, lightweight extraction |

Temperature presets (matched to task type):

- 0.1 — extraction/classification
- 0.2 — structured output (strategy, resume tailor)
- 0.3 — analytical (prep, Q&A)
- 0.4 — factual (briefing, suggestions)
- 0.5 — conversational (chat)
- 0.7 — creative (outreach drafts)

Context limits:

- Resume: 6,000 chars (`RESUME_CHARS`)
- Documents (JD, annual report, etc.): 4,000 chars each (`DOC_CHARS`)

Streaming: All major AI routes stream `text/plain` responses. Errors are written as `__ERROR__<message>` sentinel strings and caught by the client. All streaming routes use `withStreamTimeout(ms, fn)` from `src/lib/anthropic.ts` — an AbortController wrapper that cancels the Anthropic SDK stream after the configured timeout (chat: 90s).

Chat tool use: The AI chat route uses Anthropic tool use to give the assistant ability to update company pipeline stage, add follow-up reminders, update company notes, and look up contacts — directly from conversation. Tool calls are bounded by `MAX_TOOL_ROUNDS = 5`.

---

## Billing (Stripe)

Integration: Stripe SDK v22. Server-side only (secret key never exposed to client).

Flows:

- Checkout: `POST /api/billing/checkout` — creates Stripe Checkout session with `userId` and `plan` in metadata
- Portal: `POST /api/billing/portal` — creates Stripe Customer Portal session
- Pause/Resume: `POST /api/billing/pause` and `/api/billing/resume`

Webhook (`POST /api/webhooks/stripe`):

- Verified via `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`
- Idempotent: every processed event recorded in `processed_stripe_events`; duplicates return 200 immediately
- Handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `customer.deleted`
- Payment failure triggers both a DB update and a notification email to the user

Status mapping: `mapStripeStatus(stripeStatus, pauseCollection)` normalizes Stripe statuses to internal `AppSubscriptionStatus` type. `pause_collection.behavior` presence takes precedence over all Stripe statuses.

---

## Email (Resend)

Sender: `briefing@startingmonday.app`

Email types:

- Daily/weekly briefing (assembled by worker, HTML format)
- Trial expiration warnings (T-3 days, T-0)
- Payment failure notification (with billing link)
- Team invite
- Signal notifications

---

## Career Page Scanning (browserless.io)

Worker calls browserless.io API to fetch and parse target company career pages. Results stored in `scan_results` as JSONB `raw_hits`, then scored and summarized by Claude. Users are notified when a matching role is detected above their configured `alert_threshold`.

---

## Monitoring & Observability

| Tool | Purpose |
| --- | --- |
| Sentry | Error tracking (client + server). Initialized via `instrumentation.ts` on Next.js startup. DSN configured per environment. |
| UptimeRobot | External uptime monitoring on `/api/health`. Checks every 5 minutes. |
| Railway logs | Stdout JSON request logs from middleware. All API calls logged with method, path, IP, timestamp. |
| PostHog | Client-side product analytics (page views, feature usage). |

---

## Environment Variables

| Variable | Service | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Web + Worker | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Web + Worker | Admin DB access (bypass RLS) |
| `ANTHROPIC_API_KEY` | Web + Worker | Claude API access |
| `BROWSERLESS_API_KEY` | Worker | Career page scanning |
| `RESEND_API_KEY` | Web + Worker | Email delivery |
| `RESEND_FROM_ADDRESS` | Web + Worker | Sending address |
| `STRIPE_SECRET_KEY` | Web | Stripe server API |
| `STRIPE_WEBHOOK_SECRET` | Web | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web | Stripe client-side |
| `NEXT_PUBLIC_SENTRY_DSN` | Web (client) | Sentry error tracking |
| `SENTRY_DSN` | Web (server) | Sentry error tracking |
| `NEXT_PUBLIC_APP_URL` | Web | Canonical URL for links |
| `WORKER_URL` | Web | Worker service base URL |
| `WORKER_SECRET` | Web + Worker | Worker authentication |
| `NEXT_PUBLIC_POSTHOG_KEY` | Web | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Web | PostHog host URL |

---

## Technology Stack Summary

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.2.4 |
| UI | React | 19.2.4 |
| Language | TypeScript | — |
| Database | Supabase / PostgreSQL | — |
| Auth | Supabase Auth | — |
| AI | Anthropic Claude | SDK 0.91.1 |
| Billing | Stripe | SDK 22.1.0 |
| Email | Resend | SDK 6.12.2 |
| Deployment | Railway | — |
| Error Tracking | Sentry | SDK 10.51.0 |
| Analytics | PostHog | SDK 1.372.8 |
| PDF Parsing | pdf-parse | 2.4.5 |
| Word Parsing | mammoth | 1.12.0 |
| Doc Generation | docx | 9.6.1 |
| Testing | Vitest | 4.1.5 |
