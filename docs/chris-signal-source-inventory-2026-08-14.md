# Signal Source Inventory and Decision Quality

**Audience:** Chris
**Date:** 2026-08-14
**Status:** Point-in-time inventory, verified against the repository (`config/signal-source-catalog.json`, `worker/signals/`, `worker/jobs/`, `worker/index.js`)

## Purpose

This document answers four questions precisely:

1. What signal sources does the system collect today?
2. What is in the process of being collected?
3. What could be collected but deliberately is not, and why?
4. How is decision quality measured now, and how should it be measured on an ongoing basis?

The companion overview document describes *how* the scanner works. This document is the complete accounting of *what feeds it* and *how we know it is making good calls*.

## Headline

The system collects more than its own catalog and overview document describe. The verified totals:

| Category | Count |
| --- | --- |
| Collected today (active streams) | **19** |
| In process of collecting (planned, catalogued) | **5** |
| Identified but deliberately not collected | **12** |
| **Total identified signal universe** | **36** |

## 1. Collected Today — 19 Streams

### Catalogued and active (11)

These are registered in `config/signal-source-catalog.json` with status `active` and enforced at runtime by a fail-closed source registry: a fetcher runs only if the source is explicitly allowed by both source status and rights status.

| # | Source | Access method | Rights status |
| --- | --- | --- | --- |
| 1 | Company press releases / press rooms | RSS + web | Public |
| 2 | SEC filings (8-K, 10-K, 10-Q) | EDGAR API | Public |
| 3 | Google News company coverage (GNews API, RSS fallback) | API / RSS | Public, with paid-tier requirement before commercial launch |
| 4 | PR wire services (PRNewswire, BusinessWire, GlobeNewswire) | RSS / web | Public |
| 5 | Business journals network | RSS / web | Public |
| 6 | Technology trade press | RSS / web | Public |
| 7 | Regulatory calendar | Curated | Public |
| 8 | Crunchbase funding rounds | API | Licensed |
| 9 | PDL executive enrichment snapshots | API | Licensed, aggregation-restricted |
| 10 | PredictLeads company events | API | Licensed, attribution required |
| 11 | Apollo executive snapshot diffs (leadership changes) | API | Licensed, publication-restricted |

### Implemented but not yet catalogued (8)

These streams run in production workers but do not appear in the source catalog or the overview document. They should be added to the catalog so the compliance registry governs them explicitly.

| # | Source | Implementation | Cadence |
| --- | --- | --- | --- |
| 12 | Career pages (static fetch + Browserless rendering) | `worker/scanner/scan-company.js` | 3x/week standard; daily + evening for Executive tier |
| 13 | ATS structured JSON feeds (Greenhouse, Lever, Ashby) | `worker/signals/fetch-ats-json.js` | Daily |
| 14 | WARN notices (state layoff filings, XLSX/CSV) | `worker/signals/fetch-warn-notices.js` | Daily |
| 15 | SEC Form 4 insider open-market sales (≥$100K, departure precursor) | `worker/signals/fetch-sec-insider.js` | With signal job |
| 16 | SEC DEF 14A proxy board-change extraction | `worker/signals/fetch-sec-proxy.js` | With signal job |
| 17 | SEC 13D activist-investor filings (high-signal fund list) | `worker/signals/fetch-sec-activist.js` | With signal job |
| 18 | SEC DEF 14A officer-table year-over-year diffs (appointment proof) | `worker/signals/fetch-sec-officers.js` | With signal job |
| 19 | Sector executive-appointment news by role family | `worker/signals/fetch-sector-news.js` | Weekly (industry pulse) |

### Derived layers (not raw collection)

Built on top of the 19 streams: SEC filing-trend detection, cross-signal correlation within a time window, person-level signal derivation, outcome labels (`career_scan` role openings), and precursor statistics.

## 2. In Process of Collecting — 5

Catalogued with status `planned`, not yet implemented:

1. Earnings call transcripts (licensed feed)
2. Engineering blog posts
3. Job posting velocity
4. Incident postmortems
5. Open-source activity

## 3. Could Collect but Do Not — 12, With Reasons

| Source | Reason not collected |
| --- | --- |
| LinkedIn profiles, jobs, posts | Terms of service prohibit scraping; litigation risk; the product deliberately avoids authenticated boards and user credentials for third-party sites |
| Glassdoor / Indeed reviews and postings | Terms of service and aggregation licensing restrictions |
| Paywalled premium press (WSJ, Bloomberg, FT) | Republication and licensing cost; free-tier text reuse prohibited |
| X/Twitter, Reddit, Hacker News chatter | API cost, high noise, low per-signal precision for executive hiring |
| Patent and trademark filings (USPTO) | Public and feasible; weak link to leadership openings; not prioritized |
| Court and litigation records (PACER) | Per-document cost; sparse relevance |
| Government contract awards (SAM.gov, USAspending) | Public and feasible; not yet prioritized |
| SEC Form D / 13F | Feasible with existing EDGAR plumbing; 13F is noisy, Form D is low-volume for the target segment |
| International registries (Companies House UK, EU equivalents) | US-first scope decision |
| Conference speaker lists, podcasts, webinar transcripts | Transcription and extraction cost versus yield |
| Web traffic and app-ranking vendors (Similarweb and similar) | Data licensing cost; weak precursor evidence |
| Executives' personal social activity | Privacy and ethics boundary — the product watches companies, not people's personal feeds |

The reasons cluster into five categories: **legal/terms of service** (4), **licensing cost** (3), **signal quality** (3), **scope prioritization** (2), and **ethics** (1). Every exclusion is a decision, not an oversight.

### Usage restrictions on collected sources

Three collected sources carry active compliance constraints, tracked in the catalog's compliance-audit metadata:

- **GNews:** paid tier required before commercial product launch (deadline 2026-10-01); article text republishing prohibited.
- **People Data Labs:** derivative datasets and published predictive models prohibited; PDL-enriched signals are excluded from public aggregates and published calibration rates. Internal-only calibration is the documented workaround.
- **Apollo:** org-diff insights cannot be published or made user-facing without written approval; escalation to Apollo legal is pending. Internal precursor statistics are allowed.

## 4. Measuring Decision Quality

### What runs today

The measurement machinery already exists and is scheduled. The gap is a unified scorecard, not new instrumentation.

| Metric | Mechanism | Cadence |
| --- | --- | --- |
| Precision, recall, false positives/negatives, median lead time (days) | Pattern backtest job | Weekly |
| Precursor-to-opening hit rates (Laplace-smoothed for small samples) | Precursor stats job | Daily |
| Detection lead versus public posting date | Search-lag stats job | Weekly |
| False-negative verification (missed roles re-fetched and labeled) | Scanner miss verifier | Scheduled |
| Vendor data quality | Provider quality audit | Every 6 hours |
| Per-source pipeline health (classify failures, signals written/skipped, dedup merges) | `source_run_metrics` table, populated every job run | Every run |
| Signal-to-action rate (outreach, brief, or contact add within 48h of a signal) | Admin dashboard panel | Live |
| SEC ingestion freshness SLO | EDGAR freshness audit + hourly watchdog | 6h / 1h |

### The ongoing scorecard (per source, per month)

1. **Precision** — verified true positives ÷ alerts surfaced. Ground truth from the backtest plus user dismiss/suppress actions.
2. **Recall proxy** — verifier-confirmed misses ÷ (matches + verified misses). The only honest recall available without full-market ground truth.
3. **Lead time** — median days between our detection and the public posting date. This is the product's core promise; trend it.
4. **Freshness SLO adherence** — actual ingest latency versus each source's declared `freshnessSloHours`.
5. **Action rate** — percentage of signals that drive a user action within 48 hours. A high-precision source nobody acts on is not earning its cost.
6. **Cost per verified signal** — API and compute spend ÷ verified true positives. This decides which planned sources get funded next.
7. **Calibration** — bucket AI fit scores into deciles and compare predicted versus observed match confirmation; recalibrate when any decile drifts more than 10 points. PDL-derived signals stay out of any published calibration per the license.

### Governance loop

The catalog already specifies a 30-day review cadence. Attach the scorecard to that monthly review, and retire or demote any source that stays below a precision floor (recommended: 60%) for two consecutive reviews.

## Recommended Actions

1. Add the 8 uncatalogued streams to `config/signal-source-catalog.json` so the fail-closed registry governs them explicitly.
2. Resolve the Apollo escalation and the GNews paid-tier decision before commercial launch.
3. Stand up the monthly per-source scorecard using the seven metrics above; the data is already being written.
