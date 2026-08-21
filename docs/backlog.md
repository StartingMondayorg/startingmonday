# Starting Monday — Product Backlog

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: weekly
Source of truth: yes


Internal document | Updated May 2026

Items here are validated ideas deferred from the active roadmap. Each entry includes the rationale for deferral and the condition that would move it forward.

---

## Backlog Review View (Chris Planning)

Use this section during review to decide what Chris can own now, what to queue next, and what to defer.

### Sprint 6 UI/UX Residual (New)

| ID | Item | Why next | Suggested owner | Effort |
| --- | --- | --- | --- | --- |
| UX-R1 | Dashboard route decomposition and disclosure hardening (`/dashboard`) | Only remaining high-risk route in final Sprint 6 council audit; highest leverage to clear residual scroll burden | Chris (frontend) | M |

### Decision Rules

1. Pull items that are implementation-ready and low-coupling first.
2. Avoid work that requires staging architecture unless the staging decision is approved in the same sprint.
3. Prefer items that reduce production risk or unblock acquisition-sensitive flows.
4. Assign one primary owner per item before kickoff.

### Priority Buckets

#### Now (Ready to assign)

| ID | Item | Why now | Suggested owner | Effort |
| --- | --- | --- | --- | --- |
| B1 | Form Validation (Zod) | Prevents broken onboarding and malformed API payloads before growth pushes | Chris (backend) | M |
| B2 | Playwright E2E (4 critical paths) | Catches auth/billing/onboarding regressions before users report them | Chris + QA pairing | L |
| B3 | Turnstile re-enable on auth/public endpoints | Abuse prevention risk grows with traffic; implementation already exists | Chris (backend) | S |
| B4 | Migration rollback playbooks | Reduces blast radius on schema changes touching production data | Chris (backend/data) | M |
| B5 | Semgrep Cloud onboarding completion | Turns existing scan into managed security workflow with visibility | Chris (platform) | S |
| B15 | EMI smoke auth hardening (service token) | Replace staff-session cookie automation with secure non-user trigger for CI safety | Chris (platform/security) | S |

#### Next (Start after one Now item ships)

| ID | Item | Start condition | Suggested owner | Effort |
| --- | --- | --- | --- | --- |
| B6 | Supabase staging project + migration flow | Before any billing/auth/pipeline-sensitive migration | Chris (platform/data) | M |
| B7 | Seed data script for staging realism | After staging project exists | Chris (backend) | S |
| B8 | Resend staging routing | After Railway staging exists | Chris (platform) | S |
| B9 | Secret split per environment | After staging exists | Chris (platform) | S |
| B10 | Accessibility WCAG 2.1 AA pass | Before institutional B2B procurement motion | Chris + frontend | M |

#### Later (Strategic, not immediate execution)

| ID | Item family | Trigger |
| --- | --- | --- |
| B16 | Jira auto-import activation (add 4 GitHub secrets to activate `.github/workflows/jira-import.yml`) | Before next planned ticket migration; workflow is wired and dry-run validated — only secrets config needed |
| B11 | Data gravity features (accomplishment repository, intelligence archive) | After retention and 100+ paying users |
| B12 | Alumni and competitive-intelligence extensions | After core search PMF + alumni signal |
| B13 | Network and recruiter layers | After sufficient scale and trust architecture |
| B14 | Adjacent products | Separate product decision cycle |

### Chris Candidate Workstream (Recommended Sequence)

1. B3 Turnstile re-enable (fast risk reduction)
2. B1 Form Validation with Zod (stability foundation)
3. B2 Playwright critical-path suite (release confidence)
4. B4 Migration rollback playbooks (data safety)
5. B5 Semgrep Cloud onboarding (security operations)

### Review Checklist for Meeting

1. Confirm one sprint goal for Chris: risk reduction, release confidence, or staging readiness.
2. Pick top 2 items from Now and lock owners.
3. Define done criteria and demo artifact for each selected item.
4. Capture explicit defer decisions for anything not selected.
5. Schedule follow-up date to re-rank Next bucket.

---

## Engineering Infrastructure

### Reliability Operating Package and 90-Day Rollout Epic

Implementation-ready SRE package has been defined with route/page SLO mapping, alert thresholds, production synthetics, deploy gates, runbook templates, and incident severity policy.

Reference docs:

- docs/sre/operating-package.md
- docs/sre/slo-catalog.md
- docs/sre/alert-matrix.md
- docs/sre/synthetic-tests-and-deploy-gates.md
- docs/sre/runbook-templates.md
- docs/sre/incident-severity-policy.md
- docs/epic-90-day-reliability-rollout.md

Move forward when: current sprint capacity can absorb phase 1 foundation work without delaying critical production fixes.

### Test Environments and Staging Pipeline

CI is live (GitHub Actions runs type check + Vitest on every push and PR). The Supabase staging project is the next piece — run every migration there before production. Full staging environment deferred.

What's in place:

- GitHub Actions CI: type check + 44 Vitest tests on every push/PR
- Stripe: test mode vs live mode already separated
- Branch workflow: feature branches → PR → merge to main (Railway auto-deploys main)

What's deferred and why:

**Supabase staging project** — A second free Supabase project (`startingmonday-staging`) where migrations are applied and tested before production. Deferred because schema changes have been simple so far; move forward before any migration that touches billing, auth, or pipeline data.

**Railway staging environment** — A second Railway service pointing at the staging Supabase project and Stripe test mode, auto-deployed from a `staging` branch. Deferred because maintaining two environments slows a solo builder materially and the risk is manageable at small user count.

Move forward when: 25+ paying users. At that point, a bad production deploy has real consequences and the overhead is justified.

**Seed data script** — A script that creates a realistic test user: full profile, 5 companies at different pipeline stages, 3 contacts, one prep brief, briefing time set. Without this, staging tests nothing meaningful.

Move forward when: Railway staging environment exists. Seed data and staging are built together.

**Resend staging routing** — Staging emails go to a test inbox (e.g., Mailtrap or a dedicated Gmail) rather than real user addresses. Required before staging environment can test email flows safely.

Move forward when: Railway staging environment exists.

**Migration rollback scripts** — Every schema migration should have a documented reverse operation. Currently migrations are forward-only with no written rollback path.

Move forward when: Before any migration that drops a column, renames a table, or changes a constraint on a table with production data.

**Feature flags** — Deploy code without activating it for all users. Useful for gradual rollouts and A/B testing. Not needed until multiple users would be affected differently by the same release.

Move forward when: 100+ active users or first A/B test need.

**Secret management per environment** — Staging needs its own Anthropic, Resend, and browserless.io keys so staging load doesn't count against production rate limits or billing.

Move forward when: Railway staging environment exists.

**Cloudflare Turnstile (Captcha on Auth)** — Signup, login (password and OAuth), and public endpoints currently have no abuse protection. Turnstile infrastructure is in place (CSP configured, library integrated, server verification implemented) but disabled. When re-enabled:

- Client-side widget loads on auth pages; users solve captcha before submitting credentials.
- Server routes (`/api/auth/verify-and-signin`, `/api/auth/verify-and-signup`, `/api/auth/verify-and-oauth`) verify token before auth operations.
- Public endpoints (intake forms, demo routes) are gated with per-IP rate limiting + captcha verification.

The implementation is complete; it's currently disabled to unblock user testing and iteration on the core auth flow.

Status (May 2026): Disabled. All code paths intact; just need to re-enable enforcement.

Move forward when: User growth reaches a point where bot signup/brute force is observed, OR before opening public intake/demo features to ad-driven traffic.

**Semgrep Cloud integration** — Security scanning is wired in locally, but Cloud upload and repo onboarding are deferred until the Semgrep account/context is confirmed. Keep the scan in CI, but postpone the GitHub App and token setup until the correct org/account flow is settled.

Move forward when: ready to finish the Semgrep Cloud onboarding and store `SEMGREP_APP_TOKEN` in repository secrets.

---

## Code Quality

### Form Validation (Zod)

API routes have inconsistent input validation. Most routes check for missing fields with basic conditionals; none use a schema validation library. Onboarding allows users to skip required fields and enter the dashboard with an incomplete profile.

What's needed:

- Zod schemas on all AI route handlers (chat, tailor, strategy, prep, signals, outreach)
- Zod validation on the onboarding form server action to enforce required fields before setting `onboarding_completed_at`
- Consistent error response shape across all routes

Move forward when: before public marketing push. A user submitting a malformed onboarding and landing in a broken state is a support ticket at best and a refund at worst.

### Playwright E2E Tests (Four Critical Paths)

Test coverage is ~0.2% of codebase (18 Vitest unit tests on library functions). No end-to-end tests exist. A regression in billing, auth, or onboarding would be invisible until a user reports it.

Four paths that must not silently break:

1. Signup → onboarding → dashboard
2. Trial → paid conversion (Stripe checkout)
3. Prep brief generation (streaming, full brief)
4. Daily briefing delivery (worker job + email send)

Move forward when: before any sprint that touches billing logic, auth, or the onboarding flow.

### Accessibility (WCAG 2.1 AA)

Current state: 6 aria attributes in the codebase. No skip-navigation link. No aria-live regions for async updates (chat messages, form submissions, streaming AI). Missing aria-describedby links between inputs and hints. Would fail any automated WCAG 2.1 AA scan.

Move forward when: before the first institutional B2B deal (outplacement firm, university career office). Procurement at those organizations does compliance checks. Individual executive users are not the driver here.

### Performance Optimization

No use of `next/image` for image optimization. No dynamic imports or code splitting beyond Next.js defaults. Dashboard search filter fires on every keystroke (fixed with debounce). No explicit caching strategy beyond Next.js ISR defaults.

Move forward when: 100+ active users. Performance is invisible at current scale. Exception: any image-heavy pages added before then should use `next/image` from the start.

---

## Known Technical Limitations

### Google OAuth Consent Screen Shows Supabase Domain

When users sign in with Google, the OAuth consent screen shows the Supabase project domain (`mytnhoxcgvnzxhgcumkf.supabase.co`) rather than `startingmonday.app`. This is a Supabase free-tier limitation — the OAuth callback is routed through Supabase's own domain. Login works correctly; only the branding on the Google consent screen is affected.

The app name "Starting Monday" is set in Google Cloud Console, which partially mitigates the visual. The domain shown is outside our control without a plan upgrade.

Status (May 2026): Google Cloud domain ownership verified via Search Console. OAuth branding resubmitted for Google Trust and Safety review. Review takes 4-6 weeks; first response expected within 3-5 days. Existing consent screen remains active during review.

Move forward when: Google approves the branding verification. No further action needed unless they request changes.

---

## Data Gravity

### Career Accomplishment Repository

A structured log of accomplishments tied to role, company, and outcome. Used to generate resume versions, strategy briefs, and interview answers. Freetext format initially; structured schema later as usage patterns emerge.

Deferred because: acquisition is the current priority. Repository is a retention and depth feature that requires an established user base to validate.

Move forward when: first 100 paying users are acquired and pre-offer retention is solved. The repository then becomes the next depth investment.

### Company Intelligence Archive

An ongoing per-company intelligence dossier that accumulates scan results, signals, documents, and notes over time. Creates data gravity proportional to monitoring duration.

Deferred because: the archive accumulates automatically as users add companies. The feature work is in surfacing it meaningfully, which is not the current priority.

Move forward when: user base is large enough that average monitoring duration exceeds 6 months. At that point, the archive's richness becomes a differentiating asset worth surfacing explicitly.

---

## Post-Search and Alumni

### Alumni Mode (Reduced Subscription)

A $49/month post-offer tier with intelligence monitoring of a small company watchlist, quarterly signal digest, and maintenance of the accomplishment repository.

Deferred because: acquisition is the current priority. Alumni mode has high long-term LTV value (returning users convert immediately for second searches) but requires an established user base to generate meaningful alumni volume.

Move forward when: first 100 paying users are acquired, post-completion email sequence is live, and referral volume from completed searches is measurable.

### Competitive Intelligence for Current Role

Monitoring dashboard for employed users — competitor tracking, industry signal digest, executive movement relevant to their current organization. Repositions Starting Monday as an ongoing strategic intelligence tool beyond active search.

Deferred because: requires a fundamental repositioning of the product beyond "search infrastructure." The product's core message needs to be established and proven before introducing an adjacent use case that could confuse it.

Move forward when: core search product has 500+ users and Alumni mode is live. Competitive intelligence then becomes the adjacent retention layer for alumni.

---

## Network and Social

### Confidential Peer Network

An opt-in anonymized network within Starting Monday. Senior professionals connected by industry, function, and target company overlap. No public profiles. Warm introduction mechanics. Threshold for value: approximately 100 nodes.

Deferred because: insufficient user base to create network value. Trust design for this audience is complex and a single confidentiality failure would be damaging. Requires careful product design before building.

Move forward when: 500+ active users, clear opt-in consent architecture designed, and the data infrastructure can support anonymized matching without exposing individual search activity.

### Recruiter Relationship Layer

Feature allowing trusted executive recruiters to connect with their candidates in Starting Monday — shared prep briefs, limited pipeline visibility with explicit consent.

Deferred because: the perception of recruiter access to candidate data is acutely negative for the confidential search persona. Requires a trust architecture that does not currently exist and a user base large enough to make the recruiter value proposition meaningful.

Move forward when: 1,000+ active users, explicit consent mechanics designed, and product-market fit with the B2B channel is validated through the outplacement integration first.

---

## Engagement and Recognition

### Milestone Recognition

Private acknowledgment of search progress — first call booked, company moved to interviewing, offer received. Not a badge system. A brief, respectful acknowledgment tied to the story capture and referral prompt.

Deferred because: the execution risk of feeling performative is high with this audience, and the current priority is acquisition, not engagement depth.

Move forward when: post-completion email sequence is live and the voice for this type of communication is validated with real users.

---

## Pricing

### Persona-Based Pricing Presentation

Showing different pricing tiers based on which persona the user self-identifies with (e.g., the Transformation CIO sees the Executive tier prominently; the Intelligence Monitor sees Intelligence first). Reduces pricing complexity perception without reducing tier count.

Move forward when: tier count reaches four or more paid options and conversion data suggests visitors are confused by the pricing page.

### Promotional Discounts

Time-limited or cohort-specific discounts for specific acquisition contexts (alumni partnerships, outplacement referrals, first 100 users). The current position is no discounting on demand, but structured promotional pricing for defined channels is different.

Move forward when: institutional channels are active and a discount structure can be tied to a defined cohort rather than given on request.

### Additional Subscription Tiers

Tiers beyond Intelligence and Active (Alumni, Competitive Intelligence subscription, Board Positioning). Each requires a distinct value proposition, distinct user segment, and a pricing rationale that does not undermine adjacent tiers.

Move forward when: core tiers have stable conversion rates and the use cases for additional tiers are validated by user research, not by hypothesis.

---

## B2B

### Full Outplacement Integration

White-label or co-branded experience for outplacement partner firms. Bulk seat provisioning, partner admin portal, per-seat monthly revenue model. Target partners: Lee Hecht Harrison, Right Management, Challenger Gray, boutiques.

Deferred from full integration because: enterprise sales cycle is 12-18 months. Procurement, legal, and account management capabilities do not yet exist. Lightweight approaches (see active roadmap) validate demand first.

Move forward when: lightweight outplacement channel produces 20+ paying users and at least one firm expresses intent to formalize the relationship.

### University Alumni Platform Integration

Preferred partner arrangement with business school alumni career offices. Co-branded or co-funded access for alumni cohorts.

Deferred from formal integration because: decision cycle at universities is bureaucratically long. Individual career director relationships are the entry point; formal partnership follows adoption.

Move forward when: career director referral program produces 20+ paying users from at least two schools.

### Recruiter Subscription (B2B)

A recruiter-facing subscription — candidate list management, brief access, milestone visibility. Revenue model: per-recruiter fee, not per-candidate.

Deferred because: distinct product from the candidate-facing application. Requires separate product design, separate go-to-market, and LinkedIn Recruiter as the primary competitive framing.

Move forward when: Recruiter Relationship Layer (candidate-side) is live and recruiter usage is measurable.

### Partner Outreach Channel Expansion

Expand the internal outreach hub beyond executives, search firms, coaches, and outplacement firms to cover additional partner channels already represented in the partner GTM surface.

Priority order:

1. PE talent teams and operating partners
2. Fractional C-suite networks
3. C-suite and technology associations
4. Executive financial advisors
5. Relocation firms
6. Media partners (podcasts and newsletters)

Deferred because: current channel operations are newly live and need baseline conversion, reply, and unsubscribe data before opening six new channels at once. Expanding too quickly will dilute message quality and reduce learning velocity.

Move forward when: the first four channels (executives, search firms, coaches, outplacement) have at least 30 days of send data and channel-level benchmarks for reply rate, meeting-booked rate, and suppression rate.

Definition of done for each added channel:

- Outreach hub tab and filter added
- Send API channel validation updated
- Starter prospect CSV added with confidence tags
- Channel-specific message templates and persona focus fields defined
- Calendar follow-up flow verified end-to-end

---

## Analytics and Visualization

### Internal Analytics Dashboard

A founder-facing dashboard that visualizes the event data collected by the data product infrastructure. Not a third-party analytics tool — a purpose-built internal view that answers the specific questions the product team needs to make decisions.

Key views needed:

- Six-actions completion rate by cohort (signup month, acquisition channel, plan type)
- Trial-to-paid conversion funnel with drop-off at each step
- Signal-to-action conversion rate by signal type (which signals produce outreach within 48 hours)
- Brief quality score distribution over time (does context richness correlate with user rating?)
- Company watch demographics — which industries, company sizes, and geographies are most watched
- Referral source attribution — which acquisition channels produce users who complete all six actions
- Churn prediction signals — what does the event history of a churned user look like vs. a retained user in the first 14 days?

Deferred because: the event logging infrastructure must be live and collecting data before visualization adds value. Building the dashboard before the data exists produces nothing useful.

Move forward when: data product infrastructure sprint is complete and at least 30 days of event data is in the system. At that point, the dashboard is the next sprint.

Implementation notes when built:

- Build as an authenticated admin-only route within the existing Next.js application — not a separate tool
- Use a charting library (Recharts or similar — already common in Next.js stacks) for visualizations
- Source from Supabase directly via server-side queries — no intermediate data warehouse needed at this scale
- PostHog provides supplemental session-level data; the internal dashboard provides cohort and business-level views that PostHog's free tier does not support cleanly

---

## Communications and Lifecycle Outreach

### Lifecycle Email System

A managed email communications system covering every stage of the user relationship: prospective users who have not activated, current users at key milestones, and former users on a win-back path. Each campaign has its own trigger, sequence, and suppression rules.

What is needed:

- **Campaign library** covering: onboarding activation series (days 1, 3, 7 for trialing users who have not added a company), trial-to-paid conversion nudge, feature adoption (first briefing, first signal acted on), placement congratulations and Alumni tier offer, win-back for churned accounts (30, 60, 90 days post-cancel), B2B seat member onboarding, and institutional renewal reminders
- **Trigger system** that fires on user events (signup, company added, brief generated, subscription change, inactivity threshold) as well as time-based schedules
- **Admin send UI** at `/dashboard/admin/communications` to view active campaigns, send one-off batches, pause sequences, and preview email copy before sending
- **Tracking layer**: per-email delivery confirmation, open rate (via pixel or link parameter), and click-through rate; no third-party email analytics tool required if Resend provides webhook events
- **Response tracking**: flag replies from users so Rich can see which campaigns generate direct responses and at what rate
- **Follow-up suppression**: if a user takes the desired action (upgrades, reactivates, adds a company), remove them from the active sequence automatically

Deferred because: one-off email routes (welcome, payment failed, signup notification) cover the highest-priority moments for now. A full system is infrastructure work that does not unlock new revenue at the current user count.

Move forward when: 50+ paying users or the win-back opportunity is measurable. At that point, manual outreach does not scale and the system pays for itself in recovered revenue. Build as a single sprint, not incrementally.

---

## Adjacent Product Candidates

These ideas are strong enough to build but belong in a separate product rather than Starting Monday's core. Starting Monday's data and user relationships provide distribution advantage for launching them.

### Executive Market Intelligence Subscription

A market intelligence product for employed senior executives — competitor tracking, industry signal digest, executive movement relevant to their current role. Different from Starting Monday's search focus: the buyer is an employed executive, not a candidate. Pricing likely $99-149/month. Competes with Bloomberg, industry newsletters, and nothing that does exactly this.

### Board Positioning Platform

Tracks board vacancies, governance changes, and PE board composition shifts. Helps executives build and maintain the relationships and positioning needed for board candidacy. The search is qualitatively different from an executive search — longer timeline, entirely relationship-driven, no postings. Could be built as a feature of the Executive tier or as a standalone product for a narrower, higher-willingness-to-pay audience.

### Confidential Executive Network

A peer-to-peer confidential network for senior professionals in and between searches. No public profiles, no feed, action-oriented connections around shared target companies and industry signals. Different from Starting Monday's core in that it is a social product, not a search infrastructure product. Network effects make it either very valuable or worthless — no middle ground.
