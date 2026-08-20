# Obstacles to $25,000 MRR

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: monthly
Source of truth: yes

## AI Recruiter Platform — Honest Assessment

---

## What $25K MRR Actually Requires

At a blended average of ~$150/month across tiers, $25K MRR = approximately **167 paying users**.

To maintain 167 paying users with 4-month average active-search churn, you need to be
acquiring roughly **40-50 new customers per month** while retaining intelligence lookers
as the stable base. This is the math everything else flows from.

The obstacles below are grouped by category and rated by severity:
- 🔴 **Critical** — will stop you before you start if not solved
- 🟡 **Significant** — will limit growth if not addressed early
- 🟢 **Manageable** — real but solvable with time and iteration

---

## 1. Product Obstacles

---

### 🔴 Scraper Maintenance is a Treadmill

**The problem:** Career pages redesign 2-4 times per year. Every redesign can break your
CSS selectors, your scroll-and-wait logic, your keyword detection. A company that migrates
from their own careers page to Greenhouse, Lever, or Ashby breaks your scanner completely.
You have no control over any of this.

**Why it matters:** If a user's target company posts a CIO role and your scanner misses it,
you have failed at the one thing you promised. Trust is gone. Churn follows.

**What needs to happen:**
- Build automated monitoring for scan failures (zero results ≠ no jobs; could mean broken scraper)
- Build an admin alerting system: "Flexport scan returned 0 results for 3 consecutive runs — check it"
- Plan 4-8 hours/week of scraper maintenance at steady state, more during any major career
  platform migration wave
- Consider using a third-party scraping API (Firecrawl, Apify, browserless.io) that handles
  anti-bot and layout changes, accepting the cost as a support contract, not infrastructure

---

### 🔴 The IT Leaderboard Feature Cannot Be Productized As-Is

**The problem:** The current scanner logs into IT Leaderboard using stored credentials and
scrapes their authenticated job feed. This almost certainly violates their Terms of Service.
Doing this at scale with hundreds of users' credentials would expose you to a cease-and-desist,
account termination, or litigation.

**Why it matters:** You can't build a product on functionality that can be legally shut down
with a single letter. This is the highest legal risk in the current codebase.

**What needs to happen:**
- Remove credential-based login automation before any public launch
- Approach CIO Partners / IT Leaderboard directly about a data partnership or API agreement
- Replace with a legitimate job board integration (Indeed Publisher API, LinkedIn Jobs API
  if approved) or accept that recruiter board scanning is not part of the product

---

### 🔴 Multi-Tenancy Architecture Does Not Exist Yet

**The problem:** The current codebase is a single-user local script. Building a multi-tenant
platform — where each user has isolated data, their own company watchlist, their own pipeline,
their own Claude conversation context — is a substantial engineering project, not a feature addition.

**Why it matters:** Every dollar of revenue depends on this architecture existing and being secure.
A bug that exposes one user's job search data to another is a catastrophic trust failure.

**What needs to happen:**
- Row-level security in Postgres (Supabase makes this manageable)
- User auth with JWT isolation
- All database queries scoped to authenticated user ID — no exceptions
- Security audit before first paying customer, not after

---

### 🟡 Claude API Output Quality is Inconsistent Without Careful Prompt Engineering

**The problem:** Claude is capable of excellent career coaching output. It is also capable of
producing generic, hedged, AI-sounding advice that provides no value over a Google search.
The difference is entirely in the prompt design, context injection, and guardrails. Bad prompts
at scale means users get bad advice and churn after month one.

**Why it matters:** The core value proposition is "AI that gives you advice as good as a great
recruiter." If the AI says "networking is important — consider reaching out to your connections,"
you have charged someone $149 for nothing.

**What needs to happen:**
- Treat prompt engineering as a core product discipline, not a configuration detail
- Write and test anti-platitude guardrails into every system prompt
- Build a prompt evaluation system: flag responses that contain banned phrases
  ("I hope this finds you well", "leverage your network", "it's important to...")
- Plan for 1 dedicated hour/week of prompt improvement based on user feedback
- Use few-shot examples of great recruiter advice in system prompts

---

### 🟡 Onboarding Complexity Will Kill Conversion

**The problem:** The product only delivers value once a user has: uploaded their resume,
defined their target titles and sectors, added their target companies, and set their
notification preferences. That is a 20-30 minute onboarding experience. Most users will
quit before completing it.

**Why it matters:** Trial-to-paid conversion depends on the user experiencing value before
their trial expires. If they haven't completed setup, they've experienced nothing.

**What needs to happen:**
- Design an onboarding wizard that guides setup in 10 minutes or less
- LinkedIn Optimizer as the first step — immediate visible value before asking for anything
- Smart defaults: "Here are 10 companies based on what you told us — add or remove"
- Progressive disclosure: start the daily briefing even with partial setup; fill in the rest over time
- Email drip during trial week: Day 1 (welcome), Day 3 (did you set up your companies?),
  Day 5 (here's your first briefing), Day 7 (trial ends tomorrow)

---

### 🟡 Bot Detection Blocks High-Value Target Sites

**The problem:** Cloudflare, Imperva, and Akamai bot management block headless browsers.
Several high-value career pages (Bespoke Partners was already confirmed as blocked) use these
services. As the product scales and more requests come from shared IP ranges, more sites
will start blocking scans.

**Why it matters:** If a user's top 5 target companies all use Cloudflare, the product
fails its most important function.

**What needs to happen:**
- Use browserless.io or Apify with residential proxy rotation — reduces block rate significantly
- Detect blocks (HTTP 403, Cloudflare challenge page) and notify users rather than silently failing
- Build a fallback: "We can't scan this page automatically — we'll alert you to check it manually"
- Accept that 5-15% of career pages will be unscannable; be transparent about it

---

### 🟢 Mobile Experience

**The problem:** Job seekers check opportunities and follow up on their phones. The daily
briefing email arrives at 7am — they read it on their phone, want to take action, and hit
a non-mobile-optimized web app.

**What needs to happen:**
- Mobile-responsive web app from day one (Next.js + Tailwind makes this manageable)
- Daily briefing email must be mobile-optimized
- Native app is not required for $25K MRR, but a poor mobile web experience will hurt retention

---

## 2. Legal & Compliance Obstacles

---

### 🔴 Web Scraping Terms of Service Exposure

**The problem:** Most career pages' Terms of Service prohibit automated scraping. The
hiQ vs. LinkedIn ruling established that scraping publicly accessible data does not violate
the CFAA (Computer Fraud and Abuse Act), but ToS violations can still result in:
- IP blocking (operational problem)
- Cease-and-desist letters (legal cost)
- Civil litigation from well-resourced companies (existential risk for a small startup)

**Why it matters:** A letter from Flexport's legal team could require you to stop scanning
their site. At scale, you may get multiple such letters.

**What needs to happen:**
- Scrape only publicly accessible pages (no login required)
- Implement rate limiting: no more than 1 request per company per hour, maximum
- Respect robots.txt — if a page disallows bots, do not scan it; notify the user
- Have a Terms of Service for your own product that clearly states you scan public pages
  and that you are not responsible for missed postings if a site blocks access
- Consult an attorney before public launch on scraping liability exposure

---

### 🔴 GDPR and CCPA Compliance

**The problem:** Your platform stores highly personal data: full resume text, employment history,
salary expectations, personal email, details of every job they applied to. Under GDPR (EU users)
and CCPA (California users), you have specific obligations around:
- Right to deletion (user requests full data purge — must be honored within 30 days)
- Data portability (user can request their data in a portable format)
- Consent for how data is used (particularly for AI processing)
- Data breach notification (72 hours under GDPR)

**Why it matters:** A GDPR complaint can result in fines up to 4% of annual revenue.
More practically: any user data breach in this category is reputationally catastrophic.

**What needs to happen:**
- Write a real Privacy Policy before launch (not a boilerplate generator — hire an attorney)
- Build user data export and deletion functionality before accepting EU users
- Decide whether to accept EU users at launch (simpler to geo-restrict initially)
- Store data in a US region if restricting to US; or EU region if accepting EU users
- Never send resume text to Claude without anonymizing PII that isn't needed for the prompt

---

### 🟡 Liability for Advice Quality

**The problem:** If a user follows the platform's salary negotiation advice and the offer
is rescinded, or follows the resignation coaching and their departure causes legal consequences,
they may hold the platform responsible.

**What needs to happen:**
- Terms of Service must clearly state the platform provides informational assistance,
  not legal or professional advice
- All salary, negotiation, and resignation guidance must include appropriate caveats
- Do not make specific promises ("this company pays $X") — frame as market data, not guarantees

---

### 🟢 Credential Storage Security

**The problem:** If the IT Leaderboard feature or any similar credential-based feature
is productized, you are storing user passwords in your database. A breach that exposes
these credentials could cause harm far beyond your platform if users reuse passwords.

**What needs to happen:**
- Never store plain-text credentials — encrypt at rest with user-specific keys
- Prefer OAuth integration over username/password storage wherever possible
- If password storage is unavoidable, use a dedicated secrets manager (AWS Secrets Manager,
  HashiCorp Vault)

---

## 3. Customer Acquisition Obstacles

---

### 🔴 Reaching Job Seekers at the Exact Moment They Need This

**The problem:** Job search tools have a narrow purchase window. A user who is happily employed
has no urgency. A user who landed a job 3 weeks ago doesn't need it. The window is approximately
the first 2 weeks of an active search — and you have no way to know when that starts.

**Why it matters:** The best product in the world can't sell to someone who isn't looking yet
and doesn't need follow-up with someone who already landed. Timing is the entire acquisition challenge.

**What needs to happen:**
- Target channels that reach people *at* the trigger moment:
  - LinkedIn ads targeted at people who recently changed "open to work" status
  - Outplacement firm partnerships (they know exactly when someone starts their search)
  - Layoff event targeting (TechCrunch, Blind, LinkedIn posts announcing company layoffs)
  - SEO for "I just got laid off what do I do" — captures people in the trigger stage
- LinkedIn Optimizer as a free tool (no credit card) — people update LinkedIn when they
  start looking; this brings them in at exactly the right moment
- Partner with HR/people teams who inform employees about outplacement resources

---

### 🔴 Customer Acquisition Cost vs. Lifetime Value Math

**The problem:** In B2C, the typical CAC for a productivity/career tool via paid channels
(LinkedIn ads, Google ads) is $50-150 per paying customer. At $199/month with 4-month average
retention, LTV is roughly $796 gross. After infra costs and CAC, margin is still sensitive if conversion is weak.

**Why it matters:** If CAC exceeds LTV, the business is structurally unprofitable and
paid acquisition is not viable. You would need organic acquisition (SEO, word of mouth,
content) to scale — which is slower and less predictable.

**What needs to happen:**
- Model LTV by tier and persona before spending on paid acquisition
- Prioritize organic channels first: LinkedIn content, SEO, outplacement partnerships,
  word-of-mouth referral program
- Design a referral incentive: "Give a friend a free month; get a free month" — job seekers
  know other job seekers
- Consider a B2B channel (career coaches, outplacement firms) where one sale = many users
  and LTV is 5-10x higher

---

### 🟡 "Just Use ChatGPT" Objection

**The problem:** A sophisticated user can approximate 60% of the product's value by pasting
their resume and the job description into ChatGPT. The objection is real because it is partly true.

**Why it matters:** If the value proposition is "AI career help," ChatGPT is a free substitute.
You must be meaningfully better in ways that are not easily replicated with a generic prompt.

**What needs to happen:**
- The defensible differentiators are: persistent memory of the full search (ChatGPT forgets),
  automated company monitoring (ChatGPT can't watch 20 career pages), the daily briefing
  (ChatGPT doesn't push to you), and structured pipeline management
- Lead with these in all marketing — never lead with "AI career coach" alone
- Tagline direction: "The only tool that watches your target companies and tells you when to move"
  — emphasizes automation, not AI

---

### 🟡 Standing Out in a Crowded Market

**The problem:** Teal, Huntr, Jobscan, Simplify, LinkedIn Premium, Sonara, LazyApply —
the job search tool market is not empty. A new entrant needs a clear, defensible reason
to choose them over something the user has probably already heard of.

**What needs to happen:**
- Niche down before expanding: launch exclusively for one persona (executives or mid-career
  tech professionals) and be the best product for that group before going broad
- Own a specific claim: "The only job search tool built around monitoring your specific
  target companies" — not "AI-powered job search assistant" (too generic)
- Case studies and testimonials from real users who landed roles — social proof is the
  only credible marketing in this category

---

### 🟡 SEO Competition

**The problem:** "How to find a job," "resume tips," "job search strategies," "career coach"
— these are among the most competitive SEO categories in existence. LinkedIn, Indeed,
The Muse, and thousands of career coaches with 10-year content archives dominate organic search.

**What needs to happen:**
- Do not compete for broad career SEO terms — you will lose
- Target long-tail, specific terms: "how to monitor company career pages automatically,"
  "AI tool for executive job search," "how to track recruiter follow-ups"
- Create product-led content: "We scanned 500 career pages and here's what we found about
  CIO hiring patterns" — data-driven content that only your platform can produce
- Guest content on executive career blogs, outplacement firm newsletters, LinkedIn newsletters

---

### 🟢 Trust Barrier for Sensitive Data

**The problem:** Users must share their resume, salary expectations, and details of their
current employment situation. For an executive in a confidential search, this is extremely
sensitive. They will hesitate before sharing this with a product they don't trust.

**What needs to happen:**
- Be explicit about data practices before signup (not buried in terms)
- SOC 2 compliance (eventually — not required for MVP but required for enterprise/outplacement deals)
- "Your data is never used to train AI models" — make this a prominent promise
- Consider a no-login LinkedIn Optimizer (paste text, get feedback) as the trust-building
  first touchpoint before asking for account creation

---

## 4. Retention Obstacles

---

### 🔴 Unavoidable Churn: The Product Works

**The problem:** When a user lands a job, they cancel. This is not a failure — it is the product
working. But it means the business has structural churn that cannot be reduced below a floor.
Active searchers at 4-month average tenure means 25% monthly churn from that cohort alone.

**Why it matters:** At 25% monthly churn, you must replace a quarter of your customer base
every month just to stay flat. To grow, you must acquire significantly more than you lose.
This is an aggressive treadmill.

**What needs to happen:**
- Build the Intelligence Looker tier ($49/month) as the MRR stabilization layer — these users
  stay 12-24 months and reduce blended churn rate significantly
- Build re-engagement pathway: users who cancel get a "pause" option (3 months, half price)
  rather than a hard cancel — many will reactivate the next time they look
- Build "alumni" email: 6 months after a user lands, send "Ready to check the market?" —
  captures the next cycle of their career

---

### 🟡 Engagement Drop-Off in Week 3-4

**The problem:** Job search is emotionally grueling. Users start strong (high engagement, filling
out profiles, setting up companies) and then hit the first wall of silence — no responses,
no matches, no progress. This is when they stop logging in, stop engaging, and eventually cancel.

**Why it matters:** If users churn at week 3-4, they never experience the value that comes from
the longer-term monitoring and relationship building the product supports. They leave with a bad
impression that spreads.

**What needs to happen:**
- The Daily Briefing must continue providing value even during slow periods — frame it as
  "Here's what to do while you wait" not "you have no matches this week"
- Momentum Score with a direct nudge when it drops — "Your search velocity dropped this week.
  Here are 3 specific actions to take today."
- Celebrate small wins in the briefing: "You sent 4 messages this week. That's in the top
  30% of active searchers on the platform."
- In-app coaching at the 3-week mark: "Most searches feel slow right now. Here's what the
  data says about what works in weeks 4-8."

---

### 🟢 Intelligence Lookers Are Hard to Keep Engaged

**The problem:** A Intelligence Looker subscribes, sets up 10 target companies, and then... waits.
If nothing matches in 60 days, they question whether the $49/month is worth it.

**What needs to happen:**
- Market Intelligence digest must deliver value independent of scan matches — industry news,
  funding signals, hiring pattern analysis — so there is always something in the weekly email
- Proactive "you might like this company" discovery: "Based on your profile, here are 3 new
  companies we think you'd score a 8+ on. Want to add them?"
- Annual "career readiness" report: "Here's how your profile and target market have evolved
  over the past year" — gives intelligence users a reason to engage once a quarter

---

## 5. Revenue Model Obstacles

---

### 🟡 Price Sensitivity During Active Search

**The problem:** The users with the highest urgency (laid-off, packaged out) are also often the
most price-sensitive. They've lost their income. Charging $149-249/month to someone with a
4-month severance runway feels risky to them.

**What needs to happen:**
- Offer a "Job Seeker" monthly option at $99 with a clear "cancel anytime, no questions asked" policy
- Consider a "Results Guarantee": if you don't get at least one interview in 60 days, the
  next 30 days are free — reduces perceived risk, forces product quality
- Annual plan at 20% off works for intelligence lookers; actively searching users won't commit annually

---

### 🟡 Outplacement Firm Sales Cycle is Long

**The problem:** The B2B outplacement firm channel has the best unit economics but the worst
sales velocity. Enterprise procurement at a Lee Hecht Harrison or RiseSmart involves:
legal review of your ToS and data practices, IT security review, procurement approval, pilot
program negotiation, and contract. This can take 6-18 months from first contact to revenue.

**Why it matters:** You cannot count on B2B revenue while building the product. It will not arrive
when you need it.

**What needs to happen:**
- Pursue B2C revenue first to prove the product and generate cash flow
- Pursue smaller, independent career coaches (1-10 clients) as the early B2B channel —
  faster decisions, personal relationships, $349-599/month
- Treat enterprise outplacement firms as Year 2 revenue, not Year 1

---

### 🟢 Stripe and Payment Infrastructure

**The problem:** Subscription billing has edge cases: failed payments, dunning, plan upgrades
and downgrades, proration, annual plan management, refund policy.

**What needs to happen:**
- Use Stripe Billing with Stripe's built-in dunning management (retries on failed payments)
- Have a clear refund policy — "cancel anytime" is sufficient; no refunds on completed months
  is standard for SaaS
- Build a customer portal (Stripe provides this) so users can manage their own subscription
  without emailing support

---

## 6. Competitive Obstacles

---

### 🔴 LinkedIn Adding AI Career Features to Premium

**The problem:** LinkedIn has 1 billion users, the world's largest professional network graph,
every job posting ever made, and the resources to build any feature you build. They are
actively adding AI to LinkedIn Premium. If they ship a "career coach" feature that is "good enough,"
your addressable market shrinks significantly.

**Why it matters:** This is an existential risk if it materializes. It is not hypothetical —
LinkedIn has explicitly announced AI career coaching features.

**What needs to happen:**
- Do not compete where LinkedIn has structural advantages: job discovery, network connections,
  InMail volume
- Compete where LinkedIn is structurally weak: monitoring non-LinkedIn career pages,
  managing recruiter relationships across firms, persistent coaching memory across months
- Build the parts of the product that require data LinkedIn doesn't have: your pipeline
  state, your follow-up history, your specific target company list
- Niche positioning (executive search, specific sector) reduces the likelihood that a
  mass-market LinkedIn feature eliminates your specific use case

---

### 🟡 Well-Funded Direct Competitors

**The problem:** Sonara ($5M+ raised, auto-apply focus), Teal ($10M+ raised, job tracker +
AI resume), Simplify (growing fast, free model) — these companies have capital, teams, and
distribution you do not have at launch.

**What needs to happen:**
- Do not race Sonara on auto-apply volume — that is their moat and you cannot win it
- Do not race Teal on job tracking UX — they have a 3-year head start
- Compete on the dimension none of them own: targeted company monitoring + AI coaching
  that knows your full search context
- Stay narrow at launch — being the best product for executive job seekers is more defensible
  than being a worse version of Teal for everyone

---

### 🟡 Jack and Jill AI — The Free Two-Sided Marketplace

**The problem:** Jack and Jill AI ($20M seed, October 2025, led by Creandum — early backer
of Spotify and Klarna) is a two-sided AI recruitment marketplace: Jack (job seeker AI) and
Jill (employer AI). **Completely free for candidates.** Employers pay 10% of first-year
salary on successful hire only. Founded by Matthew Wilson (Omnipresent, $120M raised,
$600M valuation in 3 years) and Saaras Mehan (YC-backed CTO). 130,000+ registered
candidates, 1,000+ employer clients, expanding to the US from London. Anthropic and
ElevenLabs representatives are angel investors.

Their model bypasses ATS entirely: a 20-minute conversational AI interview builds a rich
candidate profile, and when an employer match exists in their Jill network, the candidate
receives a warm direct introduction to the hiring manager. They are not an auto-apply tool.
They share SM's "quality over volume" philosophy — but from the employer's side, not the
candidate's side.

**Why it matters:** The free-for-candidates model creates direct top-of-funnel pricing
pressure. A mid-career professional comparing SM ($199/month) against JaJ (free, warm intros,
conversational onboarding) will make that comparison before they have experienced SM's
differentiated value. The comparison happens at acquisition, not at retention. JaJ also has
a CVSS 9.8 security vulnerability that was publicly disclosed in January 2026 and patched —
but their two-sided employer network means user profile data is structurally visible to
Jill's matching system, which is a material concern for executives in confidential searches.

**What needs to happen:**
- Do not compete on price — compete on control and timing: "JaJ waits for an employer
  to want you. Starting Monday gets you there first, before the mandate exists."
- Launch the free public LinkedIn Optimizer (startingmonday.app/optimize, no account
  required) as the zero-friction acquisition counter-move — captures users before they
  default to JaJ
- Own the executive segment explicitly — JaJ targets engineers, marketers, and operators
  at startups. The CIO/CTO/CHRO executive market operates through retained search firms
  that have nothing to do with JaJ's employer network. This category is structurally
  inaccessible to JaJ's matching model.
- Own the "before the mandate" positioning — SM's triggering event intelligence surfaces
  opportunities 4–8 weeks before any employer would create a Jill hiring brief. This is
  not a feature advantage; it is a structural timing advantage.
- Market the privacy differentiator explicitly: "Your search stays yours. No employer
  network sees your profile until you reach out." This is a direct counter to JaJ's
  structural data exposure and their January 2026 security incident.
- Monitor JaJ's US expansion — if they build Jill employer relationships at the Director
  and VP level, the competitive overlap with SM's Active tier increases materially.
  Reassess at Phase 3 planning.

---

### 🟢 Career Coaches as Skeptics and Potential Allies

**The problem:** Human career coaches may view this product as competition and actively
discourage their clients from using it. They have direct relationships with the exact
clients you want.

**What needs to happen:**
- Position the Coach tier as "for career coaches" not "replacing career coaches"
- The product makes coaches more productive (10 clients instead of 5) — that is the pitch
- Find 2-3 early-adopter coaches who want to be pioneers; build features with their feedback;
  use them as case studies for other coaches
- A career coach who uses and endorses the platform is your highest-value referral channel

---

## 7. Operational Obstacles

---

### 🔴 Solo Founder Bandwidth

**The problem:** Building a multi-tenant web app, maintaining scrapers, running Claude API
integrations, doing customer support, writing content for acquisition, managing Stripe,
and selling to outplacement firms simultaneously is more than one person can do at quality.
Something will be neglected. Usually it's customer support or scraper maintenance — the
two things most likely to drive churn.

**Why it matters:** The $25K MRR goal requires sustained quality across all of these
functions simultaneously. Neglecting any one of them creates a drag that slows the others.

**What needs to happen:**
- Phase the build: Phase 1 requires no customer support (5 beta users you communicate
  with directly). Phase 2 requires a part-time contractor for scraper maintenance.
  Phase 3 (web product launch) requires at least one additional person — developer or
  customer success.
- Automate everything automatable before adding users: onboarding emails, Stripe webhooks,
  scan failure alerts, churn warning triggers
- Budget for a contractor for scraper maintenance from month 1 of paying users —
  this is not optional at scale

---

### 🟡 Customer Support Load for Anxious Users

**The problem:** Job seekers are anxious. When the scanner misses something, when Claude
gives a bad answer, when a follow-up doesn't send — they email support immediately.
The emotional stakes of a job search mean support tickets carry more weight than a typical
SaaS product.

**What needs to happen:**
- Build proactive transparency: if a scan fails, tell the user before they notice
- FAQ and self-service documentation covering the most common questions
- Set response time expectations clearly (within 24 hours, not immediately)
- Consider a community (Slack or Discord) where users help each other — reduces support
  load and increases retention

---

### 🟢 Claude API Cost Management

**The problem:** Claude API usage is charged per token. If users have long conversations,
large pipeline contexts, or run many resume tailoring requests, costs can grow faster
than revenue at low user counts.

**What needs to happen:**
- Use Haiku for batch operations (scan scoring, basic follow-up reminders)
- Use Opus only for high-value interactions (full chat, daily briefing generation,
  outreach drafting)
- Set per-user daily token budgets and rate limits — prevents one power user from
  running up $200/month in API costs on a $99/month subscription
- Monitor cost per user monthly; if it exceeds 20% of subscription revenue, reprompt or
  add limits

---

## 8. Timing and Market Obstacles

---

### 🟡 Job Market Cycles Affect Demand

**The problem:** In a hot job market (2021 style), employers come to candidates — demand
for job search tools drops. In a down market (2023-2024 style), everyone is searching —
demand is high but willingness to pay falls with income uncertainty. The market the
product launches into significantly affects growth trajectory.

**What needs to happen:**
- The intelligence looker tier is the counter-cyclical hedge: even in a hot market, people
  monitor for better opportunities
- Position the product as a career management tool (always-on), not just a job search tool
  (point-in-time) — reduces cyclicality
- Price the Monitor tier low enough ($49) that it survives as an intelligence subscription
  even when urgency is low

---

### 🟡 Window to Differentiate is Narrowing

**The problem:** AI is being added to every career product simultaneously. The window during
which "AI-powered" is a differentiator rather than table stakes is shrinking. By 2027,
every career tool will have Claude or GPT somewhere in it.

**Why it matters:** The defensible moat is not the AI — it is the proprietary data (your
users' pipeline, their target companies, their search history) and the product design that
makes the AI contextually relevant. The AI is the engine; the product is the car.

**What needs to happen:**
- Build the data flywheel early: the longer a user is on the platform, the better the
  product knows them — this is not replicable by a competitor starting fresh
- Collect aggregate anonymized data across searches: "what works" patterns by role type,
  sector, and company stage — this becomes proprietary market intelligence that only
  your platform can generate
- Launch before the window fully closes: 2026 is a viable window; 2028 may not be

---

## 9. Ethical Obstacles

---

### 🟡 Setting Realistic User Expectations

**The problem:** Job seekers are vulnerable and motivated. They will want to believe the
product will get them a job. If the marketing implies that, and many users don't land —
which is statistically inevitable — you face refund demands, negative reviews, and
reputational damage.

**What needs to happen:**
- Never promise outcomes (a job, a salary level, a specific timeline)
- Be explicit: "We help you run a better search. Landing is up to you."
- Set realistic timelines in onboarding: "Executive searches average 4-6 months.
  We'll help you move faster, but we won't compress that to 3 weeks."
- Build case studies around process improvement, not just placement outcomes

---

### 🟢 Risk of Automated Outreach Looking Spammy

**The problem:** If the platform makes it too easy to send outreach to large numbers of
people, users will over-send. Mass automated outreach burns relationships and reflects
badly on the platform if recipients associate it with spam.

**What needs to happen:**
- The platform should draft and queue messages, not auto-send them — user must approve
  each message before it goes
- Build quality controls: "We recommend sending no more than 5 new recruiter outreach
  messages per week"
- Educate users on the difference between targeted outreach (what the product supports)
  and spam (what it doesn't)

---

## Priority Order: What to Solve First

The obstacles above are not equally urgent. Solving them in the wrong order wastes resources.

### Must solve before first paying customer:
1. Multi-tenancy architecture and data isolation
2. Remove IT Leaderboard credential automation
3. Privacy Policy and Terms of Service (real, attorney-reviewed)
4. Scraper failure detection and alerting
5. Claude prompt quality for core features (briefing, outreach drafting)

### Must solve before 50 paying customers:
6. Onboarding wizard (completion rate and first-value delivery)
7. Stripe subscription billing with dunning management
8. Mobile-responsive web UI
9. User data export and deletion (GDPR minimum)
10. Scraper maintenance contractor or process

### Must solve before $25K MRR:
11. Consistent acquisition channel (organic SEO, referral program, or coach partnerships)
12. Intelligence looker tier to stabilize churn
13. LinkedIn / competitive differentiation positioning locked down
14. Customer support process (tickets, SLA, self-service docs)
15. Claude API cost-per-user monitoring and limits

---

## The Honest Bottom Line

The path to $25K MRR is not blocked by any single unsolvable obstacle. Every item on this
list has a known solution. The risk is underestimating the cumulative weight of solving
all of them simultaneously as a solo founder while also building the product and acquiring customers.

The most common failure mode for products like this is not a fatal flaw — it is running out
of time and energy before reaching escape velocity. The scraper breaks, the support queue
fills, the prompts drift mediocre, and the founder burns out at 30 users.

The antidote is sequencing: solve the critical path obstacles first, launch to a small
beta with 5-10 users before building the full web product, and validate that real people
will pay real money before investing in the features that require the most engineering effort.

$25K MRR is achievable. The timeline is 18-24 months from a working MVP, assuming
consistent execution and a viable acquisition channel. The two variables most outside
your control are acquisition channel effectiveness and whether LinkedIn ships a competitive
feature before you reach critical mass.
