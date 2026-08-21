# Starting Monday — Product Roadmap

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: quarterly
Source of truth: yes


Internal document | May 2026

---

## Roadmap Principles

1. Depth over breadth. Every feature should make the core workflow — watch, prepare, manage — meaningfully better before we add new workflows.
2. Data gravity first. Features that make user data richer and harder to replicate elsewhere take priority.
3. The brief is the product. Every infrastructure investment should eventually make the prep brief more accurate, more specific, or faster to reach.
4. No feature that requires the user to do more work unless it produces disproportionate value.

---

## Phase 0: Foundation (Shipped)

Everything currently live at startingmonday.app.

### Infrastructure

- [x] Next.js 16 App Router, Railway deployment
- [x] Supabase auth + RLS-enforced database
- [x] Stripe billing (Passive/Active), webhook handling, pause/resume
- [x] Sentry error tracking, UptimeRobot monitoring
- [x] Request logging middleware
- [x] Health endpoint (`/api/health`)
- [x] Vitest test harness (44 tests)

### Core Features

- [x] Pipeline tracking (5 stages: Watching, Researching, Applied, Interviewing, Offer)
- [x] Contact tracker with channel, follow-up, and notes
- [x] Career page scanning (browserless.io, 3x/week)
- [x] Company signals (funding, exec hires/departures, acquisition, expansion, etc.)
- [x] Prep brief (full + 8 individual sections, all streaming)
- [x] Search Strategy Brief (Opus, streaming, follow-up chat)
- [x] AI Chat advisor (persistent history, tool use: stage updates, follow-ups, notes)
- [x] Outreach email drafting
- [x] Resume tailoring (DOCX export)
- [x] Daily morning briefing (email + in-app)
- [x] LinkedIn profile import
- [x] Resume upload (PDF + Word parsing)
- [x] Document attachments (job description, annual report, press, etc.)
- [x] 30-day free trial, no credit card

### Worker (Background)

- [x] Scan job (Mon/Wed/Fri)
- [x] Signal classification job (Mon/Wed/Fri)
- [x] Briefing delivery (timezone-aware, configurable time/days)
- [x] Follow-up reminder emails
- [x] Momentum score (weekly)
- [x] Weekly digest
- [x] Trial expiration reminders (T-3, T-0)
- [x] Usage monitoring

---

## Phase 1: Acquisition and Activation (Next 60 Days)

Theme: Get users to the six actions that predict retention. Every user who does all six within the first session or first two days converts and stays. Every user who does two or three does not.

### Sprint: Six Actions Activation Framework

The six actions, in order, that predict trial-to-paid conversion and long-term retention:

1. Upload resume or import LinkedIn profile
2. Add first target company with career page URL
3. Generate first prep brief and read it
4. Add first contact at a target company
5. Set up daily briefing time and timezone
6. Log first conversation note on a company or contact

Product work to drive completion of all six:

- [ ] Build a persistent "Getting Started" progress tracker visible on the dashboard until all six are complete (not a gamification badge — a functional checklist with links to each action)
- [ ] Replace empty dashboard state with a guided first-session card that leads directly to action 1
- [ ] Add smart prompts: after resume upload, immediately surface "Add your first target company" with a single-click entry point; after first company is added, prompt to generate the brief; after brief is read, prompt to add a contact
- [x] Build a day-3 and day-7 email trigger for users who have not completed all six actions — surfacing which specific actions remain with direct links (not generic "come back" messaging)
- [ ] Track completion of each of the six actions per user in the database with timestamps — this is the primary activation metric going forward
- [ ] Dashboard: internal view of six-actions completion rate by signup cohort

Success metric: 50% of trial users complete all six actions within 7 days of signup. Current baseline to be established on first cohort.

### Sprint: User Behavior Event Logging

Track every meaningful user action in the product — not just page views but in-product behaviors. This is the foundational data layer for all future product decisions.

Events to capture (minimum viable set):

- [ ] Resume uploaded / LinkedIn imported (with source)
- [ ] Company added (with career page URL present or absent)
- [ ] Scan result viewed (company, roles detected, time spent)
- [ ] Signal viewed and whether outreach action followed within 48 hours
- [ ] Brief generated (which sections, context richness score: documents attached, contacts present, signals available)
- [ ] Brief section rated by user
- [ ] Contact added (channel type)
- [ ] Outreach draft generated, copied to clipboard
- [ ] Conversation note logged
- [ ] Follow-up reminder set and whether completed
- [ ] Pipeline stage changed (from/to)
- [ ] Strategy brief generated and time spent reading
- [ ] Chat session started, messages sent
- [ ] Daily briefing opened (email open vs. in-app view)
- [ ] Referral link clicked or shared
- [ ] Subscription upgraded or downgraded
- [ ] Trial ended without conversion (capture last action taken)

Implementation:

- [ ] Extend PostHog custom event tracking for all actions above — PostHog already initialized; add `posthog.capture()` calls at each action point
- [x] Add `user_events` table to Supabase for server-side event logging (action, user_id, metadata JSONB, timestamp) — server events as source of truth, PostHog as visualization layer
- [ ] Capture referral_source on signup and propagate through all events for cohort analysis
- [ ] Add six-actions completion status to user record (bitmask or individual boolean columns)

Success metric: All six activation actions logged with timestamp within 30 days. Full event schema live within 45 days.

### Sprint: Post-Completion Email Sequence

Replace alumni mode with a lightweight email sequence triggered by offer acceptance. Two emails, both sent by the worker.

Offer acceptance email (triggered when user marks a company as "Offer"):

- [x] Detect pipeline stage change to "Offer" in the worker
- [x] Send within 24 hours: brief, private, acknowledging the outcome without celebrating the tool
- [x] Two asks: (1) "Who else in your network is in search?" with a referral link, (2) a sentence they would share as a testimonial (direct link to a feedback form)

Annual reactivation email (triggered by anniversary of offer date):

- [x] Worker cron: daily job checking for users whose offer_accepted_date was exactly 365 days ago
- [x] Send one short email: one piece of genuinely relevant industry or market information, one sentence reminder that Starting Monday exists for anyone in their network
- [x] Unsubscribe link. No urgency. No offer.

- [x] Add offer_accepted_at column to users table, populated when pipeline stage reaches "Offer"
- [ ] Add referral_source tracking for signups coming through the completion email referral link
- [x] Build the feedback form (testimonials table + /feedback route)

Success metric: 20% referral rate from offer acceptance email within 90 days of launch. Testimonial capture rate: 15%.

### Sprint: Data Product Infrastructure

Collect at the most granular level now. The schema must be rich enough to answer questions three years from now that are not yet being asked.

- [x] Design and implement `user_events` table (action, user_id, session_id, metadata JSONB, created_at) — server-side source of truth
- [ ] Design and implement `company_watch_events` table (user_id, company_id, industry, company_size_est, stage, geography, created_at) — captures target company demographics for aggregate intelligence
- [x] Design and implement `signal_action_events` table (signal_id, user_id, signal_type, days_to_action, action_type, created_at) — tracks which signal types produce action and how quickly
- [x] Design and implement `brief_quality_log` table (brief_id, user_id, context_richness_score, sections_generated, user_rating, time_to_read_est, created_at) — measures brief quality relative to context depth
- [x] Add cohort columns to users table: signup_source, acquisition_channel, persona_self_identified, plan_at_trial_end
- [ ] Build internal admin page showing event volume, six-actions completion rate by cohort, and signal-to-action conversion rate — viewable only by admin role

Note: No data is shared externally. The collection infrastructure is built now so the asset exists. Visualization and analysis tooling is a separate sprint (see backlog).

Success metric: All four event tables live and receiving data within 45 days. Zero PII in any event metadata field.

### Immediate Scan on Company Add

- [x] Trigger a scan immediately when a user adds a new company (instead of waiting for the next scheduled run)
- [ ] Show the scan result within the company workspace as soon as it completes

### Brief Quality Improvements

- [ ] Add "regenerate this section" to all prep brief sections (currently full-brief only)
- [ ] Add user feedback on individual sections (not just full brief)
- [ ] Use section-level feedback to improve prompt selection over time

---

## Phase 2: Post-Search and Retention (Months 3–6)

Theme: Capture users after the offer. Build the revenue that survives the natural end of the search lifecycle.

### Alumni Mode

- [ ] "I accepted an offer" flow — celebratory but private
- [ ] Automatic downgrade to Alumni plan ($19–29/month)
- [ ] Features retained: company monitoring (5 companies), quarterly signal digest, accomplishment repository, contact archive
- [ ] Prompt: "Stay sharp. The best time to start the next search is 3 years before you need to."

### Competitive Intelligence for Current Role

- [ ] Monitoring dashboard for users in "employed" mode
- [ ] Watch competitor companies, industry signals, executive movements in their space
- [ ] Positions Starting Monday as an ongoing strategic intelligence tool, not just a search tool
- [ ] Messaging: "Your search is done. Your market intelligence isn't."

### In-App Referral Program

- [ ] "Who else in your network is in search?" prompt at offer capture
- [ ] Referral link generation with tracking
- [ ] Reward: one free month for referrer, one month added to referee trial
- [ ] Simple, no friction — one click to copy referral link

### Onboarding Improvement

- [ ] Measure time-to-first-brief by cohort
- [ ] A/B test onboarding step sequencing
- [ ] Exit survey for cancelled trials (what was missing?)

---

## Phase 3: Executive Tier and B2B (Months 6–12)

Theme: Launch the high-value tiers. Open the institutional revenue channel.

### Executive Tier (Waitlist Launch)

- [ ] Board and PE firm intelligence (track board composition changes, PE portfolio company transitions)
- [ ] Unlimited company pipeline
- [ ] Priority brief generation (queue priority for Opus model)
- [ ] Dedicated account review (human touch, quarterly)
- [ ] $499/month

### Outplacement Integration

- [ ] White-label or co-branded experience for outplacement partner firms
- [ ] Bulk seat provisioning (company pays, executive uses)
- [ ] Partner admin portal (usage, seat management)
- [ ] Revenue model: per-seat monthly fee to the partner firm
- [ ] Target partners: Lee Hecht Harrison, Right Management, Challenger Gray, boutiques

### Recruiter Relationship Layer

- [ ] Recruiter can share a prep brief directly with their candidate in Starting Monday
- [ ] Candidate grants recruiter view-only access to their pipeline (optional)
- [ ] Recruiter-facing workflow: candidate list, brief access, milestone visibility
- [ ] Revenue model: recruiter subscription (not per-candidate)

### Campaign Tier (Waitlist Launch)

- [ ] 90-day managed campaign
- [ ] 1:1 strategy session with search expert
- [ ] Curated recruiter introductions
- [ ] Concierge brief review and coaching
- [ ] 3-month minimum, limited availability
- [ ] $999/month

---

## Phase 4: Network and Intelligence Scale (Year 2)

Theme: Platform effects. The network makes the product better for every user.

### Peer Network (Confidential)

- [ ] Opt-in "quiet network" — anonymized until both parties agree to connect
- [ ] Match on: industry, function, target company overlap, geography
- [ ] Warm introduction mechanism: "There's someone in your network also watching Acme Corp."
- [ ] No public profiles. No feed. No LinkedIn-style engagement.

### Aggregated Intelligence

- [ ] Anonymized, aggregated signal data across the user base
- [ ] "5 Starting Monday users are watching this company. 3 of them have a contact in common with you."
- [ ] Role detection before posting, confirmed by multiple independent scans

### HR Transition Benefit (Corporate B2B)

- [ ] Starting Monday offered as a company-funded transition benefit for executives being transitioned
- [ ] Company pays 6-month access per seat
- [ ] Alternative to traditional outplacement: self-directed, modern, lower cost
- [ ] Requires legal/compliance review of the offering structure

---

## Feature Graveyard (Considered and Deferred)

| Feature | Why Deferred |
| --- | --- |
| Salary benchmarking | Data sourcing is hard; Levels.fyi and Radford serve this better at scale |
| Company financials (Crunchbase integration) | Useful but users can self-attach; not worth API cost until scale |
| Automated LinkedIn outreach | High risk of ToS violation; lower quality than drafted outreach |
| Video interview prep | Out of scope for current positioning; different product |
| Cover letter templates | Outreach drafting covers this better; templates are too generic |
| ATS integration | Wrong buyer for the current persona; executives do not use ATS tools |

---

## Open Questions

1. Alumni mode pricing: $19 or $29? Does a lower price retain more users, or does it signal lower value? Test both.

2. Accomplishment repository UX: Import from resume automatically, or let the user build from scratch? The auto-import is faster to first value but may need significant correction.

3. Recruiter tier: Is the recruiter a paying customer or a free distribution channel? A recruiter who recommends Starting Monday to 20 candidates/year may be worth a free account.

4. Manager Tools partnership timing: What does the product need to look like to be "advice-defensible" to Mark Horstman? What user stories need to exist? This gates the partnership conversation.

5. Executive tier waitlist: How many people on the waitlist before we build? And do we build for the waitlist or charge a deposit to validate?
