# Product Intelligence — What You Need to Know

Read this after `03-project-overview.md`. It covers three things that don't appear in the codebase guide but shape every product decision: the intelligence scanner, the synthetic council, and the arc personas. You will not understand the product's direction without understanding these three systems.

---

## Part 1 — The Intelligence Scanner

### What It Is

The intelligence scanner is a background worker (`worker/jobs/signal-job.js`) that runs Monday, Wednesday, and Friday at 08:30 UTC. For each company a user is tracking, it pulls signals from multiple sources, classifies them with Claude Haiku, and writes the results to `company_signals`.

The goal is to give executives early warning of events that precede technology leadership searches — funding rounds, executive departures, PE acquisitions, board changes, regulatory pressure — before the search is announced publicly and before the role is posted.

### Current Active Sources

| Source | What It Captures | File |
|--------|-----------------|------|
| Google News / GNews | Company news by name | `fetch-company-news.js` |
| SEC EDGAR 8-K | Material events: leadership changes (5.02), acquisitions (2.01), restructuring | `fetch-sec-filings.js` |
| SEC EDGAR trend detection | Cross-filing patterns over 12 months | `detect-sec-trends.js` |
| People Data Labs (PDL) | Executive roster snapshots; departure/hire diffs | `fetch-pdl-execs.js` |
| Crunchbase | Funding rounds | `fetch-crunchbase-funding.js` |
| Company press rooms | Scraped newsroom articles | `fetch-press-room.js` |
| PR wire (Business Wire, PR Newswire, Globe Newswire) | Press releases via Google News RSS | `fetch-pr-wire.js` |
| Career pages | Job postings at tracked companies (Browserless) | `scan-company.js` |
| Signal correlation | Multi-signal pattern detection (60-day window) | `correlate-signals.js` |

Signal types written to `company_signals`: `funding`, `exec_departure`, `exec_hire`, `acquisition`, `expansion`, `layoffs`, `ipo`, `new_product`, `award`.

### What a Signal Looks Like in the DB

```
company_signals (
  id, user_id, company_id, signal_type, signal_summary,
  outreach_angle, outreach_draft, signal_date, source_url
)
```

The `outreach_angle` and `outreach_draft` are AI-generated on demand (server action in `signals/actions.ts`). They are not generated at scan time — only when the user requests them.

### The Intelligence Roadmap

The scanner is Phase 1. The intelligence roadmap (`docs/intelligence-roadmap.md`) lays out 8 epics that build toward a predictive model — one that tells an executive which companies are approaching a technology leadership search before any search firm is engaged.

| Epic | Theme | Status |
|------|-------|--------|
| E1 — EDGAR Foundation | Store CIK; add DEF 14A, 13-D, Form 4; PredictLeads integration | Sprint B |
| E2 — New Signal Sources | Trade press RSS, local business journals, conference circuit tracker | Sprint C |
| E3 — Executive History Database | Schema, EDGAR backfill (10yr), PDL enrichment | Sprint C-D |
| E4 — Historical Corpus Backfill | GDELT, Wikidata, Wayback, ProPublica | Sprint D |
| E5 — Expanded Company Intelligence | Board signals, PE portfolio timing, M&A windows | Sprint D |
| E6 — Tenure and Lag Models | Avg tenure by company/sector; search lag benchmarks | Sprint E |
| E7 — Pattern Fingerprinting v2 | Calibrated probability output per company | Sprint E-F |
| E8 — Relationship Graph | Warm path detection: user's contacts at alerted companies | Sprint F |

**The moat is not the current signals.** Any news aggregator can pull news. The moat is the departure-to-appointment database that accumulates over time — the dataset that lets the platform predict which companies are approaching a search and how long the search will take, based on historical patterns that no competitor has assembled.

### Key Known Gaps (High Priority)

- SEC CIK not stored permanently in `companies` table. Every scan re-runs a fuzzy name match against EDGAR. This risks mismatches and adds latency. (E1.1)
- DEF 14A proxy statements not fetched. Board composition change signals are missing. (E1.2)
- 13-D activist investor filings not monitored. Activist entry is a strong leading indicator of CIO change. (E1.3)
- PredictLeads partially integrated (`worker/signals/fetch-predictleads.js` exists, wired into `signal-job.js` conditionally) but `PREDICTLEADS_API_KEY` has not been provisioned yet. (E1.5)

---

## Part 2 — The Synthetic Council

### What It Is

The synthetic council is a structured prompt framework used for product, content, and engineering decisions. Instead of deciding in isolation, Rich routes significant decisions through a council of named advisors — each with a defined reasoning lens and set of principles — and forces disagreement between valid perspectives before synthesizing recommendations.

It is not a creativity exercise. It is a decision-quality system.

### The Councils

| Council | Use When Reviewing |
|---------|-------------------|
| Sales and Marketing | Landing page, blog posts, email copy, CTAs |
| Software and SRE | Architecture, codebase, deployment, reliability |
| UI UX and Product Design | Dashboard flows, onboarding, interaction patterns |
| Behavioral Economics | Retention mechanics, pricing page, activation, habit loops |
| Brand and Scaling | Positioning, growth strategy, acquisition channels |
| Decision Management | Major product decisions, roadmap prioritization |
| Revenue and Economics | Pricing, unit economics, SaaS metrics |
| Data Analytics | Metrics, event tracking, dashboards |
| HR and Legal | Contracts, compliance, hiring |

Member lists for each council are in `docs/content/[council-name]-synthetic-council.md`.

### How to Run a Council Review

The prompt templates are in `docs/content/council-review-process.md`. The short version:

1. Choose the council relevant to the decision.
2. Paste the council's member list and their principles into the prompt template.
3. Paste the content or decision to review.
4. For each member: Likes, Dislikes, Required change.
5. Synthesize: top 2-3 shared required changes, one thing to stop doing.

**Use the required change as your action item.** If all six members demand a change, do it first. If one member demands it, put it in the backlog.

### When You Would Use This

- Before shipping a significant UI change: run the UI/UX council.
- Before merging a new scanner or worker architecture: run the Software/SRE council.
- Before writing any user-facing copy: run the Sales and Marketing council.
- When Rich is weighing a roadmap decision: run the Decision Management council.

The Software and SRE council's members are engineers and site reliability practitioners. Their standards are the ones the codebase is held to. When in doubt about an architectural decision, paste the decision into the SRE council template and see what comes back.

---

## Part 3 — The Arc Personas

### Why This Matters for Engineering

Senior executives don't experience job search as a single event. They cycle through distinct identity states with different urgency levels, different feature needs, and different messaging requirements. Every product decision — onboarding flow, dashboard layout, email copy, nudge timing — should ask: which arc is this user in, and what does that arc need?

If you ship a feature without knowing which arc it serves, you are guessing. The arc model prevents that.

### The 9 Arcs

| Arc | Situation | Emotional Register | Product Fit |
|-----|-----------|-------------------|-------------|
| 1 — Satisfaction to Early Doubt | Still employed; something has shifted | Curious, low-urgency | Intelligence ($49) |
| 2 — Early Doubt to Active Consideration | Employed; a recruiter called; thinking seriously | Deliberate, cautious | Intelligence → Search |
| 3 — Active Consideration to Campaign Launch | Employed; decision made; quiet search underway | Focused, purposeful | Search ($199) |
| 4 — Post-Separation Emergency | Role eliminated; urgency high; clarity low | Anxious, reactive | Search + nurture onboarding |
| 5 — Early Active Search | 30-60 days in; conversations happening; getting disorganized | Energized | Search, full feature set |
| 6 — Mid-Search Plateau | 60-120 days; nothing has converted; optimism eroding | Quiet concern | Strategy brief, AI advisor |
| 7 — Late Search / Pressure Zone | 120+ days; financial pressure; risk of wrong role | Stressed | AI advisor for reality check |
| 8 — Offer and Negotiation | Offer in hand; evaluation and negotiation | High stakes | AI advisor offer evaluation |
| 9 — Post-Placement | Landed; new role started; will be back in 3-4 years | Re-established | Intelligence ($49) |

### The Three UX Paths

Derived silently from onboarding answers (employment status + search timeline). No extra question asked.

| Path | Derivation | What Changes |
|------|-----------|-------------|
| **campaign** | Active search OR employed and non-opportunistic | Fast onboarding; assumes campaign mindset; target list first |
| **nurture** | Between roles + immediately (post-separation) | Guided cadence; more context at each step; emotional register matters |
| **watcher** | Employed + opportunistic | Minimal onboarding; companies and monitoring only; low commitment framing |

`search_path` is written to the `user_profiles` table during onboarding. The dashboard reads it and shows arc-specific welcome cards for new users with empty pipelines.

### Stall Detection

A weekly cron job evaluates user activity patterns and triggers in-app nudges and emails when a user stalls. The nudge names the specific pattern and addresses its root cause — not a generic "your search has slowed."

| Pattern | Trigger | Root Cause Addressed |
|---------|---------|---------------------|
| Companies but no contacts | Pipeline exists; no contacts after 14 days | List exists, relationships not being worked |
| Contacts but no movement | Contacts exist; no stage advances; 14+ days inactive | Positioning anxiety — usually empty positioning summary |
| Full stall | Everything at watching/researching; 21+ days inactive | Targeting paralysis or outreach hasn't started |

### What This Means When Building Features

- A feature that serves Arc 4 (post-separation, high anxiety) must not add cognitive load. Fewer choices, not more.
- A feature that serves Arc 3 (quiet campaign) must reinforce discretion and competence framing. Never urgency.
- A feature that serves Arc 9 (placed executive) is a retention feature, not a search feature. The goal is to keep them on Monitor and get a referral.
- When you add a new in-app message or nudge, ask: which arc is this user in, and does this message match that arc's emotional register?

---

## Reading Order

If you have 2 hours before the first sync:

1. `docs/onboarding/03-project-overview.md` — what we are building and why
2. This document — the intelligence, council, and arc layers
3. `docs/onboarding/04-codebase-guide.md` — how the code is organized
4. `docs/intelligence-roadmap.md` — full detail on E1-E8 when you are ready to work on the scanner
5. `docs/content/council-review-process.md` — how to run a council review

The persona friction analysis (`docs/business/persona-friction-analysis.md`) and quality roadmap (`docs/business/persona-quality-roadmap.md`) are worth reading after your first week — they give the full context behind the sprint priorities.
