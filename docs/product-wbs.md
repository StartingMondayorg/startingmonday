# Work Breakdown Structure
## AI Career Search Platform — Hunter
### Version 1.0 — 2026-04-26

---

## How to Read This Document

- **Effort** is in developer-days (d) for a single senior full-stack developer
- **Dependencies** reference WBS IDs that must be complete before the task starts
- **🔴 Critical path** = any slip here delays the phase end date
- **Phase** is the build phase from the PRD (1–4)
- Estimates assume: no context-switching, no scope creep, prior experience with Next.js + Supabase + Anthropic SDK

---

## Summary Table by Phase

| Phase | Description | Effort | Calendar | Cumulative |
|---|---|---|---|---|
| Phase 1 | Validate Core Loop (no UI) | 29d | Weeks 1–6 | 29d |
| Phase 2 | Web UI + Chat + Stripe | 46d | Weeks 7–16 | 75d |
| Phase 3 | Full Feature Set + Executive Tier | 45d | Weeks 17–25 | 120d |
| Phase 4 | Coach Tier + Partnerships + Growth | 38d | Weeks 26–34 | 158d |
| **Total** | | **158d** | **~34 weeks** | |

> At 5d/week solo, 158d = ~32 weeks. At 4d/week (realistic with founder overhead), 40 weeks = ~10 months to Coach tier. The first paying customer is achievable at end of Phase 2 (~16 weeks).

---

## Phase 1 — Validate the Core Loop
**Goal:** Prove that scan + briefing + Claude delivers value before investing in web UI.
**Exit criteria:** 5 beta users receiving accurate daily briefings for 14 consecutive days with zero critical failures.
**Duration:** 6 weeks (29d effort)

---

### 1.1 Project Foundation

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.1.1 | Create GitHub repository, branch protection, main/staging branches | 0.5d | — | Git repo | |
| 1.1.2 | Set up Supabase project (production + development instances) | 0.5d | 1.1.1 | Two Supabase projects | 🔴 |
| 1.1.3 | Set up Railway account + project for background workers | 0.5d | 1.1.1 | Railway project | |
| 1.1.4 | Set up browserless.io account — obtain API key, test basic connection | 0.5d | — | Working API key | |
| 1.1.5 | Set up Anthropic API account — obtain key, test basic message call | 0.5d | — | Working API key | 🔴 |
| 1.1.6 | Set up Resend account — verify sending domain (DNS DKIM/SPF) | 1d | — | Domain sending verified | 🔴 |
| 1.1.7 | Set up Sentry project (error tracking) — configure alerts for P0 errors | 0.5d | 1.1.1 | Sentry project | |
| 1.1.8 | Set up Uptime Robot — monitor Railway worker health endpoint | 0.25d | 1.1.3 | Uptime monitor live | |
| 1.1.9 | Create `.env` structure + secrets management convention | 0.25d | 1.1.1 | `.env.example` file | |
| **Subtotal** | | **4.5d** | | | |

---

### 1.2 Database Schema

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.2.1 | Write and apply migration: `users` table | 0.5d | 1.1.2 | Migration file | 🔴 |
| 1.2.2 | Write and apply migration: `user_profiles` table | 0.5d | 1.2.1 | Migration file | 🔴 |
| 1.2.3 | Write and apply migration: `companies` table | 0.5d | 1.2.1 | Migration file | 🔴 |
| 1.2.4 | Write and apply migration: `scan_results` table | 0.5d | 1.2.3 | Migration file | 🔴 |
| 1.2.5 | Write and apply migration: `contacts` table | 0.5d | 1.2.1 | Migration file | |
| 1.2.6 | Write and apply migration: `follow_ups` table | 0.5d | 1.2.5 | Migration file | |
| 1.2.7 | Write and apply migration: `conversations` table | 0.25d | 1.2.1 | Migration file | |
| 1.2.8 | Write and apply migration: `drafts` table | 0.25d | 1.2.5 | Migration file | |
| 1.2.9 | Write and apply migration: `momentum_scores` table | 0.25d | 1.2.1 | Migration file | |
| 1.2.10 | Write and apply migration: `pipeline_audit_log` table | 0.25d | 1.2.1 | Migration file | |
| 1.2.11 | Enable Row-Level Security on all tables — write and test all RLS policies | 1d | 1.2.1–1.2.10 | All tables RLS-enabled | 🔴 |
| 1.2.12 | Write seed script for dev: create 2 test users with full profiles + companies | 0.5d | 1.2.11 | `seed.sql` | |
| 1.2.13 | Validate RLS: confirm cross-tenant query returns zero rows | 0.5d | 1.2.11 | Test results documented | 🔴 |
| **Subtotal** | | **6.0d** | | | |

---

### 1.3 Career Page Scanner

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.3.1 | Build core Playwright page-fetching function using browserless.io REST API | 1d | 1.1.4 | `scanner/fetch-page.js` | 🔴 |
| 1.3.2 | Build HTML text extraction — clean raw HTML to plain text, strip nav/footer/ads | 1d | 1.3.1 | `scanner/extract-text.js` | 🔴 |
| 1.3.3 | Build role detection logic — keyword matching (title, level, function) against user profile | 1d | 1.3.2 | `scanner/detect-roles.js` | 🔴 |
| 1.3.4 | Build robots.txt checker — before scanning any new URL, verify Disallow rules | 0.5d | 1.3.1 | `scanner/robots-check.js` | |
| 1.3.5 | Integrate Claude Haiku scoring — send detected hit + user profile, parse JSON score response | 1d | 1.1.5, 1.3.3 | `scanner/score-hit.js` | 🔴 |
| 1.3.6 | Build deduplication logic — compare new hits against `scan_results` table, suppress duplicates | 0.5d | 1.2.4, 1.3.3 | `scanner/deduplicate.js` | |
| 1.3.7 | Write scan results to `scan_results` table — including raw hits, AI score, AI summary | 0.5d | 1.2.4, 1.3.5 | DB write function | 🔴 |
| 1.3.8 | Build scan failure handler — log error to `scan_results`, flag company, queue retry | 0.5d | 1.3.7 | Error handling | |
| 1.3.9 | Manual integration test: scan 5 real company career pages, verify results in DB | 0.5d | 1.3.7 | Test results | 🔴 |
| **Subtotal** | | **6.5d** | | | |

---

### 1.4 Background Worker Infrastructure

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.4.1 | Set up Railway Node.js worker project — Dockerfile, health endpoint, env vars | 1d | 1.1.3 | Worker deployed on Railway | 🔴 |
| 1.4.2 | Implement node-cron scheduler in worker: scan job (Mon/Wed/Fri 8AM UTC) | 0.5d | 1.4.1 | Cron running | 🔴 |
| 1.4.3 | Implement scan job queue: query DB for companies due for scan, dispatch to scanner | 1d | 1.4.2, 1.3.9 | Queue runner | 🔴 |
| 1.4.4 | Implement concurrency control: max 10 concurrent browserless.io sessions | 0.5d | 1.4.3 | Throttled queue | |
| 1.4.5 | Add node-cron job: briefing engine (Mon–Fri 6:00 AM UTC) | 0.25d | 1.4.2 | Briefing cron | 🔴 |
| 1.4.6 | Add node-cron job: follow-up reminder checker (daily 6:00 AM UTC) | 0.25d | 1.4.2 | Follow-up cron | |
| 1.4.7 | Add node-cron job: momentum score calculation (Sunday 11:00 PM UTC) | 0.25d | 1.4.2 | Momentum cron | |
| 1.4.8 | Add node-cron job: weekly progress report (Sunday 11:30 PM UTC) | 0.25d | 1.4.2 | Progress cron | |
| 1.4.9 | Worker observability: structured JSON logging, Sentry error capture in workers | 0.5d | 1.4.1 | Logs in Railway dashboard | |
| **Subtotal** | | **4.5d** | | | |

---

### 1.5 Daily Briefing Engine

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.5.1 | Build context assembler: query DB for overdue follow-ups, scan matches, pipeline state | 1d | 1.2.11, 1.4.5 | `briefing/assemble-context.js` | 🔴 |
| 1.5.2 | Implement "suppress if empty" logic — skip briefing if context has no actions | 0.25d | 1.5.1 | Suppression logic | |
| 1.5.3 | Build Claude Sonnet briefing call — system prompt, context injection, output: HTML email body | 1d | 1.1.5, 1.5.1 | `briefing/generate-briefing.js` | 🔴 |
| 1.5.4 | Build dynamic subject line generator — surface most urgent action in subject | 0.25d | 1.5.3 | Subject line logic | |
| 1.5.5 | Build Resend email delivery function — HTML + plain text, tracking pixel, pause link | 1d | 1.1.6, 1.5.3 | `briefing/send-briefing.js` | 🔴 |
| 1.5.6 | Build React Email template: daily briefing — one-column, 600px, dark mode safe | 1d | 1.5.5 | Email template | 🔴 |
| 1.5.7 | End-to-end briefing test: generate and send to 2 test email addresses, review quality | 0.5d | 1.5.6 | Test email delivered | 🔴 |
| 1.5.8 | Tune Claude system prompt for briefing quality — anti-AI-copy, tone, length | 0.5d | 1.5.7 | Refined prompt | |
| **Subtotal** | | **5.5d** | | | |

---

### 1.6 Admin Tooling (Manual Beta)

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.6.1 | Build admin SQL script: create user + profile from JSON input | 0.5d | 1.2.12 | `admin/create-user.sql` | |
| 1.6.2 | Build admin SQL script: add companies + contacts for a user | 0.5d | 1.2.12 | `admin/seed-pipeline.sql` | |
| 1.6.3 | Build admin script: trigger immediate scan for a user's companies (bypass cron) | 0.25d | 1.4.3 | `admin/run-scan.js` | |
| 1.6.4 | Build admin script: trigger immediate briefing for a user (bypass cron) | 0.25d | 1.5.5 | `admin/send-briefing.js` | |
| 1.6.5 | Build admin script: view scan history for a company (last 7 results) | 0.25d | 1.2.4 | `admin/scan-history.js` | |
| **Subtotal** | | **1.75d** | | | |

---

### 1.7 Phase 1 Validation

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 1.7.1 | Onboard 5 beta users manually — create profiles, seed pipelines, configure briefing time | 0.5d | 1.6.1, 1.6.2 | 5 active beta accounts | |
| 1.7.2 | Monitor briefing delivery for 14 days — zero critical failures | 0d (monitoring) | 1.7.1 | Pass/fail gate | 🔴 |
| 1.7.3 | Collect qualitative feedback from beta users at Day 7 — structured interview | 0.5d | 1.7.1 | Feedback notes | |
| 1.7.4 | Fix top 3 issues surfaced by beta feedback | 1d | 1.7.3 | Bug fixes | |
| 1.7.5 | Go/no-go decision for Phase 2 — review metrics against Phase 1 exit criteria | 0d (decision) | 1.7.2, 1.7.4 | Decision documented | 🔴 |
| **Subtotal** | | **2.0d** | | | |

**Phase 1 Total: 30.75d ≈ 6 weeks**

---

---

## Phase 2 — Web UI + Chat + Stripe
**Goal:** A self-serve web product. New user can sign up, complete onboarding, and receive their first briefing without admin involvement.
**Exit criteria:** 10 paying users on Monitor or Active tier. Trial-to-paid conversion ≥ 30%.
**Duration:** 10 weeks (46d effort)

---

### 2.1 Next.js Application Setup

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.1.1 | Scaffold Next.js 15 app with App Router — TypeScript, Tailwind CSS, shadcn/ui init | 0.5d | 1.1.1 | Running Next.js app | 🔴 |
| 2.1.2 | Configure Vercel project — connect GitHub repo, set up preview + production environments | 0.5d | 2.1.1 | Vercel project live | 🔴 |
| 2.1.3 | Set up environment variable management — Vercel env vars for all keys | 0.25d | 2.1.2 | Env vars configured | |
| 2.1.4 | Configure ESLint, Prettier, pre-commit hooks (Husky + lint-staged) | 0.5d | 2.1.1 | Code quality gates | |
| 2.1.5 | Build shared layout components: nav, sidebar, page shell, loading states | 1d | 2.1.1 | Layout components | 🔴 |
| 2.1.6 | Set up Sentry for Next.js — frontend + API route error capture | 0.25d | 2.1.2 | Sentry Next.js integration | |
| **Subtotal** | | **3.0d** | | | |

---

### 2.2 Authentication

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.2.1 | Integrate Supabase Auth into Next.js — SSR client, middleware, session handling | 1d | 2.1.1, 1.1.2 | Auth working end-to-end | 🔴 |
| 2.2.2 | Build sign-up page — email/password, terms acceptance, post-signup redirect to onboarding | 0.5d | 2.2.1 | `/signup` route | 🔴 |
| 2.2.3 | Build login page — email/password, forgot password flow | 0.5d | 2.2.1 | `/login` route | |
| 2.2.4 | Build email verification flow — Supabase magic link, redirect handling | 0.5d | 2.2.2 | Email verification | |
| 2.2.5 | Build Google OAuth flow — Supabase OAuth, Google Cloud project, consent screen | 1d | 2.2.1 | Google login button | |
| 2.2.6 | Build JWT validation middleware — all `/api/v1/*` routes validate JWT, extract user_id | 0.5d | 2.2.1 | API middleware | 🔴 |
| 2.2.7 | Build account settings page — change email, change password, delete account | 0.5d | 2.2.1 | `/settings/account` route | |
| 2.2.8 | Test: confirm RLS blocks cross-tenant API calls at the API route level | 0.5d | 2.2.6 | Security test results | 🔴 |
| **Subtotal** | | **5.0d** | | | |

---

### 2.3 Onboarding Wizard

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.3.1 | Build multi-step wizard shell — progress indicator, back/next navigation, auto-save | 1d | 2.2.2 | Wizard shell component | 🔴 |
| 2.3.2 | Step 1: Role target + experience level — title input (typeahead), years of experience | 0.5d | 2.3.1 | Step 1 UI | |
| 2.3.3 | Step 2: Sectors of interest — multi-select (up to 5) from predefined list + custom entry | 0.5d | 2.3.1 | Step 2 UI | |
| 2.3.4 | Step 3: Geography + comp range — location multi-select, salary range slider | 0.5d | 2.3.1 | Step 3 UI | |
| 2.3.5 | Step 4: Resume upload — PDF/DOCX to Supabase Storage, text extraction on server | 1d | 2.3.1 | Step 4 UI + upload API | 🔴 |
| 2.3.6 | Step 5: LinkedIn sections paste — headline, about, top 3 experience (optional) | 0.5d | 2.3.1 | Step 5 UI | |
| 2.3.7 | Step 6: Target company list — add by name or skip to discovery engine | 0.5d | 2.3.1 | Step 6 UI | |
| 2.3.8 | Step 7: Search status — active / passive / paused | 0.25d | 2.3.1 | Step 7 UI | |
| 2.3.9 | Step 8: Briefing time configuration — time picker, timezone selector | 0.5d | 2.3.1 | Step 8 UI | |
| 2.3.10 | Wizard completion: write all inputs to `user_profiles`, trigger first scan queue | 0.5d | 2.3.2–2.3.9, 1.4.3 | Wizard completion API | 🔴 |
| 2.3.11 | Post-wizard landing: "Your search is live" confirmation, first daily briefing scheduled message | 0.25d | 2.3.10 | Completion screen | |
| **Subtotal** | | **6.0d** | | | |

---

### 2.4 Dashboard — Pipeline Views

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.4.1 | Build dashboard home: Momentum Score widget, overdue follow-ups count, recent scan matches | 1d | 2.2.6, 1.2.11 | `/dashboard` home | 🔴 |
| 2.4.2 | Build company pipeline — Kanban board view: stages as columns, drag-and-drop cards | 1.5d | 2.4.1 | Kanban component | 🔴 |
| 2.4.3 | Build company pipeline — table view: sortable columns, stage badge, fit score, follow-up date | 1d | 2.4.1 | Table component | |
| 2.4.4 | View toggle: switch between Kanban and table without losing state | 0.25d | 2.4.2, 2.4.3 | Toggle | |
| 2.4.5 | Company detail panel: edit all fields, view scan history, linked contacts | 1d | 2.4.2 | Slide-out panel | |
| 2.4.6 | Stale entry visual flag: highlight companies past 14 days with no update | 0.25d | 2.4.3 | Stale flag styling | |
| 2.4.7 | Archive company flow: modal with reason selection, soft delete | 0.25d | 2.4.5 | Archive modal | |
| 2.4.8 | Add company: quick-add form (name, URL, sector, fit score) | 0.5d | 2.4.1 | Add company flow | |
| 2.4.9 | Supabase Realtime: subscribe to company updates — Kanban refreshes without page reload after AI tool use | 0.5d | 2.4.2 | Realtime subscription | 🔴 |
| **Subtotal** | | **6.25d** | | | |

---

### 2.5 Dashboard — Contact Tracker

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.5.1 | Build contact list view: table with status badge, channel icon, follow-up date, overdue flag | 1d | 2.4.1 | `/dashboard/contacts` | |
| 2.5.2 | Contact detail panel: edit all fields, view linked drafts, view linked company | 0.75d | 2.5.1 | Slide-out panel | |
| 2.5.3 | Add contact: quick-add form (name, title, firm, channel) | 0.25d | 2.5.1 | Add contact form | |
| 2.5.4 | Follow-up date setter: date picker, default suggestion based on contact type | 0.5d | 2.5.2 | Date picker component | |
| 2.5.5 | Overdue follow-up filter: one-click view of all overdue contacts | 0.25d | 2.5.1 | Filter | |
| 2.5.6 | Mark follow-up complete: single-click from list view, clears overdue flag | 0.25d | 2.5.1 | Complete action | |
| **Subtotal** | | **3.0d** | | | |

---

### 2.6 Dashboard — Follow-Up Calendar

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.6.1 | Build follow-up calendar view: week view showing contacts and companies with due dates | 1d | 2.4.1, 2.5.1 | `/dashboard/calendar` | |
| 2.6.2 | Click-through from calendar item to contact or company detail | 0.25d | 2.6.1 | Navigation | |
| 2.6.3 | Overdue items surface at top of calendar view with visual differentiation | 0.25d | 2.6.1 | Overdue styling | |
| **Subtotal** | | **1.5d** | | | |

---

### 2.7 AI Recruiter Chat

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.7.1 | Build system prompt assembler: query all pipeline data, format into Claude system prompt | 1d | 2.2.6, 1.2.11 | `lib/chat/build-system-prompt.ts` | 🔴 |
| 2.7.2 | Implement tool definitions (RECRUITER_TOOLS) in API route | 0.5d | 2.7.1 | Tool definitions | 🔴 |
| 2.7.3 | Build tool execution handlers: map tool names to DB operations | 1.5d | 2.7.2, 1.2.11 | `lib/chat/execute-tool.ts` | 🔴 |
| 2.7.4 | Build streaming API route: `POST /api/v1/chat` — Anthropic SDK streaming, SSE to client | 1d | 2.7.1, 2.7.2 | Streaming API route | 🔴 |
| 2.7.5 | Build chat UI: message thread, input box, streaming token rendering, loading state | 1.5d | 2.4.1 | Chat component | 🔴 |
| 2.7.6 | Implement tool use UI: render tool call + result inline in chat thread | 0.75d | 2.7.3, 2.7.5 | Tool call UI | |
| 2.7.7 | Persist conversation to `conversations` table: store messages as JSONB, update on each turn | 0.5d | 2.7.4 | Conversation persistence | |
| 2.7.8 | Context window management: summarize + compress messages older than 50 turns | 0.5d | 2.7.7 | Compression logic | |
| 2.7.9 | Conversation clear: start new session without losing pipeline data | 0.25d | 2.7.7 | Clear action | |
| 2.7.10 | Test tool use end-to-end: update_company_stage reflects in Kanban without page refresh | 0.5d | 2.7.6, 2.4.9 | Integration test | 🔴 |
| 2.7.11 | Implement per-user token budget enforcement: return error with upgrade CTA if exceeded | 0.5d | 2.7.4 | Rate limit logic | |
| **Subtotal** | | **8.5d** | | | |

---

### 2.8 Outreach Drafting (Standalone)

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.8.1 | Build outreach drafting API route: `POST /api/v1/drafts` — Claude Sonnet, anti-AI-copy system prompt | 1d | 2.2.6, 1.1.5 | API route | 🔴 |
| 2.8.2 | Build drafting UI: mode selector (email/LinkedIn/follow-up), input form, output display | 1d | 2.4.1 | `/dashboard/drafts/new` | |
| 2.8.3 | Revision flow: natural language revision input, re-call Claude with original + revision instruction | 0.5d | 2.8.1, 2.8.2 | Revision UI | |
| 2.8.4 | Save draft to `drafts` table, link to contact and company | 0.25d | 2.8.1 | Save action | |
| 2.8.5 | Mark as sent: update `contacts.contacted_at`, create follow-up in `follow_ups` | 0.5d | 2.8.4, 2.5.1 | Sent action | |
| 2.8.6 | Draft history view: list all drafts per contact | 0.25d | 2.8.4 | Draft history | |
| 2.8.7 | Copy-to-clipboard button on draft output — one-click copy | 0.1d | 2.8.2 | Copy button | |
| **Subtotal** | | **3.6d** | | | |

---

### 2.9 LinkedIn Profile Optimizer

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.9.1 | Build LinkedIn optimizer API route: `POST /api/v1/linkedin/optimize` — Claude Sonnet | 0.75d | 2.2.6, 1.1.5 | API route | |
| 2.9.2 | Build optimizer UI: paste inputs (headline, about, 3 experience blocks), target role selector | 0.75d | 2.4.1 | `/dashboard/linkedin` | |
| 2.9.3 | Render scored critique: score per section, specific issues list, rewritten sections | 0.75d | 2.9.1, 2.9.2 | Results UI | |
| 2.9.4 | Save optimized sections to `user_profiles.linkedin_optimized` | 0.25d | 2.9.1 | Save action | |
| 2.9.5 | Surface optimizer in onboarding wizard (Step 5) if LinkedIn sections were pasted | 0.25d | 2.3.6, 2.9.1 | Onboarding integration | |
| **Subtotal** | | **2.75d** | | | |

---

### 2.10 Stripe Billing Integration

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.10.1 | Create Stripe products and prices: Monitor ($49/mo + $39/yr), Active ($129/mo + $103/yr) | 0.5d | — | Stripe products live | 🔴 |
| 2.10.2 | Build subscription checkout flow: `POST /api/v1/billing/checkout` — Stripe Checkout Session | 1d | 2.2.6 | Checkout flow | 🔴 |
| 2.10.3 | Build Stripe webhook handler: `POST /api/webhooks/stripe` — handle subscription events | 1d | 2.10.2 | Webhook handler | 🔴 |
| 2.10.4 | On `subscription.updated` webhook: update `users.subscription_tier` and `subscription_status` | 0.5d | 2.10.3 | Status sync | 🔴 |
| 2.10.5 | On `payment_failed` webhook: set status to `past_due`, send dunning email | 0.5d | 2.10.3 | Dunning flow | |
| 2.10.6 | On `subscription.deleted` webhook: set status to `canceled`, downgrade features | 0.5d | 2.10.3 | Cancellation flow | |
| 2.10.7 | Configure Stripe Customer Portal — self-serve plan change, payment method update, cancellation | 0.5d | 2.10.1 | Customer portal live | |
| 2.10.8 | Build billing page UI: current plan, next billing date, manage subscription button | 0.5d | 2.10.7 | `/settings/billing` | |
| 2.10.9 | Build 7-day free trial flow: no credit card at signup, collect at trial end | 0.5d | 2.10.2 | Trial flow | |
| **Subtotal** | | **5.5d** | | | |

---

### 2.11 Feature Gates + Upgrade CTAs

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.11.1 | Build `checkFeatureAccess(userId, feature)` server utility — queries subscription tier | 0.5d | 2.10.4 | Feature gate utility | 🔴 |
| 2.11.2 | Gate all Active+ features: AI chat, daily briefing, outreach drafting, LinkedIn optimizer | 0.5d | 2.11.1 | Feature gates | 🔴 |
| 2.11.3 | Build upgrade CTA component: lock icon + "Upgrade to Active — $129/month" with direct checkout link | 0.25d | 2.11.1 | CTA component | |
| 2.11.4 | Surface upgrade CTAs at each feature gate touch point | 0.5d | 2.11.3 | CTAs live | |
| 2.11.5 | Enforce company watchlist limits per tier at DB write level (not just UI) | 0.25d | 2.11.1 | Limit enforcement | |
| **Subtotal** | | **2.0d** | | | |

---

### 2.12 Phase 2 QA + Launch

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 2.12.1 | Full user journey test: sign up → onboard → receive briefing → use chat → draft outreach | 1d | All Phase 2 | Test results | 🔴 |
| 2.12.2 | Cross-browser test: Chrome, Firefox, Safari, Edge — dashboard and chat | 0.5d | 2.12.1 | Browser compat | |
| 2.12.3 | Mobile web test: dashboard, chat, onboarding on iOS Safari + Chrome Android | 0.5d | 2.12.1 | Mobile compat | |
| 2.12.4 | Load test: 20 concurrent chat sessions — verify no timeout or memory leak | 0.5d | 2.12.1 | Load test results | |
| 2.12.5 | Security review: confirm all API routes require valid JWT, RLS is enforced, no secrets in client bundle | 0.5d | 2.12.1 | Security checklist signed off | 🔴 |
| 2.12.6 | Privacy policy page — publish before accepting first payment | 0.5d | — | `/privacy` route | 🔴 |
| 2.12.7 | Terms of service page — publish before accepting first payment | 0.25d | — | `/terms` route | 🔴 |
| 2.12.8 | Fix top 10 bugs from QA | 2d | 2.12.1–2.12.5 | Bug fixes | 🔴 |
| 2.12.9 | Invite first 10 paying users — direct outreach, white-glove onboarding if needed | 0d (sales effort) | 2.12.8 | 10 paying users | 🔴 |
| **Subtotal** | | **5.75d** | | | |

**Phase 2 Total: 46.35d ≈ 10 weeks**

---

---

## Phase 3 — Full Feature Set + Executive Tier
**Goal:** Launch Executive tier. Full feature parity with all 14 features in the PRD.
**Exit criteria:** 50 paying users. NPS ≥ 40. All PRD features live.
**Duration:** 9 weeks (45d effort)

---

### 3.1 Company Discovery Engine

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.1.1 | Build discovery API route: `POST /api/v1/discovery` — Claude Sonnet, structured list output | 1d | 2.2.6 | API route | |
| 3.1.2 | Build discovery UI: profile inputs → generated company list with rationale | 1d | 3.1.1 | `/dashboard/discovery` | |
| 3.1.3 | Accept/reject flow: accepted companies added to watchlist immediately | 0.5d | 3.1.2, 2.4.8 | Accept/reject actions | |
| 3.1.4 | "Companies like X" seed mode: user can name a seed company to anchor suggestions | 0.25d | 3.1.1 | Seed input | |
| 3.1.5 | Integrate discovery into onboarding Step 6 as an alternative to manual entry | 0.5d | 3.1.3, 2.3.7 | Onboarding integration | |
| **Subtotal** | | **3.25d** | | | |

---

### 3.2 Resume Tailoring

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.2.1 | Build resume parser: convert uploaded PDF/DOCX to structured JSON (sections, bullets) | 1.5d | 2.3.5 | `lib/resume/parse-resume.ts` | 🔴 |
| 3.2.2 | Build tailoring API route: `POST /api/v1/resume/tailor` — Claude Sonnet, JD + base resume in | 1d | 3.2.1 | API route | 🔴 |
| 3.2.3 | Build tailoring UI: paste JD, view diff-highlighted output, accept/reject per bullet | 1d | 3.2.2 | `/dashboard/resume` | |
| 3.2.4 | ATS keyword match score: extract JD noun phrases, compute coverage percentage | 0.75d | 3.2.2 | Score component | |
| 3.2.5 | Build .docx export: server-side generation using `docx` npm package, download endpoint | 1d | 3.2.3 | Export API + download | |
| 3.2.6 | Save tailored version to `companies` record (as associated resume variant) | 0.5d | 3.2.3 | Save action | |
| 3.2.7 | Hallucination guard: validate tailored bullets — no date, title, or company not in base resume | 0.5d | 3.2.2 | Validation logic | 🔴 |
| **Subtotal** | | **6.25d** | | | |

---

### 3.3 Positioning Coach

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.3.1 | Build positioning coach API route: multi-turn Claude Sonnet session with structured output | 1d | 2.2.6 | API route | |
| 3.3.2 | Build positioning coach UI: mode selection (pivot / level jump / gap), multi-turn chat, final statement display | 1d | 3.3.1 | `/dashboard/positioning` | |
| 3.3.3 | Save positioning statement to `user_profiles.positioning_summary` | 0.25d | 3.3.1 | Save action | |
| 3.3.4 | Inject positioning statement into outreach drafting system prompt automatically | 0.25d | 3.3.3, 2.8.1 | Prompt integration | |
| 3.3.5 | Gap coaching: specialized prompts for explaining employment gaps — surface naturally, not defensively | 0.5d | 3.3.1 | Gap mode | |
| **Subtotal** | | **3.0d** | | | |

---

### 3.4 Interview Prep Coach

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.4.1 | Build interview brief API route: `POST /api/v1/interview/brief` — Claude Sonnet, structured sections | 1d | 2.2.6 | API route | |
| 3.4.2 | Build interview intake UI: company, role, date, type, interviewer names | 0.5d | 3.4.1 | Intake form | |
| 3.4.3 | Build interview brief UI: rendered sections (company, questions, positioning, ask list, landmines) | 0.75d | 3.4.1, 3.4.2 | Brief display | |
| 3.4.4 | Interview logging: save interview events to `follow_ups` table with interview type | 0.25d | 3.4.2 | Interview log | |
| 3.4.5 | Practice Q&A mode: chat sub-interface with real-time answer feedback | 1d | 2.7.5, 3.4.1 | Q&A mode | |
| 3.4.6 | Post-interview notes: log notes, trigger thank-you note draft | 0.5d | 3.4.3, 2.8.1 | Post-interview flow | |
| 3.4.7 | Email brief delivery: send formatted brief email 24 hours before interview via Resend | 0.75d | 3.4.3, 1.4.5 | Brief email | |
| **Subtotal** | | **4.75d** | | | |

---

### 3.5 Salary Intelligence

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.5.1 | Build salary intelligence API route: `POST /api/v1/salary` — Claude Sonnet, geo-adjusted output | 0.75d | 2.2.6 | API route | |
| 3.5.2 | Build salary intelligence UI: triggered from pipeline "Offer" stage, inputs + output display | 0.75d | 3.5.1, 2.4.2 | Offer stage integration | |
| 3.5.3 | Output rendering: range (low/target/ceiling), negotiation script, pushback responses | 0.5d | 3.5.1 | Output component | |
| **Subtotal** | | **2.0d** | | | |

---

### 3.6 Momentum Score

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.6.1 | Build momentum score calculation function: weighted formula from pipeline activity data | 1d | 1.2.9, 1.4.7 | `workers/momentum/calculate.js` | |
| 3.6.2 | Write score + components to `momentum_scores` table weekly | 0.25d | 3.6.1 | DB write | |
| 3.6.3 | Build momentum score widget for dashboard home | 0.5d | 3.6.2, 2.4.1 | Score widget | 🔴 |
| 3.6.4 | Trend chart: 12-week history bar/line chart | 0.5d | 3.6.2 | Chart component | |
| 3.6.5 | Drop nudge: detect score drop ≥ 20pts week-over-week, generate targeted briefing item | 0.75d | 3.6.2, 1.5.3 | Nudge logic | |
| 3.6.6 | Browser push notification for score drop: request permission at login, send via Web Push API | 0.75d | 3.6.5 | Push notification | |
| **Subtotal** | | **3.75d** | | | |

---

### 3.7 Weekly Progress Report

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.7.1 | Build progress report generation function: aggregate weekly stats, compute benchmarks | 1d | 1.4.8, 1.2.9 | `workers/reports/weekly.js` | |
| 3.7.2 | Build React Email template: weekly progress report — metrics table, benchmark comparison, top 3 actions | 0.75d | 3.7.1 | Email template | |
| 3.7.3 | Deliver via Resend on Sunday | 0.25d | 3.7.2, 1.1.6 | Report delivery | |
| 3.7.4 | In-app progress report view: same data as email, accessible at `/dashboard/progress` | 0.5d | 3.7.1 | In-app view | |
| **Subtotal** | | **2.5d** | | | |

---

### 3.8 Market Intelligence Digest

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.8.1 | Build digest generation function: aggregate scan results across watchlist, Claude narrative synthesis | 0.75d | 1.5.3, 1.3.7 | `workers/digest/generate.js` | |
| 3.8.2 | Build React Email template: market intelligence digest — narrative + company list + upgrade CTA | 0.5d | 3.8.1 | Email template | |
| 3.8.3 | Deliver via cron: Monitor tier weekly, Active/Executive monthly | 0.25d | 3.8.2 | Cron job | |
| **Subtotal** | | **1.5d** | | | |

---

### 3.9 Google OAuth Integration

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.9.1 | Create Google Cloud project — configure OAuth 2.0 consent screen, Gmail read-only scope | 0.5d | — | Google project configured | |
| 3.9.2 | Build OAuth connect flow in settings: user connects Gmail, stores refresh token encrypted | 1d | 2.2.5, 3.9.1 | `/settings/integrations` | |
| 3.9.3 | Build Gmail polling worker: read sent mail every 6 hours, detect sent outreach by contact name | 1.5d | 3.9.2, 1.4.1 | Gmail poll worker | |
| 3.9.4 | Auto-log contact date when Gmail poll detects sent outreach to a tracked contact | 0.5d | 3.9.3, 2.5.1 | Auto-log action | |
| 3.9.5 | Encrypt OAuth refresh tokens at rest using application-level encryption | 0.5d | 3.9.2 | Encryption | 🔴 |
| 3.9.6 | Token revocation: user can disconnect Gmail in settings, tokens deleted | 0.25d | 3.9.2 | Revoke flow | |
| **Subtotal** | | **4.25d** | | | |

---

### 3.10 Executive Tier + Stripe

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.10.1 | Create Stripe Executive tier products: $249/mo + $199/yr | 0.25d | 2.10.1 | Stripe products | 🔴 |
| 3.10.2 | Gate interview prep, salary intelligence, advanced recruiter tracker behind Executive tier | 0.5d | 2.11.1, 3.4.1, 3.5.1 | Feature gates | 🔴 |
| 3.10.3 | Upgrade CTAs for Executive features | 0.25d | 3.10.2 | CTAs | |
| 3.10.4 | Recruiter tracker enhancements for Executive tier: priority flags, firm-level grouping, export to CSV | 1d | 2.5.1 | Enhanced tracker | |
| 3.10.5 | Daily scan cadence for Executive tier: update scan frequency logic in worker | 0.25d | 1.4.3 | Daily scan | |
| 3.10.6 | Company watchlist limit increase for Executive: 50 companies enforced | 0.25d | 2.11.5 | Limit update | |
| **Subtotal** | | **2.5d** | | | |

---

### 3.11 Scan Match Alert Emails

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.11.1 | Build match alert email React template: company, role, AI summary, score, CTA buttons (draft outreach / add to pipeline) | 0.75d | 1.3.7 | Alert template | |
| 3.11.2 | Build alert delivery function: triggered after scan result with score ≥ threshold | 0.5d | 3.11.1, 1.1.6 | Alert delivery | |
| 3.11.3 | Deep link handling: clicking CTA in email opens app at the relevant company record | 0.5d | 3.11.2, 2.4.5 | Deep links | |
| **Subtotal** | | **1.75d** | | | |

---

### 3.12 Phase 3 QA

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 3.12.1 | Full Executive tier user journey test | 1d | All Phase 3 | Test results | 🔴 |
| 3.12.2 | Load test: 100 concurrent users, 50 daily briefings, 200 scans in a 4-hour window | 0.5d | 3.12.1 | Load test results | |
| 3.12.3 | Google OAuth end-to-end test with real Gmail account | 0.5d | 3.9.4 | OAuth test | 🔴 |
| 3.12.4 | .docx export test across Word, Google Docs, LibreOffice | 0.25d | 3.2.5 | Compatibility check | |
| 3.12.5 | Fix top bugs from Phase 3 QA | 2d | 3.12.1–3.12.4 | Bug fixes | 🔴 |
| 3.12.6 | Qualitative NPS survey to all paying users — target NPS ≥ 40 | 0d (async) | All Phase 3 | NPS score | |
| **Subtotal** | | **4.25d** | | | |

**Phase 3 Total: 44.75d ≈ 9 weeks**

---

---

## Phase 4 — Coach Tier + Partnerships + Growth
**Goal:** B2B channel open, Coach tier live, growth mechanics in place.
**Exit criteria:** 2 outplacement firm agreements signed. 5 Coach tier subscribers. $25K MRR pathway visible.
**Duration:** 8 weeks (38d effort)

---

### 4.1 Coach Tier — Data Model

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.1.1 | Write migration: `coach_relationships` table (coach_user_id → client_user_id, status, client_alias) | 0.5d | 1.2.1 | Migration | 🔴 |
| 4.1.2 | Write migration: `coach_briefing_overrides` table (coach branding, custom header/footer) | 0.25d | 4.1.1 | Migration | |
| 4.1.3 | Update RLS: coaches can read (not write) client pipeline data — never cross-client | 0.75d | 4.1.1 | RLS policies | 🔴 |
| 4.1.4 | Client invite flow: coach sends invite link → client signs up → relationship established | 1d | 4.1.1, 2.2.2 | Invite flow | 🔴 |
| **Subtotal** | | **2.5d** | | | |

---

### 4.2 Coach Tier — Multi-Client Dashboard

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.2.1 | Build coach dashboard: client list with Momentum Score, stage distribution, overdue follow-up count | 1.5d | 4.1.3 | `/coach/dashboard` | 🔴 |
| 4.2.2 | Client detail drill-down: coach can view a client's full pipeline (read-only) | 1d | 4.2.1 | Client detail view | |
| 4.2.3 | Aggregate analytics: average Momentum Score across client cohort, pipeline funnel across all clients | 0.75d | 4.2.1 | Analytics view | |
| 4.2.4 | Coach notes: coach can add private notes to a client record (not visible to client) | 0.5d | 4.2.2 | Coach notes | |
| 4.2.5 | Client limit enforcement: max 10 active clients per Coach tier subscription | 0.25d | 4.1.4 | Limit logic | |
| **Subtotal** | | **4.0d** | | | |

---

### 4.3 White-Label Briefings

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.3.1 | Build coach branding settings: upload logo, set firm name, set accent color, preview | 0.75d | 4.1.2 | Branding settings UI | |
| 4.3.2 | Build white-label email template: same briefing structure, coach header/footer instead of Hunter branding | 0.75d | 4.3.1, 1.5.6 | White-label template | |
| 4.3.3 | White-label sending domain: coach can configure a custom sending domain (CNAME approach via Resend) | 0.5d | 4.3.2 | Custom domain support | |
| 4.3.4 | Opt-in for clients: client's briefings switch to white-label template when coach enables it | 0.25d | 4.3.2 | Opt-in logic | |
| **Subtotal** | | **2.25d** | | | |

---

### 4.4 Coach Stripe Tier

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.4.1 | Create Stripe Coach tier products: $599/mo + $479/yr | 0.25d | 2.10.1 | Stripe products | |
| 4.4.2 | Gate coach dashboard, white-label, multi-client behind Coach tier | 0.25d | 2.11.1, 4.2.1, 4.3.2 | Feature gates | |
| 4.4.3 | Build coach upgrade page — different CTA and pitch from standard upgrade flow | 0.5d | 4.4.2 | Upgrade page | |
| **Subtotal** | | **1.0d** | | | |

---

### 4.5 Referral Program

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.5.1 | Build referral tracking: unique referral link per user, click tracking, signup attribution | 1d | 2.2.2 | Referral tracking | |
| 4.5.2 | Define referral reward: 1 free month per paying referral (applied as Stripe credit) | 0.25d | 4.5.1, 2.10.4 | Reward logic | |
| 4.5.3 | Build referral dashboard widget: "You've referred X people — X are paying — you've earned X free months" | 0.5d | 4.5.2 | Referral widget | |
| 4.5.4 | Trigger referral share prompt at high-satisfaction moments: offer accepted, strong NPS, 60-day mark | 0.5d | 4.5.1 | Prompt triggers | |
| **Subtotal** | | **2.25d** | | | |

---

### 4.6 Marketing Site

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.6.1 | Build marketing homepage: hero, feature sections, testimonials, pricing table, CTA | 2d | 2.10.9 | `/` home page | 🔴 |
| 4.6.2 | Build pricing page: tier comparison table, annual toggle, FAQ | 0.75d | 4.6.1 | `/pricing` | |
| 4.6.3 | Build persona landing pages: "For IT Executives", "For Job Seekers Returning to Work", etc. | 2d | 4.6.1 | 3+ landing pages | |
| 4.6.4 | SEO: metadata, structured data (JSON-LD), sitemap, robots.txt | 0.5d | 4.6.1 | SEO config | |
| 4.6.5 | Blog infrastructure: MDX-based, initial 3 posts targeting "CIO job search," "laid off executive," "passive job seeker" | 1d | 4.6.1 | Blog live with 3 posts | |
| **Subtotal** | | **6.25d** | | | |

---

### 4.7 Analytics & Growth Tooling

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.7.1 | Integrate PostHog (or Mixpanel): track key events — signup, onboard complete, chat session, draft sent, upgrade | 1d | 2.1.2 | Analytics events | |
| 4.7.2 | Build internal admin dashboard: MRR, churn, active users, briefing delivery rate, scan success rate | 1.5d | 4.7.1, 2.10.4 | Admin dashboard | |
| 4.7.3 | A/B testing infrastructure: feature flag system for testing onboarding variants, pricing, upgrade CTAs | 1d | 2.1.1 | Feature flag system | |
| 4.7.4 | Automated churn risk detection: flag users with declining Momentum Score + no login in 5 days → trigger win-back email | 0.75d | 3.6.2, 1.5.5 | Churn alert worker | |
| **Subtotal** | | **4.25d** | | | |

---

### 4.8 Outplacement Partnership Integration

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.8.1 | Define partnership model: referral fee vs. white-label API vs. bulk seat licensing | 0d (business decision) | — | Decision documented | 🔴 |
| 4.8.2 | Build bulk seat provisioning: firm admin can create N user accounts, assign to clients | 1.5d | 4.1.4 | Bulk provisioning API | |
| 4.8.3 | Build firm admin portal: user list, usage stats, billing summary | 1d | 4.8.2 | Firm admin portal | |
| 4.8.4 | Build API for firm-side integration: `POST /api/v1/enterprise/provision-user` | 0.75d | 4.8.2 | Enterprise API | |
| 4.8.5 | Legal: draft outplacement partnership agreement template — data processing, white-label terms | 0d (legal review) | — | Agreement template | 🔴 |
| **Subtotal** | | **3.25d** | | | |

---

### 4.9 Phase 4 QA + Launch

| ID | Task | Effort | Depends On | Deliverable | CP |
|---|---|---|---|---|---|
| 4.9.1 | Coach tier end-to-end test: invite client, view dashboard, white-label briefing delivery | 1d | All Phase 4 | Test results | 🔴 |
| 4.9.2 | Penetration test (basic): OWASP top 10 self-audit, RLS boundary test, JWT spoofing attempt | 1d | All Phase 4 | Security checklist | 🔴 |
| 4.9.3 | Fix top bugs from Phase 4 QA | 2d | 4.9.1, 4.9.2 | Bug fixes | |
| 4.9.4 | Outplacement firm outreach: identify 5 target firms, send partnership pitch | 0d (sales effort) | 4.8.3 | Pipeline of prospects | |
| 4.9.5 | Testimonial collection: identify 5 users who have landed roles, request written testimonials | 0d (async) | — | Testimonials for site | |
| **Subtotal** | | **4.0d** | | | |

**Phase 4 Total: 38.0d ≈ 8 weeks**

---

---

## Cross-Phase Work

These tasks run in parallel with the phases above and are not phase-specific.

| ID | Task | Effort | Phase | Notes |
|---|---|---|---|---|
| X.1 | Privacy policy draft (legal counsel review recommended) | 1d | Before Phase 2 launch | Required before Stripe billing goes live |
| X.2 | Terms of service draft | 0.5d | Before Phase 2 launch | Required before Stripe billing goes live |
| X.3 | Data Processing Agreements with Anthropic, Stripe, Resend, Google | 0.5d | Before Phase 2 launch | GDPR requirement |
| X.4 | Cookie consent banner — EU-compliant, non-blocking | 0.5d | Before Phase 2 launch | GDPR requirement |
| X.5 | GDPR account deletion flow — all PII deleted within 30 days | 0.5d | Phase 2 | Required for EU users |
| X.6 | Data export flow — user can download pipeline + contacts as CSV | 0.25d | Phase 2 | GDPR Art. 20 right to portability |
| X.7 | Ongoing prompt engineering and refinement | Continuous | All phases | Budget 0.5d/week |
| X.8 | Beta user qualitative interviews — monthly | Continuous | All phases | 1 hour/month, not tracked as dev effort |

---

## Dependency Map — Critical Path

The following chain represents the longest dependency path. Any slip here directly delays the launch date.

```
1.1.2 (Supabase project)
  → 1.2.1 (users table)
    → 1.2.11 (RLS)
      → 1.2.13 (RLS validation)
        → 1.3.9 (scanner integration test)
          → 1.4.3 (scan job queue)
            → 1.5.1 (briefing context assembler)
              → 1.5.3 (Claude briefing call)
                → 1.5.6 (email template)
                  → 1.5.7 (end-to-end briefing test)  ← Phase 1 gate
                    → 2.7.1 (chat system prompt)
                      → 2.7.4 (streaming API route)
                        → 2.7.10 (tool use integration test)
                          → 2.10.3 (Stripe webhooks)
                            → 2.12.8 (Phase 2 bug fixes)  ← Phase 2 gate / first customer
```

---

## Key Decision Gates

| Gate | Timing | Decision Required |
|---|---|---|
| **D1 — Phase 1 Go/No-Go** | End of Week 6 | Do beta users find the briefing valuable enough to pay? |
| **D2 — First Charge** | End of Week 16 | Trial conversion rate ≥ 30%? Continue to Phase 3 |
| **D3 — Executive Tier Bet** | End of Week 20 | Are users requesting Interview Prep / Salary Intelligence? |
| **D4 — B2B Channel** | End of Week 28 | Is direct acquisition CAC < 3x ARPU? If yes, stay direct. If no, accelerate outplacement. |
| **D5 — Solo vs. Hire** | End of Week 20 | Is Phase 3 completion blocked by bandwidth? Consider one contract hire. |

---

## Effort Summary by Work Type

| Work Type | Estimated Effort |
|---|---|
| Infrastructure & DevOps | 14d |
| Database & Data Modeling | 10d |
| Claude API integration (all patterns) | 18d |
| Frontend (UI, components, UX) | 38d |
| Background workers (cron, email, scoring) | 22d |
| Billing (Stripe) | 8d |
| Security & compliance | 8d |
| QA & testing | 14d |
| Marketing & growth | 10d |
| Partnerships & B2B | 8d |
| Contingency / bugs / polish | 8d |
| **Total** | **158d** |

---

## Risk-Adjusted Timeline

| Risk | Probability | Impact on Timeline | Mitigation |
|---|---|---|---|
| browserless.io rate limits or pricing change | Medium | +1 week | Self-hosted fallback documented |
| Playwright scanner blocked by target sites | High | Ongoing | Alert user, manual check fallback |
| Claude API behavior changes on outreach drafts | Medium | +1 week | Prompt versioning, regression test set |
| Resume .docx export formatting issues | Medium | +3 days | Expand QA matrix, test more templates |
| Google OAuth consent screen rejected by Google | Low | +2 weeks | Start OAuth application in Phase 2, not Phase 3 |
| Solo bandwidth (illness, founder other duties) | High | +4–6 weeks | Build in 15% schedule buffer — actual elapsed time 40 weeks, not 32 |

---

*Document owner: Richard Rothschild*
*Version: 1.0 — 2026-04-26*
*Companion document: product-requirements.md*
