# Product Requirements Document

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: monthly
Source of truth: yes

## Starting Monday — AI Career Search Platform
### Version 1.1 — 2026-04-27

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Target Personas](#3-target-personas)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Schema](#6-database-schema)
7. [Claude API Integration](#7-claude-api-integration)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Security & Compliance](#9-security--compliance)
10. [Performance & Scalability](#10-performance--scalability)
11. [Operational Requirements](#11-operational-requirements)
12. [Pricing & Tier Structure](#12-pricing--tier-structure)
13. [Success Metrics](#13-success-metrics)
14. [Out of Scope — V1](#14-out-of-scope--v1)
15. [Open Questions & Risks](#15-open-questions--risks)

---

## 1. Executive Summary

Starting Monday is a multi-tenant SaaS platform that functions as an AI-powered career search partner for mid-career through executive-level professionals. It is the only product in the market purpose-built for the $300K+ executive job seeker — CIO, CTO, CHRO, VP Transformation — where the entire competitive landscape has abandoned the segment. It simultaneously serves six additional personas at lower price points through a tiered model, where the executive brand elevates the entire product.

The platform combines automated company monitoring, triggering event intelligence, AI-drafted outreach, pipeline management, recruiter relationship scoring, and daily accountability briefings into a single product that replaces both human career coaches (at 10–20x lower cost) and ad-hoc tool stacks (spreadsheets, job boards, LinkedIn manual monitoring).

The product is powered by Anthropic's Claude API and designed for professionals earning $80K–$500K who are either actively searching or passively watching the market for the right opportunity. The business model is monthly subscription with four tiers ranging from $49 to $599/month.

**Positioning:** "We get you to Starting Monday." — the outcome-oriented brand promise. Aspirational, emotionally resonant, universally understood. Names the outcome (landing the job), not the features.

**Target state:** $25,000 MRR within 18–24 months of MVP launch, reached through a mix of direct acquisition (SEO, LinkedIn, executive communities), outplacement firm partnerships, and word-of-mouth from placed candidates.

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> "The AI recruiter who works exclusively for you — not for the company trying to fill the role."

**Primary positioning:** Starting Monday explicitly owns the executive job search category ($300K+ compensation, CIO/CTO/VP level). No competitor serves this segment adequately. All other tiers serve the same product at accessible price points — the executive brand elevates them. This positioning is non-negotiable in all marketing copy, onboarding language, and product UX.

**Competitive positioning vs. AI matching marketplaces:** Two-sided AI recruitment platforms wait for an employer to post a mandate and match candidates against it. Starting Monday operates before that moment — monitoring companies for triggering events, surfacing opportunities before searches are launched, coaching users to create the conditions for employer interest. The acquisition copyline for users who have already encountered matching tools: "They wait for an employer to want you. Starting Monday gets you there first." This framing must appear explicitly in all paid and organic acquisition copy targeting active job seekers.

**Privacy positioning — no employer network:** Starting Monday has no employer-side network. A user's search is never visible to any employer unless the user initiates contact. No matching algorithm routes their profile to a hiring brief. This is a material differentiator for executives in confidential searches and must be a marketed claim — not buried in the privacy policy. Copyline: "Your search stays yours. No employer network. No matching marketplace. No one sees your profile until you want them to."

### 2.2 Primary Goals

| Goal | Metric | Timeframe |
|---|---|---|
| Reach paying customers | First 10 customers | Month 2–3 post-launch |
| Prove retention | 60-day retention ≥ 70% | Month 4–6 |
| Reach initial MRR | $5,000 MRR | Month 6 |
| Reach growth MRR | $25,000 MRR | Month 18–24 |
| Prove NPS | NPS ≥ 50 | Ongoing |

### 2.3 Design Principles

1. **Work passively, surface actively.** The platform should produce value even when the user is not logged in. The daily briefing delivers value with zero user effort.
2. **Sound human, not like a bot.** All AI-generated output — briefings, outreach drafts, coaching responses — must pass a "would a sharp executive write this?" test. Anti-AI-copy guardrails are non-negotiable.
3. **Pipeline over applications.** The product treats job searching as relationship management, not form submission. The UI reinforces this mental model.
4. **Show momentum, not just activity.** Users lose hope when progress feels invisible. Every week, the product makes search velocity visible and quantifiable.
5. **Earn the subscription, every week.** The platform must deliver at least one concrete "I couldn't have done that without this" moment per week to hold the subscription.

---

## 3. Target Personas

### 3.1 Persona Summary Table

| Persona | Experience | Situation | WTP/Month | Duration | LTV |
|---|---|---|---|---|---|
| Transformation Executive | 18–25 yrs | In transition from $250K–$500K role | $199–349 | 3–6 mo | $600–2,100 |
| VP/Director Candidate | 12–18 yrs | Employed, targeting VP first-time | $99–199 | 6–12 mo | $600–2,400 |
| Mid-Career Climber | 3–8 yrs | Active search, first real market experience | $49–99 | 2–5 mo | $100–495 |
| Intelligence Looker | 5–20 yrs | Employed, open to right opportunity | $49–99 | 12–24 mo | $588–2,376 |
| Laid-Off Professional | Any | Urgent search, high anxiety, severance window | $99–199 | 3–9 mo | $300–1,800 |
| Career Pivoter | 7–15 yrs | Transferable skills, wrong job titles | $79–129 | 6–12 mo | $474–1,548 |
| Returning Professional | 8–20 yrs | 2–5 yr break, cold network, gap anxiety | $79–129 | 4–9 mo | $316–1,161 |

### 3.2 Persona Details

#### Persona 1 — Transformation Executive
- **Title examples:** CIO, CTO, VP IT, VP Engineering
- **Entry trigger:** Layoff, package deal, quiet looking
- **Search style:** Highly targeted — knows the 20–30 companies, has recruiter relationships
- **Pain points:** Too many balls in the air. Misses follow-ups. Inconsistent outreach quality. Pays $5–25K for a human coach but doesn't love the ROI.
- **Required features:** Company monitoring, outreach drafting, follow-up manager, recruiter tracker, daily briefing, salary intelligence
- **Tier target:** Executive ($499/month)

#### Persona 2 — VP/Director Candidate
- **Title examples:** Senior Manager, Director targeting VP
- **Entry trigger:** Employed, ready for level jump, has never run VP-level search
- **Search style:** Exploratory — unclear which companies to target, nervous about cold outreach
- **Pain points:** Doesn't know the hidden job market. No VP-level network. Imposter syndrome. Applying to postings and hearing nothing.
- **Required features:** Company discovery engine, positioning coach, outreach drafting, interview prep, progress analytics
- **Tier target:** Search or Executive ($199–499/month)

#### Persona 3 — Mid-Career Climber
- **Title examples:** IC or first-time manager, 3–8 years
- **Entry trigger:** Ready to leave first or second job
- **Search style:** Broad — no target list, applying to anything interesting
- **Pain points:** No recruiter relationships. Resume disappears into ATS. Doesn't know how to write a compelling LinkedIn message.
- **Required features:** Company discovery, resume tailoring, outreach templates, interview prep, LinkedIn optimizer, application tracker
- **Tier target:** Search ($199/month)

#### Persona 4 — Intelligence Looker
- **Title examples:** Any employed professional, 5–20 years
- **Entry trigger:** Comfortable but knows the market has moved. Would leave for 30% comp bump.
- **Search style:** Zero-effort — wants to be alerted, not to search
- **Pain points:** Job boards require active effort. LinkedIn alerts are low quality. Missing opportunities because not watching.
- **Required features:** Company watchlist monitoring, match alerts, minimal weekly input, market intelligence digest
- **Tier target:** Intelligence ($49/month)
- **LTV note:** Highest LTV customer — stays 12–24 months with minimal churn risk

#### Persona 5 — Laid-Off Professional
- **Title examples:** Any level, $80K–$400K
- **Entry trigger:** Just got the call — or anticipates it within 30 days
- **Search style:** Scattershot initially, needs structure and accountability
- **Pain points:** Overwhelmed. Applying to everything. Human coaches expensive and slow. Needs a daily plan.
- **Required features:** Onboarding wizard (20-min profile build), daily briefing, pipeline manager, outreach drafting, progress analytics
- **Tier target:** Search or Executive ($199–499/month)

#### Persona 6 — Career Pivoter
- **Title examples:** Finance / consulting / operations professional targeting tech, product, RevOps
- **Entry trigger:** Decided to change fields, skills are real, story doesn't match job titles
- **Search style:** Narrow — knows what they want but can't get through the filter
- **Pain points:** ATS keyword mismatch. Can't get warm intros in target field. Resume tells the wrong story.
- **Required features:** Positioning coach, resume tailoring (translates cross-field), company discovery, outreach templates, interview prep
- **Tier target:** Search ($199/month)

#### Persona 7 — Returning Professional
- **Title examples:** 8–20 years of prior experience, 2–5 year break
- **Entry trigger:** Ready to return to work after caregiving, health, or personal circumstances
- **Search style:** Cautious — network is cold, market has changed, gap anxiety is high
- **Pain points:** Network has gone cold. Hiring market changed. Gap dominates resume. Outdated sense of what roles exist and what they pay.
- **Required features:** Gap positioning coach, network re-activation outreach templates, company discovery, market intelligence, LinkedIn optimizer
- **Tier target:** Search ($199/month)

---

## 4. Feature Requirements

Features are organized by tier availability: Core (all tiers), Growth (Active and above), Executive (Executive tier only), Coach (Coach tier only).

---

### 4.1 Feature 1 — Company Watchlist + Career Page Monitoring
**Tier:** Core (all tiers, limits vary)
**Priority:** P0 — launch blocker

#### Description
Users add target companies to a personal watchlist. The platform automatically checks each company's career page on a scheduled cadence, detects new job postings matching the user's profile, scores them for relevance using Claude, and sends an alert within 24 hours of a new match appearing.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F1.1 | User can add companies by name, URL, or sector — the platform auto-resolves the career page URL |
| F1.2 | Monitor tier: up to 10 companies. Active tier: up to 30 companies. Executive tier: up to 50 companies. |
| F1.3 | Scan frequency: Monitor tier — twice weekly. Active tier — three times weekly. Executive tier — daily. |
| F1.4 | Each scan result is scored 1–10 by Claude against the user's profile. Only scores ≥7 trigger an alert. |
| F1.5 | Alerts are sent via email with: company name, role title, one-sentence AI summary of why it matches, direct link to the job posting, and a CTA to draft outreach or add to pipeline. |
| F1.6 | Users can view scan history for any company: when scanned, what was found, what was scored, what was sent. |
| F1.7 | Users can adjust per-company relevance threshold (default 7, range 5–10) |
| F1.8 | If a career page URL breaks (404, redirect), the system flags it and notifies the user within 48 hours |
| F1.9 | Users can archive companies from the watchlist without deleting historical data |
| F1.10 | Scan results are deduplicated — the same role does not trigger a second alert unless it has been updated significantly |

#### Technical Notes
- Playwright (via browserless.io) executes scans in isolated browser contexts
- Page content is extracted as cleaned text; standard HTML parsing applied first, Playwright fallback for JS-rendered pages
- Claude Haiku scores each hit (low cost, high throughput)
- Scan jobs are queued and distributed across worker pool — no scan runs on the main web server
- IT Leaderboard and sites requiring authentication login are **explicitly excluded** from V1 — credential-based scraping violates ToS and cannot be productized without a data partnership agreement

#### Acceptance Criteria
- [ ] Scan completes within 5 minutes of scheduled trigger time
- [ ] Alert email arrives within 24 hours of a new matching role going live on the career page
- [ ] False positive rate (irrelevant alerts) < 15% over 30-day rolling window
- [ ] Scan failure (Playwright crash or blocked) is logged and surfaced to user within 24 hours
- [ ] Adding a company to the watchlist and receiving the first scan result requires < 2 minutes of user effort

---

### 4.2 Feature 2 — AI Recruiter Chat
**Tier:** Active and above
**Priority:** P0 — launch blocker

#### Description
A conversational interface powered by Claude with full awareness of the user's search — their profile, pipeline, every contact, every follow-up date, and recent scan results. The assistant can answer questions, draft messages, give strategic advice, and update the pipeline directly via tool use (no manual re-entry required).

#### Functional Requirements

| ID | Requirement |
|---|---|
| F2.1 | Chat interface is a persistent conversation thread — messages are stored and context is maintained across sessions |
| F2.2 | At the start of each conversation, the full pipeline state is injected into the Claude system prompt — company list, contact list, follow-up calendar, recent scan results, user profile |
| F2.3 | Claude can execute pipeline updates via tool use: update_company_stage, schedule_follow_up, add_company, add_contact, get_scan_history |
| F2.4 | Tool use results are immediately reflected in the database and visible in the pipeline view without page refresh |
| F2.5 | Chat responses are streamed — the UI renders tokens as they arrive, not after full completion |
| F2.6 | Users can @-mention a specific company or contact name and the system inserts the relevant record into context |
| F2.7 | The system distinguishes between "pipeline actions" (tool calls that modify data) and "conversation actions" (advice, drafts) — pipeline actions are logged with a timestamp and user attribution |
| F2.8 | Users can copy any AI-drafted text directly from the chat with one click |
| F2.9 | The conversation can be cleared (new search session) without losing pipeline data |
| F2.10 | Anti-AI-copy guardrails are active in chat — see Feature 5 (Outreach Drafting) for the full banned-phrase list |

#### Tool Definitions (Claude API function_calling)

```
update_company_stage(company_id, new_stage, notes)
schedule_follow_up(contact_id, due_date, action_description)
add_company(name, url, sector, fit_score, notes)
add_contact(name, firm, title, channel, notes)
get_scan_history(company_id, limit)
draft_outreach(contact_id, message_type, context_notes)
```

#### Technical Notes
- Model: claude-opus-4-7 for chat (quality matters here — users pay for executive judgment, not commodity output)
- System prompt is rebuilt at the start of each session with a fresh snapshot of pipeline state
- Context window budget: 100K tokens system prompt + 50K tokens conversation history. Older messages are summarized and compressed when approaching limit.
- Streaming via the Anthropic SDK streaming API — `anthropic.messages.stream()`
- Conversation messages stored as JSONB in PostgreSQL — no separate vector store in V1

#### Acceptance Criteria
- [ ] Chat responds within 3 seconds (first token) for a standard pipeline query
- [ ] Tool use correctly updates the database — pipeline view reflects the change immediately
- [ ] Conversation context is maintained across browser sessions (closing and reopening the tab)
- [ ] The assistant never hallucinates a company or contact that is not in the user's pipeline
- [ ] Streamed responses render without visual jank on low-end laptops

---

### 4.3 Feature 3 — Daily Briefing Email
**Tier:** Active and above (Monitor tier receives Weekly Digest instead)
**Priority:** P0 — strongest retention driver in the product

#### Description
Every weekday morning at the user's local time (default 7:30 AM, configurable), the platform sends a structured email briefing with 3–5 prioritized actions. The briefing is generated fresh each morning by Claude using the current pipeline state. No login required to receive value.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F3.1 | Briefing is generated Monday–Friday at user's configured send time (default 7:30 AM local) |
| F3.2 | Briefing content is drawn from: overdue follow-ups, pending pipeline actions, new scan matches from the prior 24 hours, and Momentum Score changes |
| F3.3 | Each briefing item includes: the action, the reason it's prioritized, and an optional pre-drafted message the user can copy-paste |
| F3.4 | Briefing is sent via email — HTML with plain-text fallback — with reply-to disabled (outbound only in V1) |
| F3.5 | Users can configure: send time, days of week, and whether to include draft text in the email |
| F3.6 | If there are no actions due (genuinely empty pipeline state), the briefing is suppressed — no "nothing to report" email |
| F3.7 | Briefing emails contain tracking pixels to measure open rates per user (used for engagement scoring, not sold to third parties) |
| F3.8 | Users can pause daily briefings without canceling their subscription |
| F3.9 | Briefing email includes one-click deep links to the specific pipeline item — clicking opens the web app at the relevant record |
| F3.10 | Subject lines are dynamic and include the most urgent item: "Flexport intro is 8 days stale — here's your follow-up" |

#### Technical Notes
- Cron job runs on Railway at 6:00 AM UTC and determines which users should receive a briefing in the next 90 minutes
- Claude generates briefing content in one call per user — no streaming needed for email generation
- Resend handles transactional email delivery and bounce management
- Template: HTML email with structured sections, single-column layout, 600px max width, dark mode compatible
- Cost control: cap at 800 tokens per briefing generation call

#### Acceptance Criteria
- [ ] Briefing arrives within ±15 minutes of configured send time
- [ ] Briefing accurately reflects current pipeline state (data freshness < 30 minutes at generation time)
- [ ] Subject line is unique and action-oriented — never generic ("Your Daily Briefing")
- [ ] Email renders correctly on Gmail, Outlook (desktop), Apple Mail, and mobile Gmail
- [ ] Open rate ≥ 60% in weeks 1–4 (baseline for habit formation)

---

### 4.4 Feature 4 — Pipeline & Follow-Up Manager
**Tier:** Core (all tiers)
**Priority:** P0 — launch blocker

#### Description
A visual pipeline for tracking companies, applications, and contacts through the job search lifecycle. Automated follow-up reminders based on user-set or AI-suggested cadences. Every recruiter and executive contact tracked with status and next action.

#### Functional Requirements

**Company Pipeline**

| ID | Requirement |
|---|---|
| F4.1 | Company stages: Watching → Researching → Applied → Responded → Interviewing → Offer → Closed (hired or passed) |
| F4.2 | Each company record contains: name, sector, fit score (1–10), career page URL, notes, current stage, and linked contacts |
| F4.3 | Users can move companies between stages via drag-and-drop or from the chat interface |
| F4.4 | Stale entries are automatically flagged: any company in "Applied" with no update in 14 days gets a visual flag and appears in the next daily briefing |
| F4.5 | Companies can be archived with a reason (no role, wrong fit, hired elsewhere) — archived data is retained for 12 months |
| F4.6 | Pipeline view has both Kanban board and table list views — user can toggle between them |

**Contact Tracker**

| ID | Requirement |
|---|---|
| F4.7 | Contact record fields: name, title, firm, channel (LinkedIn/email/phone), contacted date, response status, follow-up date, notes |
| F4.8 | Contact statuses: Not Contacted → Connection Pending → Awaiting Response → Active → Meeting Scheduled → Closed |
| F4.9 | Follow-up reminders are automatically generated at D+7 if no response is logged (configurable per contact) |
| F4.10 | Users can link contacts to companies — a contact at "Simpplr" appears in the Simpplr company record |
| F4.11 | Follow-up date can be set manually or the system suggests a date based on the contact type (recruiter vs. executive vs. warm referral) |
| F4.12 | Overdue follow-ups (past follow-up date with no logged response) surface first in the daily briefing |

**Application Tracker**

| ID | Requirement |
|---|---|
| F4.13 | Users can log a job application directly — role title, company, application method (portal, email, referral), date applied |
| F4.14 | Applications are linked to the company pipeline record |
| F4.15 | No auto-scraping of ATS portals in V1 — manual entry only |

#### Acceptance Criteria
- [ ] A new user can build a 10-company watchlist and a 5-contact tracker within 15 minutes of signing up
- [ ] Follow-up reminders fire within 24 hours of the due date
- [ ] Stale flags appear on the correct records within 24 hours of the staleness threshold being crossed
- [ ] Kanban board updates in real time without page refresh after a stage change

---

### 4.5 Feature 5 — Outreach Drafting
**Tier:** Active and above
**Priority:** P0 — highest-frequency AI feature

#### Description
On-demand drafting of cold emails, LinkedIn messages, follow-ups, and thank-you notes. Learns the user's communication voice over time. Applies strict anti-AI-copy guardrails — output sounds like a sharp professional, not a language model.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F5.1 | Drafting modes: cold email, LinkedIn connection request, LinkedIn message (post-connect), follow-up (after no response), follow-up (after meeting), thank-you note (post-interview) |
| F5.2 | User inputs: recipient name, title, firm, relationship context (cold / warm intro / mutual connection), goal of the message, any specific points to include |
| F5.3 | Claude generates a draft with inline notes on strategic choices ("I led with the Flexport connection because...") |
| F5.4 | User can request revisions with natural language: "make it shorter," "less formal," "add a specific ask" |
| F5.5 | Draft history is saved and linked to the contact record |
| F5.6 | User can mark a draft as "sent" which automatically logs the contact date and sets a follow-up reminder |
| F5.7 | Anti-AI-copy guardrails are enforced in the system prompt (see below) — no banned phrases in output |
| F5.8 | Subject line is always generated with the body — never omitted for email drafts |
| F5.9 | Length targets: LinkedIn message ≤ 300 characters. Cold email ≤ 200 words. Follow-up ≤ 150 words. |
| F5.10 | Platform learns tone preferences from prior drafts the user approved — style profile is maintained per user |

#### Anti-AI-Copy Guardrails (System Prompt Enforcement)

The following phrases are banned from all outreach output:

**Banned openings:**
- "I hope this message finds you well"
- "I wanted to reach out"
- "I'm excited to connect"
- "I came across your profile"
- "As a fellow [profession]"

**Banned transitions:**
- "I believe my background aligns well with"
- "I would love to explore"
- "I'd be happy to discuss"
- "Please feel free to reach out"
- "I look forward to hearing from you"

**Banned closings:**
- "Best regards" (use nothing, or the user's standard sign-off)
- "I appreciate your time and consideration"
- "Thank you for your consideration"
- Anything ending with an exclamation mark

**Structural rules:**
- No em dashes (—) anywhere — replace with a period, comma, or restructured sentence
- No bullet points in outreach messages
- Opening sentence must be about the recipient, not the sender
- No paragraph longer than 3 sentences
- No sentence that starts with "I" as the first word of the message
- Ask must be specific and low-friction: "15 minutes" not "some time"

#### Acceptance Criteria
- [ ] No banned phrase appears in any generated draft
- [ ] A draft passes the "would a senior executive write this?" review test 90% of the time (manual review sample)
- [ ] Draft is generated within 5 seconds
- [ ] Marking a draft as sent correctly logs the contact date and follow-up reminder
- [ ] User can request up to 3 revisions of any draft without the UI becoming cumbersome

---

### 4.6 Feature 6 — Company Discovery Engine
**Tier:** Active and above
**Priority:** P1 — required for Personas 2, 3, 6, 7 who don't arrive with a target list

#### Description
For users who don't have a target company list: the platform generates a ranked, reasoned list of companies to watch based on their profile, sector preferences, growth stage preferences, and current hiring patterns. Without this, the product only works for users who already know their targets.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F6.1 | User inputs: target role titles, preferred sectors (up to 5), preferred company size (startup / mid-market / enterprise), geography, comp range |
| F6.2 | Claude generates a ranked list of 15–25 companies with a one-sentence rationale for each |
| F6.3 | Each company suggestion includes: name, estimated headcount, funding stage, why it fits the user's profile |
| F6.4 | User can accept individual companies (adds to watchlist), reject them (removes from suggestions), or ask for alternatives |
| F6.5 | The discovery engine can be re-run after profile changes |
| F6.6 | Accepted companies are added to the watchlist immediately and scanned on next scheduled scan run |
| F6.7 | Discovery results are based on Claude's training data — not real-time web search in V1 |
| F6.8 | User can specify "show me companies like [Company X]" to seed discovery |

#### Technical Notes
- V1 uses Claude's built-in knowledge — no live web search, no third-party hiring data API
- V2 consideration: integrate with Crunchbase API for funding stage and growth signals

#### Acceptance Criteria
- [ ] A user with a blank watchlist can receive 15+ company suggestions within 2 minutes of providing their profile inputs
- [ ] At least 80% of suggestions are companies the user has heard of (sanity check for quality)
- [ ] Accepted companies appear in the watchlist immediately

---

### 4.7 Feature 7 — Resume Tailoring
**Tier:** Active and above
**Priority:** P1

#### Description
User pastes a job description. The platform rewrites the user's resume bullets to emphasize the most relevant experience using the job's exact language — without fabricating anything. The result survives ATS keyword filters and saves 30–45 minutes per application.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F7.1 | User inputs: their base resume (stored in profile) and the target job description (pasted per-use) |
| F7.2 | Platform outputs: a tailored version of the resume with modified bullets aligned to JD keywords |
| F7.3 | The system clearly marks which bullets were modified (visual diff highlighting) |
| F7.4 | The system will not add qualifications, titles, dates, or experiences that are not in the base resume |
| F7.5 | Output includes an ATS keyword match score — percentage of high-signal JD keywords present in the tailored resume |
| F7.6 | User can accept individual bullet changes or revert to the original |
| F7.7 | Tailored versions are saved and associated with the relevant company record in the pipeline |
| F7.8 | User can download the tailored resume as a .docx file — not just on-screen text |
| F7.9 | Base resume can be updated in the user profile; all future tailoring sessions use the updated base |

#### Technical Notes
- .docx export requires a server-side library (docx or similar Node.js package)
- Resume stored as structured JSON (not raw text) to support section-level editing
- ATS score computed by extracting key noun phrases from the JD and checking coverage — heuristic, not API-dependent

#### Acceptance Criteria
- [ ] Tailored resume contains no fabricated content (zero hallucination of titles, companies, or dates)
- [ ] ATS keyword match score shows measurable improvement from base resume to tailored version
- [ ] .docx download produces a cleanly formatted file that opens in Microsoft Word without layout errors
- [ ] A user can complete a full tailoring session in under 10 minutes

---

### 4.8 Feature 8 — LinkedIn Profile Optimizer
**Tier:** Active and above
**Priority:** P1 — killer onboarding hook; users see value in first 10 minutes

#### Description
User pastes their LinkedIn About section, headline, and top 3 experience descriptions. The platform provides a scored critique and rewrites each section for their target role and audience. Immediate, concrete value at onboarding.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F8.1 | User inputs: current LinkedIn headline, About section, top 3 experience descriptions, and target role/title |
| F8.2 | Platform outputs a scored critique: headline score (1–10), About score (1–10), experience scores |
| F8.3 | Critique includes specific issues: "Your headline leads with your current title, not your value proposition" |
| F8.4 | Platform rewrites each section with a ready-to-paste version |
| F8.5 | Rewrites are tailored to the user's target role — a CIO targeting PE-backed growth companies gets a different tone than a mid-career data analyst |
| F8.6 | User can request up to 3 rounds of revision on any section |
| F8.7 | Optimized sections are saved in the user profile as a reference |
| F8.8 | This feature is accessible in the onboarding flow — not buried post-setup |
| F8.9 | The LinkedIn Optimizer is available as a free public-facing tool at startingmonday.app/optimize — no account required. Results are displayed in-session. A "Save your results and start your free trial" CTA appears after the analysis completes. No personal data is collected unless the user creates an account. This is the primary top-of-funnel acquisition hook for the executive and intelligence looker personas — capturing users at the exact moment they update their LinkedIn profile to signal they are beginning a search. |

#### Acceptance Criteria
- [ ] User receives scored critique and rewrite within 15 seconds
- [ ] Rewrite quality: at least 80% of beta users rate the rewrite as better than their original
- [ ] Feature is reachable in ≤ 2 clicks from the post-signup landing page
- [ ] Free public optimizer at startingmonday.app/optimize delivers a complete scored critique with no account or email required

---

### 4.9 Feature 9 — Interview Prep Coach
**Tier:** Executive tier only
**Priority:** P1

#### Description
When an interview is scheduled, the user inputs the company, role, and interviewer names. The platform briefs them: company background, likely questions for the role, how to position their specific background, what to ask, what to avoid. Updated for each interview round.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F9.1 | User inputs: company name, role title, interview date, interview type (phone screen / panel / executive / case), interviewer name(s) if known |
| F9.2 | Platform generates a structured interview brief: company summary, role context, likely questions, recommended positioning, questions to ask, landmines to avoid |
| F9.3 | Each round of an interview process gets its own brief — early-stage phone screens and executive panel briefs are differentiated |
| F9.4 | If the company is in the user's pipeline, the brief incorporates any notes the user has logged about that company |
| F9.5 | Brief includes 5–8 likely interview questions with recommended answer frameworks (STAR format for behavioral, concise for situational) |
| F9.6 | Brief includes 5 questions the user can ask the interviewer, calibrated to seniority |
| F9.7 | User can do a practice Q&A session in the chat interface — ask and receive real-time feedback on their answer |
| F9.8 | Brief is delivered as a formatted email 24 hours before the interview and is also accessible in-app |
| F9.9 | After the interview, the user can log notes and the platform generates a thank-you note draft |

#### Acceptance Criteria
- [ ] Brief is generated in under 30 seconds
- [ ] Questions in the brief are role-specific — a CIO brief and an engineering manager brief are materially different
- [ ] Practice Q&A mode gives specific, constructive feedback (not generic "great answer!" responses)
- [ ] Thank-you note draft is generated within 2 minutes of the user logging post-interview notes

---

### 4.10 Feature 10 — Positioning Coach
**Tier:** Active and above
**Priority:** P1 — required for Personas 2, 6, 7

#### Description
Interactive coaching for users who need to frame a career pivot, a level jump, or a gap. Multi-turn dialogue that builds a refined positioning statement the user can deploy consistently across outreach, interviews, and their LinkedIn profile.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F10.1 | Entry modes: career pivot, level jump (e.g., Director → VP), gap explanation (caregiving, health, personal) |
| F10.2 | Multi-turn dialogue — Claude asks clarifying questions before generating a positioning statement |
| F10.3 | Output: a 2–3 sentence "positioning statement" the user can use in LinkedIn About, outreach, and interviews |
| F10.4 | Coaching explores: what the user has done, what they want to do, what the bridge is, and what objections they'll face |
| F10.5 | The positioning statement is saved to the user profile and referenced in outreach drafts automatically |
| F10.6 | Users can return to refine the statement as the search evolves |
| F10.7 | Gap coaching includes specific language for addressing the gap in an interview — not just LinkedIn framing |

#### Acceptance Criteria
- [ ] User can complete a positioning session in under 20 minutes
- [ ] Output is a specific, personalized statement — never generic ("I bring diverse experience to...")
- [ ] Positioning statement is reflected in the system prompt for future outreach drafts automatically

---

### 4.11 Feature 11 — Weekly Progress Report
**Tier:** Active and above
**Priority:** P2

#### Description
Every Sunday: a structured summary of search velocity — outreach sent, responses received, interviews scheduled, pipeline movement — benchmarked against typical searches at the user's level. Creates accountability without a human coach.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F11.1 | Delivered every Sunday at the user's configured send time |
| F11.2 | Metrics reported: contacts made, response rate, interviews scheduled, companies added, pipeline stage changes |
| F11.3 | Each metric is benchmarked: "2 responses this week (industry benchmark: 1–2 at your level)" |
| F11.4 | Report includes the Momentum Score trend (this week vs. last 4 weeks) |
| F11.5 | Report identifies the top 3 recommended actions for the coming week based on pipeline state |
| F11.6 | Users can opt out of Weekly Progress Reports without canceling their subscription |
| F11.7 | Report is emailed and accessible in-app |

#### Acceptance Criteria
- [ ] Report is delivered within 1 hour of configured send time
- [ ] Benchmarks are appropriate to the user's tier and experience level
- [ ] Users who receive weekly reports have measurably higher 60-day retention than those who opt out (track from launch)

---

### 4.12 Feature 12 — Market Intelligence Digest
**Tier:** Monitor tier (weekly), Active and above (monthly in V1, weekly in V2)
**Priority:** P2

#### Description
Weekly or monthly email: "5 companies in your target sectors posted relevant roles this week." "3 Series C companies in logistics tech closed funding — likely hiring IT leadership in the next 90 days." For Intelligence Lookers, this is the reason to stay subscribed with zero active effort.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F12.1 | Digest covers: new roles at companies in the user's sector watchlist, funding news in target sectors (V2 — requires data partnership), hiring signal events |
| F12.2 | V1 scope: digest is generated from scan results aggregated across the user's watchlist — no external data feeds required |
| F12.3 | Claude synthesizes scan results into a narrative: "Three of your 10 watched companies posted roles this week — Simpplr's open is the strongest match" |
| F12.4 | Monitor tier users receive this as their primary product touch — it must stand alone as a valuable artifact |
| F12.5 | Digest email includes a prominent CTA to upgrade to Active tier if the user wants to act on the intelligence |

#### Acceptance Criteria
- [ ] Digest is always substantive — if there is genuinely nothing to report, it is suppressed (no empty emails)
- [ ] Monitor tier users who receive digests have 30-day retention ≥ 85%

---

### 4.13 Feature 13 — Momentum Score
**Tier:** Active and above
**Priority:** P2

#### Description
A weekly single-number score (1–100) tracking search velocity. Drops when the user goes quiet. Triggers a specific AI nudge when it drops below a threshold.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F13.1 | Score is calculated weekly from: outreach volume, response rate, interviews scheduled, pipeline progression, login frequency |
| F13.2 | Score is displayed prominently on the dashboard — not buried in analytics |
| F13.3 | Score drops trigger a proactive nudge: "Your Momentum Score dropped from 68 to 41 this week. You have 3 overdue follow-ups — here's what to send." |
| F13.4 | Nudge is delivered in the daily briefing and as a push notification (if user has enabled browser notifications) |
| F13.5 | Score history is visible as a trend chart — at minimum 12 weeks of history |
| F13.6 | Score weights are configurable at the product level (not user level) — A/B testing surface for growth |

#### Acceptance Criteria
- [ ] Score is calculated within 1 hour of the weekly cutoff
- [ ] A user who goes completely inactive for 7 days sees their score drop by ≥ 20 points

---

### 4.14 Feature 14 — Salary Intelligence
**Tier:** Executive tier only
**Priority:** P2

#### Description
When a user reaches the offer stage, the platform briefs them on market compensation for their role, level, and geography. Provides a negotiation floor, ceiling, and script.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F14.1 | Triggered when a user moves a company to "Offer" stage in their pipeline |
| F14.2 | User inputs: role title, company size, geography, total comp at current/prior role |
| F14.3 | Claude generates: market range (low / target / ceiling), negotiation opening script, what to expect in pushback, what to never say |
| F14.4 | Output is based on Claude's training data — not a live comp database in V1 |
| F14.5 | V2 consideration: integrate with Levels.fyi API for software engineering roles, Radford for broader exec comp |

#### Acceptance Criteria
- [ ] Comp range is role-specific and geography-adjusted — a Bay Area CIO range differs from a Chicago CIO range
- [ ] Negotiation script sounds natural, not like a negotiation textbook

---

### 4.15 Feature 15 — Onboarding Wizard
**Tier:** All tiers
**Priority:** P0

#### Description
A guided onboarding flow that builds the user's full profile in 15–20 minutes. Designed for Persona 5 (Laid-Off) who needs a system immediately, and for all other personas who need to get to first value quickly.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F15.1 | Steps: (1) role target + experience level, (2) sectors of interest, (3) geography + comp range, (4) resume upload, (5) LinkedIn sections paste (optional), (6) target company list (optional — can be seeded by discovery engine), (7) search status (active / passive), (8) first scan trigger |
| F15.2 | Each step has a "skip for now" option — no step blocks completion |
| F15.3 | Progress is auto-saved — user can return and complete the wizard across sessions |
| F15.4 | At wizard completion, the dashboard pre-populates with: first company scan scheduled, LinkedIn optimizer results if sections were provided, a suggested first-week action plan |
| F15.5 | Time to first value: user should receive their first daily briefing or scan result within 24 hours of completing onboarding |
| F15.6 | Each onboarding step responds contextually to the user's input before advancing — e.g., after the user enters target sectors, the system replies: "Got it — you're targeting enterprise HR Tech. That sector has had 4 funding rounds in the past 30 days. Here are 3 companies worth watching." This conversational layer is implemented as a Claude Haiku call per step and eliminates the static form-wizard feel. Users should feel the system is already working for them before onboarding is complete. |

#### Acceptance Criteria
- [ ] Median completion time: ≤ 20 minutes
- [ ] Completion rate ≥ 70% (users who start the wizard and finish it)
- [ ] Users who complete onboarding have 14-day retention ≥ 80%

---

### 4.16 Feature 16 — Triggering Event Intelligence
**Tier:** Active and above
**Priority:** P1 — the single most important differentiator for the executive tier

#### Description
The platform monitors target companies for business events that signal an imminent leadership hire — funding rounds, executive departures, acquisitions, IPO filings, major headcount changes. When a signal fires at a watched company, the platform alerts the user and suggests a specific outreach angle tied to the event. This is the gap that no product in the market fills: most roles at the executive level never get publicly posted. The CIO role is filled through a retained search firm 6 weeks after the previous CIO leaves — and the firm was called the week of the departure. Catching that signal before the search launches is the difference between first call and also-ran.

#### Functional Requirements

| ID | Requirement |
|---|---|
| F16.1 | Signal types monitored: funding announcement (Series A–IPO), executive departure (C-suite or VP level), acquisition or M&A announcement, IPO or SPAC filing, major headcount change (>20% growth or RIF) |
| F16.2 | Signals are detected for all companies on the user's watchlist — no additional setup required beyond adding a company |
| F16.3 | Alert format: company name, signal type, one-sentence signal summary, source link, and a suggested outreach angle ("Freshly funded Series C — they'll need IT leadership to scale. Now is the right time to reach out to the CFO.") |
| F16.4 | User can configure which signal types trigger alerts (default: all on) |
| F16.5 | Signals surface in the daily briefing as a priority item — higher priority than standard follow-up reminders |
| F16.6 | Signals are stored with a timestamp — user can see the signal history for any company in their watchlist |
| F16.7 | Signal alerts link directly to the outreach drafting interface with the company and event pre-populated as context |
| F16.8 | Duplicate signals (same event, multiple news sources) are deduplicated before alerting |
| F16.9 | Signal age: only events within the prior 14 days trigger alerts — older signals are logged but not surfaced |

#### Technical Notes
- **V1:** NewsAPI.org (free tier: 100 requests/day, covers early volume) or Bing News Search API for company news monitoring. Daily worker queries each company name + signal keywords. Claude Haiku parses the article snippet and classifies the signal type.
- **V2:** Crunchbase API for funding data (more reliable than news parsing; licensing required). LinkedIn company data API if access becomes available.
- New table: `company_signals` — see schema addition in Section 6
- New worker: `signal-worker.js` — daily run, queries news APIs, parses and classifies events, deduplicates, stores, triggers alerts

#### Acceptance Criteria
- [ ] A funding announcement at a watched company triggers an alert within 24 hours of the news appearing
- [ ] Alert includes a specific outreach angle, not a generic "this company had news"
- [ ] False positive rate (irrelevant news classified as a signal) < 20% over 30-day rolling window
- [ ] Signal worker does not re-alert on the same event after initial notification

---

### 4.17 Feature 17 — Recruiter Intelligence & Relationship Scoring
**Tier:** Executive tier only
**Priority:** P1 — core executive tier differentiator

#### Description
A structured intelligence layer on top of the existing contact tracker. Maps the executive search firm landscape in the user's functional area, scores relationship warmth for each firm and partner, and surfaces warm path opportunities the user hasn't identified. No competitor does this. The existing market either (a) lists executive search firms as a passive directory or (b) tracks contacts with no intelligence on top. Starting Monday tells the executive: "You have a second-degree connection to the CIO practice lead at Korn Ferry. Here's how to warm that before you need it."

#### Functional Requirements

| ID | Requirement |
|---|---|
| F17.1 | Firm profiles: for each executive search firm in the user's tracker, the platform maintains a profile: practice focus, known CIO/CTO/CISO partners, active mandate signals (news-derived), estimated deal flow in user's sector |
| F17.2 | Relationship warmth score (1–5) per recruiter contact: based on recency of last exchange, response rate, meeting history, and user-annotated relationship quality |
| F17.3 | Warmth score automatically decays over time — a relationship that was Active 6 months ago without further contact degrades toward Cold |
| F17.4 | Gap alerts: "You have no active relationship with any retained search firm covering CIO placements in PE-backed SaaS. These are the 5 highest-value firms to target." |
| F17.5 | Warm path discovery: when a new company is added to the watchlist, the system cross-references the user's second-degree network (via manually entered connections) and recruiter coverage to identify any warm path |
| F17.6 | Outreach timing guidance: the system suggests when to re-engage a firm based on mandate cycle signals ("Korn Ferry typically runs CIO searches for PE-backed portfolio companies — their Q3 pipeline typically opens in June") |
| F17.7 | All recruiter contacts in the standard contact tracker automatically feed the intelligence layer — no duplicate entry |

#### Technical Notes
- Warmth score is computed from `contacts` table activity data — no new data collection needed
- Firm profiles are seeded from Claude's training data in V1; no external API required
- V2 consideration: integrate with LinkedIn Sales Navigator API for second-degree connection mapping if access becomes available

#### Acceptance Criteria
- [ ] A user with 10+ recruiter contacts sees warmth scores populated automatically
- [ ] Gap alert fires when the user has no active relationship with any firm in a specified practice area
- [ ] Warm path discovery surfaces at least one relevant connection for 50%+ of newly added companies

---

## 5. Technical Architecture

### 5.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                │
│         (Browser, Email, Mobile Browser)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                       │
│              Next.js App Router (App + API)                 │
│                                                             │
│   ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  │
│   │   Web UI     │  │  API Routes   │  │  Server Actions│  │
│   │  (React RSC) │  │  /api/v1/**   │  │  (form submits)│  │
│   └──────────────┘  └───────────────┘  └────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────────┐
│   PostgreSQL    │ │  Claude API  │ │  Background Workers │
│   (Supabase)   │ │  (Anthropic) │ │  (Railway)          │
│                 │ │              │ │                     │
│  - users        │ │  - Opus 4.7  │ │  - Scan Scheduler   │
│  - pipeline     │ │    (chat)    │ │  - Briefing Engine  │
│  - contacts     │ │  - Haiku 4.5 │ │  - Follow-up Alerts │
│  - scan results │ │    (scoring) │ │  - Progress Reports │
│  - conversations│ │  - Sonnet 4.6│ │  - Momentum Score   │
│  - signals      │ │    (drafting)│ │  - Signal Worker    │
└─────────────────┘ └──────────────┘ └──────────┬──────────┘
                     └──────────────┘            │
                                                 ▼
                     ┌──────────────────────────────────────┐
                     │         External Services            │
                     │                                      │
                     │  browserless.io   (Playwright scans) │
                     │  Resend           (email delivery)   │
                     │  Stripe           (billing)          │
                     │  Google OAuth     (Gmail / Calendar) │
                     │  NewsAPI.org      (signal detection) │
                     └──────────────────────────────────────┘
```

### 5.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Full-stack, RSC for performance, SSE for streaming |
| UI Components | shadcn/ui + Tailwind CSS | Composable, accessible, fast to build |
| Backend | Next.js API Routes + Server Actions | Co-located with frontend, reduces latency |
| Database | PostgreSQL via Supabase | Managed, includes auth, realtime, row-level security |
| Auth | Supabase Auth | Email/password + Google OAuth, JWT |
| Background Jobs | Railway (Node.js workers) | Reliable cron, separate from web server, observable |
| Browser Automation | browserless.io | Cloud Playwright — no self-hosted headless Chrome |
| AI | Anthropic Claude API | claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5-20251001 |
| Email | Resend | Transactional email, React Email templates, deliverability |
| Billing | Stripe | Subscriptions, dunning, usage-based add-ons |
| Hosting | Vercel | Edge functions, preview deployments, observability |
| File Storage | Supabase Storage | Resume uploads, email attachments |

### 5.3 Environments

| Environment | Purpose | Notes |
|---|---|---|
| Local | Development | Supabase local dev, Railway not needed locally |
| Preview | PR review | Vercel preview deployments, shared Supabase dev instance |
| Staging | Pre-production | Full stack, real Claude API (test key), Stripe test mode |
| Production | Live | All services live, Stripe live mode, Claude API production keys |

### 5.4 Multi-Tenancy Model

- All user data is isolated via `user_id` foreign key on every table
- Row-Level Security (RLS) enforced at the PostgreSQL level — no query can return another user's data even if the application layer has a bug
- JWTs issued by Supabase Auth are passed in every API call — the API routes verify the JWT and extract `user_id` before any database operation
- Background workers authenticate as service role (bypasses RLS) and must validate `user_id` from the job queue — no service role writes happen without explicit `user_id` scoping

---

## 6. Database Schema

### 6.1 Core Tables

```sql
-- User account + billing state
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  stripe_customer_id    TEXT UNIQUE,
  subscription_tier     TEXT NOT NULL DEFAULT 'monitor' -- monitor | active | executive | coach
                        CHECK (subscription_tier IN ('monitor', 'active', 'executive', 'coach')),
  subscription_status   TEXT NOT NULL DEFAULT 'trialing' -- trialing | active | past_due | canceled
                        CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extended profile used for Claude context injection
CREATE TABLE user_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  resume_text         TEXT,           -- raw resume, plain text
  resume_json         JSONB,          -- structured resume (sections, bullets)
  target_titles       TEXT[],         -- e.g. ['CIO', 'VP IT', 'VP Engineering']
  target_sectors      TEXT[],         -- e.g. ['HR Tech', 'Logistics', 'Streaming']
  target_locations    TEXT[],         -- e.g. ['San Francisco', 'Remote']
  target_salary_min   INTEGER,        -- USD annual, base
  positioning_summary TEXT,           -- output from Positioning Coach
  linkedin_headline   TEXT,
  linkedin_about      TEXT,
  linkedin_optimized  JSONB,          -- optimized sections, scores
  search_status       TEXT DEFAULT 'active' -- active | passive | paused
                      CHECK (search_status IN ('active', 'passive', 'paused')),
  briefing_time       TIME DEFAULT '07:30:00',
  briefing_timezone   TEXT DEFAULT 'America/Los_Angeles',
  briefing_days       TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  search_started_at   TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Target companies (watchlist + pipeline)
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  career_page_url     TEXT,
  sector              TEXT,
  fit_score           INTEGER CHECK (fit_score BETWEEN 1 AND 10),
  stage               TEXT NOT NULL DEFAULT 'watching'
                      CHECK (stage IN ('watching','researching','applied','responded',
                                       'interviewing','offer','closed_hired','closed_passed')),
  notes               TEXT,
  last_checked_at     TIMESTAMPTZ,
  alert_threshold     INTEGER DEFAULT 7 CHECK (alert_threshold BETWEEN 5 AND 10),
  archived_at         TIMESTAMPTZ,
  archived_reason     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw scan results from career page checks
CREATE TABLE scan_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL -- success | no_change | error | blocked
                  CHECK (status IN ('success','no_change','error','blocked')),
  raw_hits        JSONB,        -- array of {title, url, snippet}
  ai_score        INTEGER,      -- 1-10 Claude relevance score
  ai_summary      TEXT,         -- one-sentence Claude summary
  notified_at     TIMESTAMPTZ,  -- null = not yet alerted
  error_message   TEXT
);

-- Recruiter and executive contacts
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id),  -- optional link to pipeline company
  name            TEXT NOT NULL,
  title           TEXT,
  firm            TEXT,
  channel         TEXT CHECK (channel IN ('linkedin','email','phone','referral','event')),
  status          TEXT NOT NULL DEFAULT 'not_contacted'
                  CHECK (status IN ('not_contacted','connection_pending','awaiting_response',
                                    'active','meeting_scheduled','closed')),
  contacted_at    TIMESTAMPTZ,
  follow_up_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up queue (drives daily briefing)
CREATE TABLE follow_ups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id),
  company_id      UUID REFERENCES companies(id),
  due_date        DATE NOT NULL,
  action          TEXT NOT NULL,    -- "follow up if no response", "send thank you", etc.
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','snoozed','dismissed')),
  notified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI chat history
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of {role, content, timestamp}
  token_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach drafts
CREATE TABLE drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id),
  company_id      UUID REFERENCES companies(id),
  draft_type      TEXT NOT NULL -- cold_email | linkedin_connect | linkedin_message | followup | thankyou
                  CHECK (draft_type IN ('cold_email','linkedin_connect','linkedin_message',
                                        'followup_noreply','followup_postmeeting','thankyou')),
  subject         TEXT,
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggering event signals for watched companies
CREATE TABLE company_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type     TEXT NOT NULL   -- funding | executive_departure | acquisition | ipo | headcount_change
                  CHECK (signal_type IN ('funding','executive_departure','acquisition','ipo','headcount_change')),
  signal_summary  TEXT NOT NULL,  -- one-sentence description of the event
  source_url      TEXT,           -- link to news article or source
  signal_date     DATE NOT NULL,  -- date of the event (not detection date)
  outreach_angle  TEXT,           -- AI-generated suggested outreach approach
  notified_at     TIMESTAMPTZ,    -- null = not yet alerted
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, signal_type, signal_date)  -- deduplication key
);

-- Momentum score history
CREATE TABLE momentum_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_of         DATE NOT NULL,     -- Monday of the scored week
  score           INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  components      JSONB,             -- breakdown: {outreach: 30, response_rate: 20, ...}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_of)
);

-- Audit log for AI-initiated pipeline changes
CREATE TABLE pipeline_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  action          TEXT NOT NULL,     -- update_stage | schedule_follow_up | add_company | etc.
  old_value       JSONB,
  new_value       JSONB,
  initiated_by    TEXT NOT NULL,     -- 'user' | 'ai_chat' | 'briefing_engine' | 'cron'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.2 Row-Level Security Policies

All tables have RLS enabled. Representative policy:

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_companies" ON companies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

The same pattern applies to: user_profiles, scan_results, contacts, follow_ups, conversations, drafts, momentum_scores.

The pipeline_audit_log is write-only for the application service role — users cannot delete audit entries.

---

## 7. Claude API Integration

### 7.1 Model Selection Strategy

| Use Case | Model | Rationale |
|---|---|---|
| AI Recruiter Chat | claude-opus-4-7 | Highest reasoning quality — users pay for executive judgment |
| Daily Briefing generation | claude-sonnet-4-6 | Balance of quality and cost — ~5,000 tokens per briefing |
| Outreach drafting | claude-sonnet-4-6 | High quality needed; fewer tokens than chat |
| Scan result scoring | claude-haiku-4-5-20251001 | Fast, cheap, batch-friendly — 200 tokens per hit |
| Company discovery | claude-sonnet-4-6 | Needs solid reasoning, not max quality |
| Resume tailoring | claude-sonnet-4-6 | Structured output, moderate complexity |

### 7.2 Pattern 1 — Conversational Chat with Tool Use

```javascript
// Context assembled fresh at session start
async function buildSystemPrompt(userId) {
  const [profile, companies, contacts, followUps, recentScans] = await Promise.all([
    db.getUserProfile(userId),
    db.getCompanies(userId, { limit: 50 }),
    db.getContacts(userId, { limit: 50 }),
    db.getFollowUps(userId, { status: 'pending', limit: 20 }),
    db.getRecentScanResults(userId, { days: 7 }),
  ]);

  return `You are Hunter, a dedicated AI career search partner for ${profile.name}.

## User Profile
- Target roles: ${profile.target_titles.join(', ')}
- Target sectors: ${profile.target_sectors.join(', ')}
- Target geography: ${profile.target_locations.join(', ')}
- Search status: ${profile.search_status}

## Active Pipeline (${companies.length} companies)
${companies.map(c => `- ${c.name} (${c.sector}) — Stage: ${c.stage}, Fit: ${c.fit_score}/10`).join('\n')}

## Contacts (${contacts.length} tracked)
${contacts.map(c => `- ${c.name}, ${c.title} at ${c.firm} — Status: ${c.status}, Follow up: ${c.follow_up_at ?? 'none set'}`).join('\n')}

## Overdue Follow-Ups
${followUps.map(f => `- ${f.action} (due ${f.due_date})`).join('\n')}

## Recent Scan Matches (Last 7 Days)
${recentScans.map(s => `- ${s.company_name}: score ${s.ai_score}/10 — ${s.ai_summary}`).join('\n')}

## Instructions
- You have access to tools to update the pipeline, schedule follow-ups, and draft messages.
- When you use a tool, confirm the action to the user conversationally.
- Never hallucinate a company, contact, or date that is not in the data above.
- All outreach drafts must follow anti-AI-copy rules. No banned phrases.
- Treat this user as a sharp executive — match their register.`;
}

// Tool definitions
const RECRUITER_TOOLS = [
  {
    name: 'update_company_stage',
    description: 'Move a company to a new stage in the pipeline',
    input_schema: {
      type: 'object',
      properties: {
        company_id: { type: 'string' },
        new_stage: { type: 'string', enum: ['watching','researching','applied','responded','interviewing','offer','closed_hired','closed_passed'] },
        notes: { type: 'string' }
      },
      required: ['company_id', 'new_stage']
    }
  },
  {
    name: 'schedule_follow_up',
    description: 'Schedule a follow-up action for a contact or company',
    input_schema: {
      type: 'object',
      properties: {
        contact_id: { type: 'string' },
        due_date: { type: 'string', format: 'date' },
        action: { type: 'string' }
      },
      required: ['due_date', 'action']
    }
  },
  {
    name: 'add_company',
    description: 'Add a new company to the watchlist',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        sector: { type: 'string' },
        career_page_url: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'add_contact',
    description: 'Add a new recruiter or executive contact',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        title: { type: 'string' },
        firm: { type: 'string' },
        channel: { type: 'string', enum: ['linkedin','email','phone','referral','event'] },
        notes: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_scan_history',
    description: 'Get recent scan results for a specific company',
    input_schema: {
      type: 'object',
      properties: {
        company_id: { type: 'string' },
        limit: { type: 'integer', default: 5 }
      },
      required: ['company_id']
    }
  }
];
```

### 7.3 Pattern 2 — Daily Briefing (Scheduled, Non-Streaming)

```javascript
// Runs as a Railway cron worker at 6:00 AM UTC
async function generateBriefingForUser(userId) {
  const context = await assembleBriefingContext(userId);

  if (!context.hasActions) return; // suppress if nothing to report

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `You are generating the daily job search briefing for ${context.userName}.
Your output is an HTML email body. Use <p>, <strong>, and <a> tags only — no divs, no tables.
Each action item should be: bolded action, one sentence explanation, then a pre-drafted message if applicable.
Maximum 5 action items. Prioritize overdue items first. Be direct and specific.
Subject line format: "Hunter — [most urgent action]"`,
    messages: [{
      role: 'user',
      content: JSON.stringify(context)
    }]
  });

  const briefingHtml = response.content[0].text;
  await sendBriefingEmail(userId, briefingHtml, context.userEmail);
}
```

### 7.4 Pattern 3 — Outreach Drafting (With Anti-AI-Copy Enforcement)

```javascript
const ANTI_AI_COPY_SYSTEM = `You are drafting professional outreach on behalf of the user.

BANNED PHRASES — never use any of these, not even paraphrased:
- "I hope this message finds you well"
- "I wanted to reach out"
- "I'm excited to connect"
- "I came across your profile"
- "I believe my background aligns"
- "I would love to explore"
- "I'd be happy to discuss"
- "Please feel free to reach out"
- "I look forward to hearing from you"
- "Best regards" (use no sign-off, or the user's standard name only)
- "I appreciate your time and consideration"
- Any sentence ending with an exclamation mark

STRUCTURAL RULES:
- No em dashes (—) anywhere. Replace with a period, comma, or restructured sentence.
- No bullet points
- Opening sentence must be about the recipient, not the sender
- No paragraph longer than 3 sentences
- First word of message must not be "I"
- Ask must be specific: "15 minutes" not "some time"
- LinkedIn messages: ≤ 300 characters total
- Cold emails: ≤ 200 words
- Follow-ups: ≤ 150 words

TONE: Write as a sharp, senior professional who doesn't need the job to survive.
Confident, not desperate. Specific, not generic.`;
```

### 7.5 Pattern 4 — Scan Result Scoring (Batch, Haiku)

```javascript
async function scoreHit(hit, userProfile) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Score this job posting for relevance to the candidate profile.

Candidate targets: ${userProfile.target_titles.join(', ')}
Candidate sectors: ${userProfile.target_sectors.join(', ')}

Job posting:
Title: ${hit.title}
Snippet: ${hit.snippet}

Score 1-10 (7+ = send alert). Respond with JSON only: {"score": N, "summary": "one sentence reason"}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### 7.6 Rate Limiting and Cost Controls

| Control | Value | Rationale |
|---|---|---|
| Chat token limit per session | 150K tokens (system + history) | ~$0.75 per session at Opus pricing |
| Daily briefing token limit | 800 tokens output | Keeps briefing cost under $0.01/user/day |
| Scan scoring batch size | 10 concurrent | Haiku rate limit protection |
| Per-user monthly token budget | 500K tokens (Active), 2M tokens (Executive) | Hard ceiling; graceful degradation at limit |
| Conversation history pruning | Summarize messages older than 50 turns | Keeps context window manageable |

---

## 8. Third-Party Integrations

### 8.1 Stripe (Billing)

| Requirement | Detail |
|---|---|
| Products | Four subscription products: Monitor, Active, Executive, Coach |
| Pricing | Monthly and annual (20% discount) for each tier |
| Trial | 7-day free trial — no credit card required |
| Dunning | Stripe's built-in Smart Retries — 3 retries over 14 days |
| Webhooks | `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted` |
| Portal | Stripe Customer Portal for self-serve plan changes and cancellation |
| Upgrade prompts | Feature gates surface an upgrade CTA when a lower-tier user tries to access a higher-tier feature |

### 8.2 Google OAuth (Gmail + Calendar)

| Requirement | Detail |
|---|---|
| Scopes | `gmail.readonly` (read sent mail for contact status sync), `calendar.readonly` (read interview events) |
| V1 use case | Read-only — detect when the user has sent an outreach email, auto-log contact date |
| V2 use case | Calendar: detect interview events, auto-trigger interview prep brief |
| Token storage | Encrypted at rest in PostgreSQL — `user_oauth_tokens` table |
| Refresh | Automatic token refresh using Google's refresh token flow |
| Optional | OAuth integration is optional at onboarding — product works without it |

### 8.3 browserless.io (Career Page Scanning)

| Requirement | Detail |
|---|---|
| API | browserless.io REST API — `POST /chrome/playwright` |
| Auth | API key in environment variable |
| Concurrency | Up to 10 concurrent browser sessions |
| Timeout | 30 seconds per page — hard kill if exceeded |
| Error handling | On timeout or block: log error, retry once after 2 hours, alert user if second failure |
| Alternative | Self-hosted Playwright via Puppeteer Docker (Railway) — fallback if browserless.io pricing scales poorly |

### 8.4 Resend (Email Delivery)

| Requirement | Detail |
|---|---|
| Use cases | Daily briefing, scan match alerts, weekly progress report, onboarding sequence, invoice emails |
| Templates | React Email components — one template per email type |
| Domain | Custom sending domain (e.g., briefing@hunter.app) — requires DNS setup |
| Deliverability | DKIM + SPF configured on Resend — required before any production email |
| Unsubscribe | One-click unsubscribe on all marketing-adjacent emails; transactional briefings include a pause link (not unsubscribe) |

### 8.5 Supabase (Auth + Database)

| Requirement | Detail |
|---|---|
| Auth | Email/password + Google OAuth |
| JWT | Supabase-issued JWTs validated in all Next.js API routes |
| Realtime | Supabase Realtime used for live pipeline updates after AI tool use |
| Storage | Supabase Storage for resume file uploads (.pdf, .docx) |
| Backups | Daily automated backups via Supabase Pro (point-in-time recovery to 7 days) |

---

## 9. Security & Compliance

### 9.1 Authentication & Authorization

| Requirement | Detail |
|---|---|
| Auth provider | Supabase Auth — battle-tested, SOC 2 compliant |
| Session tokens | Short-lived JWTs (1 hour) + refresh tokens (7 days) |
| Row-level security | RLS enforced at PostgreSQL — no cross-tenant data leakage even if app layer has a bug |
| Admin access | Service role key used only in Railway workers — never exposed to client |
| API keys | All third-party API keys (Anthropic, Stripe, browserless.io) stored in environment variables, never in code or DB |

### 9.2 Data Handling

| Requirement | Detail |
|---|---|
| PII at rest | Resume text, contact names, emails — stored in PostgreSQL (Supabase: AES-256 at rest) |
| PII in transit | TLS 1.3 enforced end-to-end |
| OAuth tokens | Encrypted column in database — application-level encryption using a KMS-managed key |
| Deletion | User account deletion: all personal data deleted within 30 days of request (GDPR Art. 17 compliance) |
| Data export | User can export their full pipeline and contact data as CSV at any time |
| Retention | Inactive accounts: data retained 12 months after subscription cancels, then deleted |

### 9.3 GDPR & CCPA

| Requirement | Detail |
|---|---|
| Legal basis | Legitimate interest (service delivery) + consent (marketing emails) |
| Privacy policy | Required before launch — covers data collection, third-party sharing (Anthropic API, Stripe, Resend), retention |
| Cookie consent | Required for EU users — session + analytics cookies |
| Data processing agreement | DPA required with Anthropic, Stripe, Resend |
| Opt-out | Marketing emails have one-click unsubscribe; transactional emails have a pause option |
| California residents | CCPA disclosure + opt-out of data sale (N/A — we don't sell data) |

### 9.4 Web Scraping & ToS Compliance

| Requirement | Detail |
|---|---|
| Targets | Only public career pages (no auth required) |
| Prohibited | Any site requiring login to view job listings (IT Leaderboard, LinkedIn Jobs, etc.) — these are excluded from V1 |
| robots.txt | Honor `Disallow` directives in robots.txt — scraper checks robots.txt before accessing any new URL |
| Rate limiting | Maximum one request per company per scan session — no aggressive crawling |
| Legal posture | Scanning public pages for personal use falls within fair use; productizing at scale requires ongoing counsel review |
| V2 consideration | Explore data licensing agreements with HR tech data providers as a compliant alternative to direct scraping |

---

## 10. Performance & Scalability

### 10.1 Response Time Targets

| Interaction | Target | Measured As |
|---|---|---|
| Page load (dashboard) | < 1.5 seconds | Time to Interactive (TTI) |
| Chat first token | < 3 seconds | Time from submit to first streamed character |
| Outreach draft | < 5 seconds | Time from submit to full draft rendered |
| Scan match alert | < 24 hours | Time from role going live to email delivery |
| Briefing delivery | ±15 minutes | Variance from configured send time |
| Pipeline update (tool use) | < 500ms | Time from tool use response to UI update |

### 10.2 Load Targets

| Metric | V1 Target | V2 Target |
|---|---|---|
| Concurrent web users | 100 | 1,000 |
| Daily briefings generated | 500 | 5,000 |
| Scan jobs per day | 200 | 2,000 |
| Active chat sessions simultaneously | 20 | 200 |

### 10.3 Scalability Approach

- **Web tier (Vercel):** Scales automatically via edge functions — no manual scaling
- **Database (Supabase):** Connection pooling via PgBouncer (included in Supabase) — no changes needed to V1 scale
- **Background workers (Railway):** Scale by adding worker instances — scan jobs distributed via database queue
- **Claude API:** Rate limits are per-key; may need org-level rate limit increase at 500+ users

### 10.4 Observability

| Signal | Tool |
|---|---|
| Application errors | Sentry (frontend + backend) |
| Server logs | Railway built-in logging |
| API latency | Vercel Analytics (web) + custom timing logs (workers) |
| Database performance | Supabase Dashboard + pg_stat_statements |
| Email deliverability | Resend Dashboard (open rates, bounce rates) |
| Billing health | Stripe Dashboard |
| Uptime monitoring | Uptime Robot (external ping every 5 min) |

---

## 11. Operational Requirements

### 11.1 Build Phases

#### Phase 1 — Validate the Core Loop (Weeks 1–6)
**Goal:** Prove the scan + briefing loop delivers value before building any UI.

Deliverables:
- [ ] Multi-tenant database schema deployed on Supabase
- [ ] Career page scanner (Playwright / browserless.io) running for 5–10 beta users
- [ ] Daily briefing engine generating emails via Resend
- [ ] Claude API connected — scan scoring (Haiku) and briefing generation (Sonnet)
- [ ] Manual user onboarding (no UI — admin creates accounts via DB)
- [ ] Anti-AI-copy outreach drafts available via email request to admin

Success criteria: 5 beta users receive daily briefings for 2 consecutive weeks with no critical errors.

#### Phase 2 — Web UI + Chat (Weeks 7–14)
**Goal:** Replace manual admin with a self-serve web interface.

Deliverables:
- [ ] Next.js app deployed on Vercel
- [ ] Supabase Auth (email/password) working
- [ ] Dashboard: pipeline view (Kanban + table), contact tracker, follow-up calendar
- [ ] Onboarding wizard (full 8-step flow)
- [ ] AI Recruiter Chat (streaming, tool use)
- [ ] Outreach drafting (standalone — not only via chat)
- [ ] LinkedIn Profile Optimizer
- [ ] Stripe integration (Monitor + Active tiers only)
- [ ] Feature gates for tier enforcement

Success criteria: A new user can sign up, complete onboarding, and receive their first briefing without any admin involvement.

#### Phase 3 — Full Feature Set (Weeks 15–24)
**Goal:** Launch Executive tier and all growth features.

Deliverables:
- [ ] Company Discovery Engine
- [ ] Resume Tailoring (.docx export)
- [ ] Interview Prep Coach
- [ ] Positioning Coach
- [ ] Salary Intelligence
- [ ] Weekly Progress Report
- [ ] Momentum Score + nudge system
- [ ] Market Intelligence Digest
- [ ] Triggering Event Intelligence (signal-worker.js + NewsAPI + company_signals table)
- [ ] Recruiter Intelligence & Relationship Scoring
- [ ] Google OAuth integration (Gmail read-only)
- [ ] Executive tier Stripe product live
- [ ] Chrome Extension v1 — ATS autofill (form pre-fill, no auto-submit) + job clipping
- [ ] Real-time Narrative Quality Scoring in resume editor

Success criteria: 50 paying users, NPS ≥ 40.

#### Phase 4 — Coach Tier + Partnerships (Weeks 25–40)
**Goal:** Unlock B2B channel and highest LTV tier.

Deliverables:
- [ ] Coach tier dashboard (up to 10 clients)
- [ ] White-label briefings with coach branding
- [ ] Aggregate pipeline view for coaches
- [ ] Outplacement firm partnership integration (white-label or API)
- [ ] Referral program for placed candidates

Success criteria: 2+ outplacement firm agreements signed, 5+ Coach tier subscribers.

### 11.2 Cost Structure at Scale

| Service | 100 Users | 500 Users |
|---|---|---|
| Supabase Pro | $25/mo | $25/mo |
| Vercel Pro | $20/mo | $20/mo |
| Railway (workers) | $20/mo | $80/mo |
| browserless.io | $50/mo | $200/mo |
| Resend | $20/mo | $60/mo |
| Claude API (est.) | $150/mo | $750/mo |
| Stripe fees (2.9% + $0.30) | ~$560/mo | ~$2,100/mo |
| **Total infra** | **~$315/mo** | **~$1,135/mo** |
| **Revenue (blended $150/user)** | **$15,000/mo** | **$75,000/mo** |
| **Gross margin** | **~98%** | **~98.5%** |

---

## 12. Pricing & Tier Structure

### 12.1 Tier Definitions

| Tier | Price | Target Personas | Key Features |
|---|---|---|---|
| **Intelligence** | $49/month | Intelligence Looker, early Mid-Career | Company watchlist (10 co.), twice-weekly scans, match alerts, weekly digest |
| **Search** | $199/month | Mid-Career Climber, Career Pivoter, Returning Professional | All Intelligence + AI chat, daily briefing, outreach drafting, resume tailoring, LinkedIn optimizer, company discovery (30 co., 3x/week scans) |
| **Executive** | $499/month | Transformation Executive, VP Candidate, Laid-Off | All Search + interview prep, positioning coach, salary intelligence, recruiter tracker, daily scans, 50 companies |
| **Coach** | $599/month | Career coaches (up to 10 clients) | Multi-client dashboard, white-label briefings, aggregate pipeline view |

Annual pricing: 20% discount on all tiers.

**Executive tier pricing anchor:** The Executive tier replaces a $5,000–$15,000 human career coach engagement and delivers more: daily active monitoring, relationship intelligence, and AI coaching available around the clock for the full duration of the search. All Executive tier marketing copy must reference this comparison explicitly — never anchor against free tools or competing SaaS. Anchor against what executives actually spend: human coaches, outplacement firms, and retained search preparation services. Copyline: "Everything a $10,000 career coach gives you, plus the monitoring and intelligence they can't. $499/month."

### 12.2 Feature Gate Matrix

| Feature | Intelligence | Search | Executive | Coach |
|---|---|---|---|---|
| Company Watchlist | 10 | 30 | 50 | 50/client |
| Scan Frequency | 2x/week | 3x/week | Daily | Daily |
| Scan Match Alerts | ✓ | ✓ | ✓ | ✓ |
| Market Intelligence Digest | Weekly | Monthly | Monthly | ✓ |
| AI Recruiter Chat | — | ✓ | ✓ | ✓ |
| Daily Briefing | — | ✓ | ✓ | ✓ |
| Outreach Drafting | — | ✓ | ✓ | ✓ |
| Company Discovery | — | ✓ | ✓ | ✓ |
| Resume Tailoring | — | ✓ | ✓ | ✓ |
| LinkedIn Optimizer | — | ✓ | ✓ | ✓ |
| Positioning Coach | — | ✓ | ✓ | ✓ |
| Weekly Progress Report | — | ✓ | ✓ | ✓ |
| Momentum Score | — | ✓ | ✓ | ✓ |
| Interview Prep Coach | — | — | ✓ | ✓ |
| Salary Intelligence | — | — | ✓ | ✓ |
| Recruiter Tracker (advanced) | — | — | ✓ | ✓ |
| Triggering Event Intelligence | — | ✓ | ✓ | ✓ |
| Recruiter Intelligence & Relationship Scoring | — | — | ✓ | ✓ |
| Multi-client Dashboard | — | — | — | ✓ |
| White-label Briefings | — | — | — | ✓ |
| ATS Autofill + Job Clipping (Phase 3) | — | ✓ | ✓ | ✓ |
| Real-time Narrative Quality Scoring (Phase 3) | — | ✓ | ✓ | ✓ |

### 12.3 Trial and Conversion

- 7-day free trial — all Search tier features — no credit card required
- Trial ends: forced plan selection or cancellation
- Upgrade CTAs surface within feature gates: "This feature requires Search tier — $199/month. Start free trial."
- Annual plan discount communicated at trial end (highest conversion moment)

### 12.4 Free Tier Option (Open Decision — See Section 15.1)

The market has trained job seekers to expect a meaningful free tier. Two options under consideration:

| Option | Structure | Acquisition benefit | Risk |
|---|---|---|---|
| **A — Time-limited trial (current plan)** | 7-day full Active trial, then paid | Clean conversion gate, no perpetual free users | Lower top-of-funnel vs. freemium |
| **B — Feature-limited freemium** | Monitor tier free: 3 companies, 1 scan/week, no AI, alerts only | Large top-of-funnel; intelligence lookers discover product before they need it | Free users don't convert unless they enter an active search |
| **C — Hybrid** | 7-day trial + permanent free (3 companies, weekly scan, no AI) | Best of both; free tier retains intelligence lookers indefinitely | More complex billing logic; risk of free tier cannibalization |

**Recommendation:** Option C, with the addition of the free public LinkedIn Optimizer at startingmonday.app/optimize (see Feature 8, F8.9). Jack and Jill AI's completely free candidate model creates direct top-of-funnel pricing pressure — SM must have a zero-friction entry point that acquires users before they default to free competing tools. The free public LinkedIn Optimizer captures users at the exact moment they begin a search (when they update their LinkedIn profile) and converts them into the SM ecosystem before they discover alternatives. The permanent freemium Monitor tier (3 companies, weekly scan, no AI) then retains intelligence lookers at near-zero cost until they enter an active search. Decision required before Phase 2 launch.

---

## 13. Success Metrics

### 13.1 Business Metrics (Monthly Tracking)

| Metric | Month 3 | Month 6 | Month 12 | Month 24 |
|---|---|---|---|---|
| Total paying users | 10 | 30 | 100 | 300 |
| MRR | $1,500 | $4,000 | $14,000 | $42,000 |
| Blended ARPU | $150 | $133 | $140 | $140 |
| Trial-to-paid conversion | — | ≥ 40% | ≥ 45% | ≥ 50% |
| 60-day retention | — | ≥ 70% | ≥ 75% | ≥ 80% |
| NPS | — | ≥ 40 | ≥ 50 | ≥ 55 |

### 13.2 Engagement Metrics (Weekly Tracking)

| Metric | Target |
|---|---|
| Daily briefing open rate | ≥ 60% |
| Weekly active users (WAU/MAU) | ≥ 60% |
| Chat sessions per user per week | ≥ 2 (Active tier) |
| Outreach drafts sent per user per week | ≥ 1 (Active tier) |
| Scan alerts acted on (opened + clicked) | ≥ 50% |

### 13.3 Product Health Metrics (Automated Alerts)

| Signal | Alert Threshold |
|---|---|
| Scan failure rate | > 10% of jobs in a 24-hour window |
| Briefing delivery failure | > 5% of sends in a day |
| Claude API error rate | > 2% of requests in an hour |
| p95 chat response time | > 8 seconds |
| Stripe payment failure rate | > 15% (dunning threshold) |

---

## 14. Out of Scope — V1

The following are deliberately excluded from the initial build:

| Feature | Reason | V2 Consideration |
|---|---|---|
| Mobile native app (iOS/Android) | Cost and complexity vs. web app | V3 — mobile web works initially |
| LinkedIn API integration | API access restrictions and approval friction | V2 if API access granted |
| Real-time salary database (Levels.fyi, Radford) | Licensing cost; Claude knowledge sufficient for V1 | V2 |
| Auth-gated site scraping (IT Leaderboard, LinkedIn Jobs) | ToS violation | Data partnership required |
| Bulk ATS portal scraping (Indeed, LinkedIn, Glassdoor) | ToS violation | — |
| Real-time web search for company discovery | Adds cost and latency without proportionate value in V1 | V2 via Perplexity or Brave API |
| Multi-language support | English-only market initially | V2 |
| Peer cohort / community features | Community moderation overhead | V2 |
| Employer-facing tools (talent pool reverse marketplace) | Different product entirely | Separate revenue stream |
| Browser extension — autofill + job clipping | Extension store review overhead; Workday ToS risk on autofill; zero value to executive tier | Phase 3 — form pre-fill only (no auto-submit); bundle autofill + clipping in one extension build |
| Real-time resume scoring (live editing feedback) | Rezi/Jobscan already do keyword scoring; requires live editor UI | Phase 3 — reframe as executive narrative quality score (achievement specificity, differentiation strength) not keyword counting |
| AI phone call transcription (Zoom interviews) | Privacy complexity | — |
| Reference management module | Nice-to-have, low frequency | V2 |

---

## 15. Open Questions & Risks

### 15.1 Open Questions

| Question | Owner | Decision By |
|---|---|---|
| ~~Product name — is "Hunter" the working title or final brand?~~ | ~~Founder~~ | **RESOLVED: Product is Starting Monday. Domain startingmonday.app purchased 2026-04-26.** |
| ~~Domain and brand identity~~ | ~~Founder~~ | **RESOLVED: startingmonday.app** |
| Free tier structure — time-limited trial only, freemium, or hybrid? | Founder | Before Phase 2 launch — see Section 12.4 |
| Will Anthropic enterprise API agreement be needed at scale? | Founder | When approaching 500 users |
| B2B outplacement partnership — who is the first target firm? | Founder | Phase 3 planning |
| Crunchbase API vs. Claude knowledge for company discovery — acceptable trade-off in V1? | Founder | Phase 2 build |
| NewsAPI.org vs. Bing News Search API for triggering event intelligence — coverage and cost comparison needed | Founder | Phase 2 build |
| Free LinkedIn Optimizer public launch — should startingmonday.app/optimize launch as a standalone tool before the full product to begin top-of-funnel acquisition? | Founder | Before Phase 2 launch |
| Jack and Jill AI partnership — if JaJ's Jill employer network reaches meaningful US coverage, SM users could optionally surface their profile to Jill as an inbound channel add-on. Worth monitoring; evaluate at Phase 3. | Founder | Phase 3 planning |
| Security and privacy as a marketed differentiator — "no employer network, your search stays yours" — given Jack and Jill AI's January 2026 CVSS 9.8 security vulnerability disclosure and the structural data exposure inherent in two-sided matching platforms, should SM's privacy posture be a front-page product claim? | Founder | Before Phase 1 launch |

### 15.2 Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Career page structure changes break scanner | High | Medium | Alert on scan failure, graceful degradation, user notification |
| LinkedIn blocks Playwright-based access to public profiles | Medium | High | No LinkedIn scraping in V1 — not a dependency |
| Claude API price increase | Low | Medium | Monitor token usage per user, token budgets, model tier selection |
| Anthropic's ToS restricts career coaching use case | Low | Critical | Review ToS; commercial use of Claude API is explicitly allowed |
| Competitor (LinkedIn, Indeed, ChatGPT) ships an equivalent product | Medium | High | Depth of integration and personalization as moat; speed to market |
| Scraping targets adopt bot detection (Cloudflare Turnstile) | High | Medium | browserless.io handles basic fingerprinting; fallback to manual check alerts |
| Solo founder bandwidth — can't build Phase 2 in 14 weeks alone | High | Medium | Phase 1 validates before Phase 2 investment; hire or contract at Phase 2 |
| Low trial-to-paid conversion (< 20%) | Medium | Critical | A/B test onboarding; direct outreach to trial users; qualitative interviews |
| GDPR audit triggered by EU user complaint | Low | High | Privacy policy + DPA in place before launch; no EU-specific targeting in V1 |

---

*Document owner: Richard Rothschild*
*Version: 1.0 — 2026-04-26*
*Next review: Upon completion of Phase 1 (Week 6)*
