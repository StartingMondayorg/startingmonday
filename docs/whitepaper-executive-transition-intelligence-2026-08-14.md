# The Executive Transition Intelligence System

## A Whitepaper on Starting Monday, MandateSignal, and the Signal Engine

**Version:** 1.0
**Date:** 2026-08-14
**Author:** Richard Rothschild (with engineering and strategy inputs)
**Distribution:** Internal reference only. For the founder's use, as a guide for internal work, and for Chris's reference. Not for external distribution.

---

## Executive Summary

Every executive leadership transition is preceded by public evidence: an activist filing, insider sales, a board change, a funding round, a layoff notice, a spike in leadership postings on a career page. That evidence is scattered across dozens of sources, arrives in inconsistent formats, and is only valuable inside a narrow window before the transition becomes a public job posting.

This whitepaper describes a system that collects that evidence once and sells its value twice:

- **Starting Monday** turns the evidence into relationship actions for executives and their coaches — who to contact, why now, what to say, and what to do next.
- **MandateSignal** turns the same evidence into mandate leads for boutique executive search firms — proof that a search is opening, delivered before the posting.

The system currently collects **19 active signal streams**, has **5 more planned**, and has deliberately declined **12 others** for legal, cost, quality, scope, or ethical reasons — a fully accounted universe of 36. Decision quality is measured by scheduled backtests (precision, recall, lead time), verified-miss auditing, per-source pipeline metrics, and a signal-to-action rate, with a defined monthly scorecard for ongoing governance.

The strategic asset is not any single fetcher. It is the growing labeled dataset connecting precursor events to leadership outcomes — a moat that compounds with every customer and cannot be bought off the shelf.

---

## Part I — The Product Thesis

### 1. The center of gravity: relationship building

The scanner is not the end goal. It is the timing and context engine for a relationship-building system.

A job alert tells someone a role exists. Starting Monday helps an executive become credible before, during, and after that role becomes public. The core loop:

1. **Watch the market.** Scan target companies, roles, leadership changes, funding, expansion, and other public signals.
2. **Choose the right person.** Connect a signal to existing contacts, suggested people to reach, coaches, and recruiters.
3. **Create a credible reason to reach out.** Ground outreach in the signal, company context, and the user's positioning.
4. **Take the relationship action.** Draft or send outreach, add to pipeline, schedule follow-up, record the conversation.
5. **Protect follow-through.** Follow-up dates, calendars, reminders, and the daily briefing keep momentum alive.
6. **Learn and compound.** Contact history, touchpoints, and outcomes strengthen the context base for the next conversation.

The relationship workflows already in the product: contacts and relationship records, People to Reach, the Outreach Hub (draft, review, send, suppress, reconcile, measure), the Follow-Up Manager and calendar, company and pipeline context, briefing and coaching rhythm, and board-track long-horizon cadence.

### 2. The product in one sentence

Starting Monday is a relationship-building operating system for executive search, with an intelligence layer that monitors target companies, detects relevant leadership roles and precursor signals, and turns those signals into specific conversations, follow-ups, and pipeline actions.

MandateSignal is the same intelligence, packaged for the other side of the transaction: the search firm that will run the mandate.

### 3. Why one event sells twice

A single verified precursor is valuable to the executive who wants the relationship before the role is public, and to the search firm that wants to win the mandate to fill it. The two buyers do not compete, the collection cost is paid once, and both products' usage produces labels that improve the shared engine. One intelligence cost base; two non-conflicting revenue lines; compounding data.

---

## Part II — The Intelligence Layer

### 4. Signal source inventory

The verified totals, as of this writing:

| Category | Count |
| --- | --- |
| Collected today (active streams) | **19** |
| In process of collecting (planned, catalogued) | **5** |
| Identified but deliberately not collected | **12** |
| **Total identified signal universe** | **36** |

#### 4.1 Collected today

Eleven streams are registered in the source catalog and enforced by a fail-closed runtime registry — a fetcher runs only when its source and rights status are explicitly allowed:

company press releases and press rooms; SEC filings (8-K, 10-K, 10-Q); Google News coverage; PR wires (PRNewswire, BusinessWire, GlobeNewswire); business journals; technology trade press; a curated regulatory calendar; Crunchbase funding rounds; PDL executive enrichment snapshots; PredictLeads company events; and Apollo executive snapshot diffs.

Eight further streams are implemented in production workers but not yet catalogued (an identified governance gap):

career pages via static fetch and Browserless rendering; ATS structured JSON feeds (Greenhouse, Lever, Ashby); WARN layoff notices; SEC Form 4 insider open-market sales at or above $100K; SEC DEF 14A proxy board-change extraction; SEC 13D activist filings against a high-signal fund list; SEC DEF 14A officer-table year-over-year diffs (retroactive proof a search concluded); and sector executive-appointment news by role family.

On top of the raw streams sit derived layers: SEC filing-trend detection, cross-signal correlation within a time window, person-level signal derivation, outcome labels, and precursor statistics.

#### 4.2 Planned

Earnings call transcripts (licensed feed), engineering blog posts, job posting velocity, incident postmortems, and open-source activity.

#### 4.3 Deliberately not collected

Twelve sources were evaluated and declined. The reasons cluster into five categories:

- **Legal / terms of service (4):** LinkedIn profiles, jobs, and posts; Glassdoor and Indeed; paywalled premium press; authenticated recruiter boards. The scanner never uses a user's credentials for third-party sites.
- **Licensing cost (3):** premium press republication, web-traffic and app-ranking vendors, PACER litigation records.
- **Signal quality (3):** social chatter (X, Reddit, Hacker News), 13F institutional holdings, Form D private placements.
- **Scope prioritization (2):** patents and trademarks, government contract awards, international registries (US-first decision).
- **Ethics (1):** executives' personal social activity. The product watches companies, not people's personal feeds.

Every exclusion is a recorded decision, not an oversight.

#### 4.4 Compliance constraints on collected sources

Three active sources carry tracked restrictions: GNews requires a paid tier before commercial launch (deadline 2026-10-01) and prohibits article republication; PDL prohibits derivative datasets and published predictive models, so PDL-enriched signals stay out of public aggregates and published calibration; Apollo org-diff insights cannot be user-facing without written approval (escalation pending). These constraints are catalog metadata, part of launch governance, not footnotes.

### 5. How a job scan works

1. Select a due company (48-hour deduplication window on successful scans).
2. Check robots rules; a disallowed page is recorded as blocked, never silently treated as empty.
3. Choose the least expensive reliable fetch: structured ATS feed, then plain HTTP, then Browserless rendering for application shells.
4. Protect the fetch boundary: HTTP/HTTPS only; localhost, private ranges, and cloud metadata addresses rejected (SSRF defense).
5. Extract visible text; strip scripts, styles, markup.
6. Find candidate roles with bounded heuristics (candidates capped at 20).
7. Score fit with Claude Haiku against target titles, sectors, and the user's watch description; bounded score, match decision, one-sentence explanation; safe non-match fallback on failure.
8. Identify genuinely new matches (case-insensitive title memory).
9. Persist an auditable result — timestamp, status, hits, highest score, summary, and errors.
10. Surface the next action into alerts, the company page, the pipeline, outreach, and preparation workflows.
11. Create outcome labels: new leadership postings are recorded as role openings for later lead-time and precursor analysis.

### 6. Why the scanner is robust

Robustness comes from explicit fallbacks and failure states, not from assuming every page looks the same:

- **Layered acquisition:** ATS feeds → static fetch → Browserless rendering, with explicit blocked statuses distinguishing denial from emptiness.
- **Bounded, defensive behavior:** robots checks, SSRF rejection, timeouts, extraction limits, JSON-mode AI output with safe fallback, stored failures, tenant context on every write.
- **Duplicate and silent-failure controls:** 48-hour dedup, title memory, an administrative alert after three consecutive empty or failed scans, and UI states that distinguish "no URL," "blocked," and "in progress" from "no job exists."
- **Operational visibility:** structured logs for fetch strategy, ATS selection, candidate counts, matches, blocks, scoring errors, and completions; monitoring workflows that catch stale scheduled jobs.

### 7. Measuring decision quality

#### 7.1 Running today

| Metric | Mechanism | Cadence |
| --- | --- | --- |
| Precision, recall, FP/FN, median lead time | Pattern backtest job | Weekly |
| Precursor-to-opening hit rates (Laplace-smoothed) | Precursor stats job | Daily |
| Detection lead vs. public posting date | Search-lag stats job | Weekly |
| False-negative verification (missed roles re-fetched, labeled) | Scanner miss verifier | Scheduled |
| Vendor data quality | Provider quality audit | Every 6 hours |
| Per-source pipeline health | `source_run_metrics`, written every run | Every run |
| Signal-to-action rate (action within 48h of a signal) | Admin dashboard | Live |
| SEC ingestion freshness SLO | EDGAR freshness audit + watchdog | 6h / 1h |

#### 7.2 The ongoing scorecard (per source, per month)

1. **Precision** — verified true positives ÷ alerts surfaced.
2. **Recall proxy** — verifier-confirmed misses ÷ (matches + verified misses).
3. **Lead time** — median days between detection and public posting. The core promise; trend it.
4. **Freshness SLO adherence** — actual latency vs. declared per-source SLO.
5. **Action rate** — share of signals driving a user action within 48 hours.
6. **Cost per verified signal** — spend ÷ verified true positives; decides which planned sources get funded.
7. **Calibration** — AI fit scores bucketed into deciles, predicted vs. observed; recalibrate on >10-point drift. (PDL-derived signals excluded from published calibration.)

Governance: the catalog's 30-day review cadence carries the scorecard; any source below a 60% precision floor for two consecutive reviews is demoted or retired.

---

## Part III — The Business

### 8. MandateSignal: the revenue priority

Founder-led, lead-led, low-volume precision. The prospecting message is trigger-gated on a real, provable lead — the lead *is* the message. Pricing: a $250 pilot converting to a per-mandate subscription at $1,000/mandate/month, pilot credited on conversion. Target model: ~100 customers → $100K MRR. The addressable pool is a few hundred boutiques per niche, and niches do not refill when burned — so recruiter lists are frozen out of volume tooling and every send is founder-reviewed.

### 9. Starting Monday: the channel and volume product

Product-led with outsourced-mechanical operations. Public tiers Monitor / Active / Executive; the trial grants active-tier behavior with the first briefing the next day; standard cadence three scans per week, Executive tier daily plus evening. Channels: coach-network nurture, signal-triggered executive outreach using the product's own briefing data, executives-in-transition lists, and a formalized 20% first-year referral commission. Operating budget held under $4K/month until 10 paying customers establish real CAC.

### 10. The flywheel and the moat

Signals are collected once. Starting Monday converts them into briefings and relationship actions; MandateSignal converts them into mandate leads and briefs. Every brief is simultaneously delivery and marketing ammunition (anonymized proof posts). Every action, verified hit, verified miss, and outcome label improves precision, lead-time evidence, and calibration — which strengthens the next provable claim, which closes the next pilot.

The moat is the label store: the historical dataset connecting precursor events, leadership changes, job openings, role families, and time-to-opening. Fetching today's news is commodity work; years of verified precursor-to-outcome labels are not.

### 11. Operating discipline

- **Two products, one engine, never merged:** separate databases, deployments, customer data, and releases; only approved aggregate learning artifacts cross the boundary.
- **Evidence states govern claims:** CLAIMED → IMPLEMENTED → TESTED → DEPLOYED → MEASURED, with BLOCKED_EXTERNAL tracked explicitly. Repository inspection alone never establishes deployed or measured status.
- **Pre-registered metrics and kill rules:** targets and gates are set before the data arrives; volume is never the answer to underperformance.
- **Compliance as a launch control:** per-source rights metadata, a fail-closed source registry, and tracked vendor restrictions with owners and deadlines.
- **Calibration gates before claims:** no published prediction or performance claim until the calibration gate passes.

---

## Part IV — Boundaries, Status, and Roadmap

### 12. Honest boundaries

- The system scans public pages and feeds; it cannot guarantee access to a site that blocks automation. A blocked page is an operational state, not proof no role exists.
- A career-page scan detects postings; it does not predict with certainty that a company will open a role.
- AI scoring prioritizes candidate review; it is not a hiring decision or a guarantee of fit.
- Results depend on career-URL quality, target-profile quality, source availability, and worker freshness.
- Third-party source terms and commercial-use restrictions remain part of launch governance.

Known risks — career-page redesigns, anti-bot systems, missing coverage, source-specific terms — are mitigated by layered fetching, explicit failure reporting, compliance metadata, user transparency, and manual-review fallback.

### 13. Engineering status (as of 2026-08-14)

The Codebase Health Remediation initiative (Security Hardening, Technical Debt Reduction, Agent Fleet Buildout, Observability/SLOs/Release Gates) has closed its major implementation gates: strict API guard audit at zero true auth gaps, nonce-based CSP deployed and verified in production, forwarded-header rate-limit hardening, Sentry release identity keyed to the deploy SHA, the tier-0 accessibility gate, the placeholder-test debt target met at 200, and the calibration and evidence workflows green. Remaining items are operational evidence that accrues over time — the two-week green-history window, staged ZAP and Sentry release-health runs pending external configuration, monitoring tier-1 coverage growth, and repository push-protection settings.

### 14. Roadmap through the intelligence lens

1. Catalog the eight uncatalogued streams so the fail-closed registry governs everything that runs.
2. Resolve the Apollo approval and GNews paid-tier decisions ahead of commercial launch.
3. Stand up the monthly per-source decision-quality scorecard; the underlying data is already written every run.
4. Fund planned sources (earnings transcripts first) by cost-per-verified-signal, not enthusiasm.
5. Keep the public contract conservative until production cadence, alert latency, block-rate handling, and compliance evidence are measured.
6. Let the label store compound: every verified outcome is an asset no competitor can backfill.

---

## Closing

Starting Monday is not a job board, and MandateSignal is not a lead list. Together they are a private intelligence and execution layer for the executive transition market — one engine that watches public evidence with legal and ethical discipline, measures its own judgment, and converts timing into relationships on one side and mandates on the other. The remaining work is proof and operational maturity, not invention. That is the difference between a promising feature and a dependable intelligence business.
