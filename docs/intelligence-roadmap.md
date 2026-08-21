# Starting Monday — Intelligence Scanner Roadmap

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: quarterly
Source of truth: yes

**Version 1.0 — May 10, 2026**
**Status: Canonical. Living document. Update as sprints complete and scope evolves.**

---

## First Principles

1. **Collect at the most granular level possible.** You can aggregate up. You can never disaggregate down. Every field skipped at collection time is a model feature permanently lost.
2. **Collect over the longest time horizon possible.** Historical data is the training set. The current signal is only valuable when you know what patterns preceded it.
3. **Public data is an underexploited moat.** EDGAR, GDELT, Wikidata, ProPublica, OpenCorporates, USASpending — these are free, lawful, and systematically ignored by most competitors. The moat is not access to data; it is the synthesis layer built on top of it over time.
4. **The departure event is not the signal. The departure event is the confirmation.** The signal is the 30-180 days of context before the departure that, in hindsight, pointed to it. The model learns to recognize that context in real time.
5. **The database improves with age and scale.** Every new departure-to-appointment pair added to the training set makes the lag model more accurate. Every new user adds relationship graph edges. This is a compound moat — it cannot be copied on day one.

---

## Intelligence Vision

Starting Monday becomes the definitive predictive intelligence platform for senior technology executive transitions. The platform knows — with calibrated probability — when a company is approaching a technology leadership search, how long that search will take, and who in the user's network has a warm path in, before any search firm is engaged and before any role is posted.

The output is not a data feed. It is a ranked, personalized, time-sensitive action list: these companies, in this order, for this reason, with this outreach approach, in this window.

---

## Current Scanner State (as of May 10, 2026)

### Active Sources

| Source | What It Provides | File | Status |
|--------|-----------------|------|--------|
| Google News / GNews | News articles by company | `fetch-company-news.js` | Live |
| SEC EDGAR 8-K | Material events: 5.02, 1.01, 2.01, 1.03, 8.01 | `fetch-sec-filings.js` | Live |
| SEC EDGAR trend detection | Cross-filing pattern analysis (12mo) | `detect-sec-trends.js` | Live |
| People Data Labs (PDL) | Executive roster snapshots, departure/hire diffs | `fetch-pdl-execs.js` | Live |
| Crunchbase | Structured funding rounds | `fetch-crunchbase-funding.js` | Live (requires `CRUNCHBASE_API_KEY`) |
| Company press rooms | Scraped newsroom articles | `fetch-press-room.js` | Live |
| PR wire (Business Wire, PR Newswire, Globe Newswire) | Press releases via Google News RSS | `fetch-pr-wire.js` | Live |
| Career pages | Job postings at tracked companies | `scan-company.js` (browserless.io) | Live |
| Signal correlation | Multi-signal pattern detection (60-day window) | `correlate-signals.js` | Live |

### Gaps in Current Implementation

| Gap | Impact | Priority |
|-----|--------|----------|
| CIK not stored in `companies` table | Re-runs fuzzy name match on every scan; mismatch risk | High |
| DEF 14A (proxy statements) not fetched | Missing board composition change signals | High |
| 13-D / 13-G filings not monitored | Missing activist investor early warning | High |
| Form 4 insider transactions not monitored | Missing exec share-sale pre-departure signals | Medium |
| PredictLeads not integrated | Missing job-posting-based exec change signals | High |
| Revelio Labs not integrated | Missing org-structure inference signals | Low (deferred) |
| No historical training dataset | Pattern fingerprinting lacks labeled data | Critical for Phase 3 |
| No executive history database | Tenure model, lag model cannot be built | Critical for Phase 3 |

---

## Data Source Inventory

### Tier 1 — Free, High-Coverage, Build Now

**SEC EDGAR Bulk Data**
- URL: `https://www.sec.gov/Archives/edgar/full-index/`
- Coverage: All US public companies, 1993–present
- Update frequency: Quarterly bulk index; real-time via EDGAR full-text search
- Forms of interest: 8-K (5.02, 13-D trigger references), DEF 14A, 13-D, 13-G, Form 4, SC 13F
- Key value: Executive departure/appointment for all US public companies; board composition; insider transactions; activist positions
- Cost: Free. SEC requires descriptive User-Agent with contact info.
- Build path: Expand `fetch-sec-filings.js` to include DEF 14A, 13-D, Form 4; store CIK permanently; build backfill script for 10-year history

**GDELT Project**
- URL: `https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/`
- BigQuery: `gdelt-bq.gdeltv2.events` and `gdelt-bq.gdeltv2.gkg`
- Coverage: ~100% of English-language global news, 2013–present; updates every 15 minutes
- Key value: Historical news context around executive events; CAMEO event code 017x = leadership change; pre-departure signal context for training data
- Cost: Free (BigQuery free tier: 1TB/month queries)
- Build path: One-time historical query for executive change events by company; ongoing ingestion for new events

**Wikidata SPARQL**
- URL: `https://query.wikidata.org/`
- Coverage: ~200,000 executive entities with employment records and dates; gold-standard quality
- Key value: Structured career histories for notable executives; free bulk download
- Cost: Free
- Build path: SPARQL query for all persons with CIO/CTO/CISO/CDO/COO positions, including employer and dates; load into `executive_positions`

**Wayback Machine CDX API**
- URL: `http://web.archive.org/cdx/search/cdx`
- Coverage: Historical snapshots of company websites, 2000–present
- Key value: Reconstruct executive team pages at specific dates; especially useful for private companies
- Cost: Free, rate-limited
- Build path: For private companies in `companies` table, query historical `/about/team` or `/leadership` pages; extract executive names by year

**ProPublica Nonprofit Explorer API**
- URL: `https://projects.propublica.org/nonprofits/api`
- Coverage: IRS Form 990 data for all US nonprofits, 2012–present
- Key value: Named executive compensation and service dates at healthcare systems, universities, foundations
- Cost: Free
- Build path: Query by EIN for healthcare system CIO/CTO/CISO history; load into `executive_positions`

**OpenCorporates / Companies House**
- URL: `https://api.opencorporates.com/`, `https://developer.company-information.service.gov.uk/`
- Coverage: 200M+ companies globally; UK Companies House = director appointment/resignation history, decades
- Key value: Private company director changes; international coverage
- Cost: OpenCorporates free tier; Companies House free API
- Build path: For UK-based target companies, pull director change history; map to `executive_positions`

**USASpending.gov**
- URL: `https://api.usaspending.gov/`
- Coverage: All federal contracts, grants, and awards, 2000–present
- Key value: Government contractor CIO changes correlate with major contract wins/losses; sector-specific leading indicator
- Cost: Free
- Build path: Tag companies in `companies` table as government contractors; monitor contract awards/expirations

**Patent Data (USPTO / Google Patents)**
- URL: `https://patentsview.org/api/`, `https://developers.google.com/patent-search`
- Coverage: All US patents, 1976–present
- Key value: Patent filing spikes signal technology strategy shifts that often require new tech leadership; cross-reference with EDGAR CIK
- Cost: Free bulk download; Google Patents API free tier
- Build path: Phase 3; load patent filing history by company assignee; detect strategy-shift spikes

### Tier 2 — Paid, High-Leverage, Build in Phase 2

**People Data Labs (PDL) — Career Enrichment**
- Already integrated for snapshot diffs (`fetch-pdl-execs.js`)
- Additional use: enrichment API for full career histories given executive names from EDGAR
- Build path: For each named executive in 8-K 5.02 historical backfill, call PDL enrichment API → store full career timeline in `executive_positions`
- Cost: Per-enrichment call; budget for backfill run separately

**PredictLeads**
- URL: `https://predictleads.com/api/v3`
- Auth: `X-Api-Key` header
- Key endpoints: `/companies/find?domain={domain}`, `/companies/{id}/executive_changes`, `/companies/{id}/hiring_signals`
- Coverage: Executive changes from job postings and LinkedIn monitoring; hiring velocity signals
- Distinction from PDL: PDL provides roster state (who is there now); PredictLeads provides change signals (who left, who joined, what are they hiring for)
- Cost: Per-credit; evaluate pricing against PDL for redundancy
- Build path: New file `fetch-predictleads.js`; wire into `signal-job.js`; deduplicate against PDL diffs on exec name + company + date

**Crunchbase Bulk / Enterprise**
- Currently integrated via API for funding rounds
- Additional value: Historical executive team data with approximate dates; company stage tagging
- Build path: If bulk export available, use to backfill company stage data in `executive_positions`

**Business Wire Historical Archive**
- Executive appointment press releases going back 20+ years
- Not a clean API but can be systematically searched and crawled
- Key value: Appointment events to match against EDGAR departure events for search lag computation

### Tier 3 — Deferred (Phase 3+)

**Revelio Labs**
- Infers org structure changes from LinkedIn at scale (legal, TOS-compliant)
- Provides: headcount by function and seniority, attrition rates, org restructuring signals
- Differentiation from PDL: org-level signals vs. individual-level
- Verdict: Additive but not critical given PDL + PredictLeads. Revisit at 10,000+ users.

**Boardex (Dow Jones/Factiva)**
- Premier executive and board relationship database; 2M+ executive career histories
- Backbone for the executive relationship graph (list item #1)
- Very expensive; evaluate licensing cost vs. build cost of own database
- Build path: Proof of concept after in-house executive history database reaches 50,000+ records

**PitchBook**
- Most comprehensive PE portfolio company executive data
- Cost: Enterprise licensing
- Deferred until the intelligence layer demonstrates clear value to users

---

## Core Schema Design

### Executive History Database

```sql
-- One record per executive
executive_profiles (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  first_name          text,
  last_name           text,
  linkedin_url        text unique,
  pdl_id              text unique,
  wikidata_id         text,
  education           jsonb,  -- [{school, degree, field, grad_year}]
  board_seats         jsonb,  -- [{company, role, start_date, end_date}]
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
)

-- One record per role at each company
executive_positions (
  id                   uuid primary key default gen_random_uuid(),
  executive_id         uuid references executive_profiles(id),

  -- Company identity
  company_name         text not null,
  company_cik          text,                   -- SEC CIK (public companies)
  company_domain       text,
  company_ein          text,                   -- EIN (nonprofits)

  -- Company attributes AT TIME OF TENURE
  company_sector       text,                   -- SIC 2-digit code
  company_sic_code     text,                   -- SIC 4-digit code (full granularity)
  company_subsector    text,
  company_hq_city      text,
  company_hq_state     text,
  company_hq_country   text default 'US',
  company_hq_metro     text,                   -- MSA / metro area

  company_stage        text,                   -- 'public_f500' | 'public_mid' | 'public_small' |
                                               --  'pe_backed' | 'vc_backed' | 'private' |
                                               --  'nonprofit' | 'gov_contractor'
  company_revenue_band text,                   -- '<50M' | '50-250M' | '250M-1B' | '1-10B' | '>10B'
  company_headcount_band text,                 -- '<100' | '100-500' | '500-2k' | '2k-10k' | '>10k'
  company_market_cap_band text,               -- public only
  company_growth_phase text,                  -- 'startup' | 'growth' | 'scale' | 'mature' |
                                               --  'declining' | 'turnaround'

  pe_firm              text,                   -- if pe_backed
  pe_deal_close_date   date,
  pe_deal_type         text,                   -- 'buyout' | 'carve_out' | 'growth' | 'recap'
  vc_series            text,                   -- 'seed' | 'a' | 'b' | 'c' | 'd' | 'growth'

  had_activist_investor  boolean default false,
  activist_firm          text,
  recent_m_and_a        boolean default false, -- M&A within 24 months of hire
  recent_ipo            boolean default false, -- IPO within 36 months of hire
  post_bankruptcy       boolean default false,

  -- Role
  title                text not null,
  title_normalized     text,                   -- 'CIO' | 'CTO' | 'CISO' | 'CDO_DATA' |
                                               -- 'CDO_DIGITAL' | 'COO' | 'CPO' | 'VP_TECH' | 'OTHER_C'
  seniority_level      text,                   -- 'c_suite' | 'svp' | 'vp' | 'director'
  is_board_role        boolean default false,
  reporting_to         text,                   -- 'CEO' | 'COO' | 'CFO' | 'CTO' | 'Board' | 'Other'
  direct_reports_band  text,                   -- '<5' | '5-25' | '25-100' | '>100'

  -- Tenure
  start_date           date,
  end_date             date,
  tenure_days          integer,                -- computed: end_date - start_date; null if current
  is_current           boolean default false,

  -- Departure context
  departure_type       text,                   -- 'voluntary' | 'forced' | 'retirement' |
                                               --  'acquisition' | 'internal_promotion' | 'unknown'
  departure_trigger    text,                   -- 'ceo_change' | 'activist' | 'post_acquisition' |
                                               --  'financial_distress' | 'strategy_shift' |
                                               --  'board_pressure' | 'personal' | 'unknown'
  departure_signal     text,                   -- how we detected it: 'edgar_8k_502' | 'press_release' |
                                               --  'pdl_diff' | 'predictleads' | 'wayback' | 'inference'
  sec_accession_number text,                   -- 8-K accession if source is EDGAR

  -- Succession
  successor_id         uuid references executive_positions(id),
  successor_type       text,                   -- 'internal' | 'external' | 'interim' | 'unknown'
  days_to_successor    integer,                -- departure to successor start_date
  predecessor_id       uuid references executive_positions(id),

  -- Market context at time of departure
  sp500_ytd_return     numeric(5,2),
  sector_ytd_return    numeric(5,2),
  interest_rate_env    text,                   -- 'low' | 'rising' | 'high' | 'falling'
  vix_quartile         integer,                -- 1-4 (market volatility at departure)

  -- Source and quality
  data_sources         text[],                 -- ['edgar_8k', 'businesswire', 'pdl', 'wikidata', ...]
  confidence_score     numeric(3,2),           -- 0.0-1.0
  source_urls          text[],

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
)

-- Derived: departure matched to subsequent appointment, search lag computed
exec_search_lag (
  id                   uuid primary key default gen_random_uuid(),
  departure_id         uuid references executive_positions(id),
  appointment_id       uuid references executive_positions(id),
  company_name         text,
  company_cik          text,
  company_sector       text,
  company_sic_code     text,
  company_stage        text,
  company_revenue_band text,
  title_normalized     text,
  lag_days             integer,                -- departure end_date to successor start_date
  replacement_type     text,                   -- 'internal' | 'external' | 'interim'
  search_year          integer,
  market_conditions    text,                   -- derived from sp500_ytd_return at departure
  created_at           timestamptz default now()
)

-- Computed: company-level tenure and search lag statistics
company_tenure_stats (
  id                   uuid primary key default gen_random_uuid(),
  company_name         text,
  company_cik          text,
  title_normalized     text,
  avg_tenure_days      integer,
  median_tenure_days   integer,
  p25_tenure_days      integer,
  p75_tenure_days      integer,
  avg_search_lag_days  integer,
  median_search_lag_days integer,
  external_hire_rate   numeric(4,3),           -- 0.0-1.0
  sample_size          integer,
  time_period_start    date,
  time_period_end      date,
  updated_at           timestamptz default now()
)

-- Computed: industry-level tenure and search lag statistics
industry_tenure_stats (
  id                   uuid primary key default gen_random_uuid(),
  sic_code             text,
  sector_name          text,
  company_stage        text,
  title_normalized     text,
  avg_tenure_days      integer,
  median_tenure_days   integer,
  avg_search_lag_days  integer,
  median_search_lag_days integer,
  external_hire_rate   numeric(4,3),
  sample_size          integer,
  time_period_start    date,
  time_period_end      date,
  updated_at           timestamptz default now()
)

-- Pre-departure signal context: what was happening before each departure
departure_signal_context (
  id                   uuid primary key default gen_random_uuid(),
  departure_id         uuid references executive_positions(id),
  signal_type          text,                   -- 'news' | 'gdelt_event' | 'funding' | 'ma' |
                                               --  'activist_entry' | 'ceo_change' | 'earnings_miss' |
                                               --  'regulatory_action' | 'layoffs' | 'board_change'
  signal_date          date,
  days_before_departure integer,               -- computed: departure_date - signal_date
  signal_source        text,
  signal_summary       text,
  source_url           text,
  created_at           timestamptz default now()
)
```

### EDGAR Enhancement

```sql
-- Add to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sec_cik text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sec_cik_padded text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sec_cik_resolved_at timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_public_company boolean;

-- Board composition snapshots (from DEF 14A)
board_snapshots (
  id             uuid primary key default gen_random_uuid(),
  company_cik    text,
  company_id     uuid references companies(id),
  snapshot_year  integer,
  directors      jsonb,   -- [{name, role, committees[], bio_snippet, tenure_years}]
  filed_at       date,
  created_at     timestamptz default now(),
  unique(company_cik, snapshot_year)
)

-- Board changes detected between snapshots
board_changes (
  id             uuid primary key default gen_random_uuid(),
  company_cik    text,
  company_id     uuid references companies(id),
  change_type    text,   -- 'new_director' | 'director_departure' | 'committee_chair_change'
  director_name  text,
  prior_role     text,
  new_role       text,
  committee      text,
  detected_date  date,
  created_at     timestamptz default now()
)

-- Activist investor filings (13-D, 13-G)
activist_filings (
  id              uuid primary key default gen_random_uuid(),
  company_cik     text,
  company_id      uuid references companies(id),
  filer_name      text,
  filing_type     text,    -- '13-D' | '13-G'
  percent_owned   numeric(5,2),
  filed_at        date,
  accession_number text,
  is_known_activist boolean default false,
  activist_pattern text,   -- historical pattern: 'management_change' | 'sale_pressure' | 'passive'
  created_at      timestamptz default now()
)
```

---

## Epic Overview

| Epic | Name | Theme | Sprint Target |
|------|------|--------|--------------|
| E1 | EDGAR Foundation | Store CIK; add DEF 14A, 13-D, Form 4; PredictLeads | Sprint B |
| E2 | New Signal Sources | Business wire history; trade press; local business journals | Sprint C |
| E3 | Executive History Database | Schema, EDGAR backfill, PDL enrichment | Sprint C-D |
| E4 | Historical Corpus Backfill | GDELT, Wikidata, Wayback, ProPublica, EDGAR 10yr | Sprint D |
| E5 | Expanded Company Intelligence | Board signals, PE portfolio, M&A timing, regulatory calendar | Sprint D |
| E6 | Tenure and Lag Models | Compute stats, surface in UI as context for signals | Sprint E |
| E7 | Pattern Fingerprinting v2 | Company archetype features, calibrated probability output | Sprint E-F |
| E8 | Relationship Graph Foundation | User-added contacts, warm path surface in alerts | Sprint F |

---

## E1 — EDGAR Foundation + PredictLeads
**Sprint B target. Highest immediate impact.**

### Stories

**E1.1 — Persist SEC CIK in companies table**
- Migration: add `sec_cik`, `sec_cik_padded`, `sec_cik_resolved_at`, `is_public_company` to `companies`
- Modify `findCik()` in `fetch-sec-filings.js`: on first successful resolution, write CIK back to `companies` table
- On subsequent scans: read stored CIK directly, skip fuzzy name search
- If CIK not found: mark `is_public_company = false`, skip EDGAR for this company
- Acceptance: zero repeated CIK lookups for companies scanned more than once

**E1.2 — EDGAR DEF 14A board composition parser**
- New file: `worker/signals/fetch-sec-proxy.js`
- On each scheduled scan: for public companies (has CIK), check if a DEF 14A was filed in the past 14 months
- Fetch DEF 14A primary document; extract director table (names, committees, tenure years)
- Upsert into `board_snapshots` table
- Compare against prior year snapshot; detect: new director, director departure, committee chair change
- Write detected changes to `board_changes` and generate a signal if a technology committee change is detected
- Acceptance: board composition change generates a `board_change` signal type in `company_signals`

**E1.3 — EDGAR 13-D activist investor watcher**
- New file: `worker/signals/fetch-sec-activist.js`
- Maintain a hardcoded watchlist of known activist investors with historical management-change pattern
  - Elliott Management, Starboard Value, Third Point, Icahn, ValueAct, Jana Partners, Engine Capital
- On each scheduled scan: query EDGAR for 13-D filings by these investors for any company in user watchlists
- If match: generate signal type `activist_entry`; include investor's historical pattern in summary
- Also: when any 13-D (from any filer) is filed for a company in a user's watchlist, generate `activist_entry` signal
- Upsert into `activist_filings` table
- Acceptance: activist 13-D on a watched company generates an alert within the next scheduled scan window

**E1.4 — EDGAR Form 4 insider transaction signal**
- Extend `fetch-sec-filings.js` to also monitor Form 4 filings for companies with a stored CIK
- Filter: transactions by named executive officers above $500K in aggregate over 30 days
- Signal type: `insider_sale` — large exec share sales often precede voluntary departures
- Include: executive name, amount, transaction dates
- Acceptance: material insider sale generates `insider_sale` signal in `company_signals`

**E1.5 — PredictLeads integration**
- New file: `worker/signals/fetch-predictleads.js`
- Endpoints: `GET /companies/find?domain={domain}` → get company UUID; `GET /companies/{uuid}/executive_changes`; `GET /companies/{uuid}/hiring_signals`
- Map executive changes to signal types: `started_new_role` → `exec_hire`; `left_role` → `exec_departure`
- Map hiring signals to `hiring_surge` signal type (company hiring aggressively in tech roles)
- Deduplication: skip if same exec name + company + date already exists from PDL diff
- Wire into `signal-job.js` alongside PDL
- Add `PREDICTLEADS_API_KEY` to env config and Railway secrets
- Acceptance: PredictLeads executive changes appear in `company_signals` and are not duplicated with PDL signals

---

## E2 — New Signal Sources
**Sprint C target.**

### Stories

**E2.1 — Local business journal parser (Business Journal network)**
- Target publications: 40+ city business journals with structured "People on the Move" sections
- Build a scraper/parser for the standardized Bizjournals.com format
- Parse: executive name, title, company, city, move type (new role / departure)
- Signal type: `exec_hire` or `exec_departure` for companies matching user watchlists
- Key value: private companies that never file 8-Ks, regional mid-market coverage
- Acceptance: signal generated within 7 days of publication for matched companies

**E2.2 — Technology trade press RSS integration**
- Sources: CIO.com, InformationWeek, Healthcare IT News, American Banker Tech, FierceHealthcare
- Subscribe to RSS feeds; filter articles mentioning companies in user watchlists
- Classify via existing `classifySignal()` pipeline
- Key value: technology-executive-specific coverage; sometimes reports departures before wire services
- Acceptance: trade press articles appear as signals with source attribution

**E2.3 — Conference circuit tracker**
- Build annual parser for speaker programs: Gartner Symposium, HIMSS, RSA, Money 20/20, CES
- Store: executive name, company, conference, year
- Alert: when a CIO/CISO who was an active speaker (2+ appearances in prior 3 years) has zero appearances in the current year
- Signal type: `circuit_disappearance`
- Acceptance: absence from conference circuit after sustained presence generates a signal

**E2.4 — Regulatory calendar by sector**
- Build a curated database of regulatory events mapped to industry sectors
  - CMMC Phase 2 (defense contractors, effective 2025)
  - SEC cybersecurity disclosure rules (all public companies)
  - NY DFS Part 500 (financial services)
  - HIPAA enforcement waves (healthcare)
  - DORA (EU financial services)
  - FedRAMP updates (government contractors)
- Map companies in user watchlists to relevant regulatory events
- Generate signal type `regulatory_pressure` when a compliance deadline is within 90 days
- Acceptance: regulatory alerts appear for matched companies with sector-specific context

---

## E3 — Executive History Database
**Sprint C-D target. Core moat-building work.**

### Stories

**E3.1 — Schema migration: executive_profiles, executive_positions, exec_search_lag, company_tenure_stats, industry_tenure_stats, departure_signal_context**
- Full schema as specified in this document
- Indexes: `executive_positions(company_cik, title_normalized)`, `executive_positions(sic_code, company_stage)`, `executive_positions(departure_type, departure_trigger)`
- Acceptance: all tables created with indexes; can insert and query a test record

**E3.2 — EDGAR 8-K 5.02 historical backfill (10 years)**
- Build one-time script: `scripts/backfill-edgar-exec-history.js`
- Input: EDGAR bulk quarterly index, 2014–2024
- Process: for each 8-K 5.02 filing, fetch primary document, extract executive name and departure/appointment context
- For named executives: write to `executive_positions` with `data_sources=['edgar_8k']`
- For unnamed: write departure event with `exec_role` inferred from filing text, exec_name null
- Tag company context: look up CIK in EDGAR company facts for SIC code, size
- Expected volume: ~60,000–80,000 executive events over 10 years
- Acceptance: script runs to completion, produces >10,000 records with >70% having exec_role populated

**E3.3 — PDL career enrichment for named executives**
- Build one-time script: `scripts/enrich-exec-profiles-pdl.js`
- Input: `executive_positions` records where `exec_name IS NOT NULL` and `pdl_id IS NULL`
- For each name + company: call PDL enrichment API; extract full career history
- Write career history entries back to `executive_positions` (prior roles)
- Compute `tenure_days` for each position where both `start_date` and `end_date` are known
- Budget estimate before running: PDL charges per match; run on sample first
- Acceptance: 50%+ of named executives have enriched career histories; `tenure_days` computed for those records

**E3.4 — Departure-to-appointment matching pass**
- Build script: `scripts/compute-search-lag.js`
- Logic: for each departure event, find the next appointment event at the same company in the same role family within 18 months
- Compute `lag_days`; classify `replacement_type` (internal = prior company is same; external = different prior company)
- Write to `exec_search_lag` table
- Acceptance: >5,000 departure-appointment pairs linked; `lag_days` distribution is reasonable (median 8-16 weeks)

**E3.5 — Wikidata career history ingestion**
- SPARQL query: all persons with employer relationship to CIO/CTO/CISO/COO/CPO/CDO roles, including P580 (start time) and P582 (end time)
- Parse results; map to `executive_positions`
- Acceptance: >5,000 Wikidata-sourced positions loaded; no duplicates with EDGAR records

---

## E4 — Historical Corpus Backfill
**Sprint D target. Training data for pattern models.**

### Stories

**E4.1 — GDELT historical query for executive change events**
- BigQuery query: articles with CAMEO code 017x (leadership change) + company name matching our company universe
- Pull 2013–2023; extract article URL, date, company entity, event summary
- Write to `departure_signal_context` table linked to matching `executive_positions` departures
- Key output: "what was in the news about this company in the 90 days before the CIO departed"
- Acceptance: >10,000 pre-departure signal context records linked to departure events

**E4.2 — ProPublica nonprofit executive history**
- Query all 501(c) organizations with revenue >$100M
- Extract: top-paid executive names, titles, compensation, fiscal year
- Map to `executive_positions`; compute tenure from year-over-year changes in named executives
- Key sectors: healthcare systems, health networks, university IT leadership
- Acceptance: >2,000 nonprofit executive positions loaded

**E4.3 — EDGAR DEF 14A historical board composition backfill**
- For each CIK in our company universe, pull all DEF 14A filings from 2014–2024
- Parse director tables year-over-year; load into `board_snapshots`
- Detect changes between years; write to `board_changes`
- Acceptance: board composition history for >1,000 public companies; year-over-year changes computed

**E4.4 — EDGAR 13-D historical activist position backfill**
- Query EDGAR full-text for all 13-D filings, 2014–2024, for companies in our company universe
- Load into `activist_filings` with historical pattern tag for known activists
- Cross-reference with subsequent 8-K 5.02 filings at same company (did management change follow?)
- Acceptance: activist position history with management-change follow-through rate computed per investor

---

## E5 — Expanded Company Intelligence
**Sprint D target.**

### Stories

**E5.1 — PE portfolio company tagging**
- Build or license PE firm → portfolio company mapping (Crunchbase Pro or public sources)
- Tag companies in `companies` table and `executive_positions` as `pe_backed` with firm name and deal close date
- Alert: when a PE-backed company is 6 months post-close (CIO change probability window opens)
- Alert: when a PE-backed company is 18 months post-close (peak window based on historical data)
- Signal type: `pe_integration_window`
- Acceptance: PE-backed companies in user watchlists show integration window alerts at correct timing

**E5.2 — M&A integration timing model (rule-based v1)**
- When an acquisition closes (from 8-K 2.01 or news signal), record close date in `companies`
- Alert: at 6 months post-close (CIO displacement risk rising)
- Alert: at 12 months post-close (peak CIO turnover window, based on historical data)
- Signal type: `ma_integration_window`
- Acceptance: M&A integration window alerts fire at 6 and 12 months post-close

**E5.3 — OpSec / industry regulatory calendar alerts**
- Build regulatory event table (see E2.4)
- For each company in user watchlists: compute days until relevant regulatory deadline
- Generate signal at 90 days and 45 days before deadline
- Signal type: `regulatory_pressure`

---

## E6 — Tenure and Lag Models
**Sprint E target.**

### Stories

**E6.1 — Compute and refresh company_tenure_stats**
- Scheduled job: weekly; aggregate `executive_positions` into `company_tenure_stats`
- Output: avg/median/p25/p75 tenure, avg search lag, external hire rate, sample size
- Surface in signal summaries: "The CIO tenure at this company averages 2.1 years (4 positions). You are at 19 months."
- Acceptance: `company_tenure_stats` populated for all companies with 3+ positions; displayed in UI

**E6.2 — Compute and refresh industry_tenure_stats**
- Aggregate by SIC code × company_stage × title_normalized
- Surface in signal context: "In PE-backed healthcare companies, the median CIO search lag is 9 weeks."
- Acceptance: industry stats computed for all SIC × stage × role combinations with n>10

**E6.3 — Surface tenure context in pattern alerts**
- When a `pattern_alert` or `exec_departure` signal fires, look up `company_tenure_stats` and `industry_tenure_stats`
- Append context to `signal_summary`: benchmark tenure, typical search lag, external hire rate
- Acceptance: pattern alerts include tenure and lag benchmark data when stats are available

---

## E7 — Pattern Fingerprinting v2
**Sprint E-F target.**

### Stories

**E7.1 — Expand pattern library with company archetype features**
- Extend `correlate-signals.js` pattern matching to incorporate company stage and sector
- PE-backed company patterns: weighted differently from public company patterns
- Healthcare-specific patterns: regulatory pressure combined with exec change
- Acceptance: pattern detection accuracy improves vs. v1 baseline (measure via manual review of 100 alerts)

**E7.2 — Calibrated probability output**
- Replace binary `detected: true/false` with a probability score (0.0–1.0)
- Model inputs: signal types in last 60 days, company stage, sector, activist presence, M&A history, tenure vs. benchmark
- Output: "78% probability this company formalizes a technology leadership search within 12 weeks"
- Acceptance: probability scores displayed in signal UI; calibration validated against historical outcomes

**E7.3 — Pre-departure signal fingerprinting**
- Using `departure_signal_context` from E4.1, build feature vectors for the 90 days before confirmed departures
- Train a simple classifier (logistic regression or gradient boosted trees on structured features)
- Apply to current companies in real time: "The signal cluster at this company resembles 73% of confirmed departure precursors in our training set"
- Acceptance: classifier trained on >1,000 labeled departure events; output integrated into signal alerts

---

## E8 — Relationship Graph Foundation
**Sprint F target.**

### Stories

**E8.1 — User-added contacts stored against companies**
- UI: on each company in the pipeline, allow user to add contacts: name, title, relationship type (knows well / connected / 2nd degree)
- Store in `company_contacts` with relationship metadata
- Acceptance: contacts can be added, edited, and deleted per company

**E8.2 — Warm path surface in signal alerts**
- When a `pattern_alert` or `exec_departure` signal fires, check if user has a contact at that company
- If yes: append warm path note to signal summary: "You have a direct contact here: [Name], [Title]."
- Acceptance: signal alerts reference user contacts when available

**E8.3 — Cross-user attention aggregation (anonymous)**
- Compute: how many users are tracking each company (across the platform, anonymized)
- When 3+ users track the same company: surface as "elevated attention" in company profile
- Do not reveal how many or who; only surface as a signal
- Acceptance: elevated attention indicator appears in company UI when 3+ users track same company

---

## Historical Backfill Execution Plan

### Phase 1 — EDGAR Bulk (immediate, free)
1. Download EDGAR full-index quarterly files for 2014–2024
   - URL pattern: `https://www.sec.gov/Archives/edgar/full-index/{year}/QTR{n}/company.idx`
2. Filter for 8-K filings by all CIKs
3. For each 8-K, fetch submissions JSON, filter for Item 5.02
4. Fetch primary document for each 5.02 filing; extract executive name and event type
5. Load into `executive_positions`
6. Estimated volume: 60,000–80,000 events across 10 years

### Phase 2 — PDL Enrichment (paid, targeted)
1. Select all `executive_positions` records where `exec_name IS NOT NULL` and `pdl_id IS NULL`
2. Query PDL enrichment API by name + company name
3. Store full career history (prior positions, dates, companies)
4. Estimated PDL calls: 10,000–15,000 (budget accordingly)

### Phase 3 — GDELT Context (free, BigQuery)
1. BigQuery query against `gdelt-bq.gdeltv2.gkg` for mentions of companies in our universe
2. Filter: event codes 017x (leadership change) or text mentions of executive roles
3. Pull 2013–2023
4. Link to departure events by company and date proximity (within 90 days before departure)
5. Load into `departure_signal_context`

### Phase 4 — Supplemental Sources
- Wikidata SPARQL bulk download → `executive_positions`
- ProPublica API → nonprofit executive history
- Wayback Machine → private company executive team page reconstruction
- Business Wire historical search → appointment events for departure-to-appointment matching

---

## Vendor / Data Partner Evaluation

| Vendor | Use Case | Est. Cost | Priority | Decision |
|--------|----------|-----------|----------|----------|
| EDGAR | Bulk historical + real-time | Free | Critical | Build now |
| GDELT | Historical news context | Free (BigQuery) | High | Phase 2 |
| Wikidata | Executive career histories | Free | High | Phase 2 |
| ProPublica | Nonprofit exec history | Free | Medium | Phase 2 |
| OpenCorporates | Private company directors | Free tier | Medium | Phase 2 |
| PredictLeads | Job-posting exec change signals | ~$300-500/mo | High | Build now |
| PDL (enrichment) | Career history for named execs | Per-call | High | Phase 2 |
| Crunchbase bulk | Company stage backfill | Enterprise | Medium | Phase 3 |
| Revelio Labs | Org structure inference | Enterprise | Low | Phase 4 |
| Boardex (Dow Jones) | Executive relationship graph | Enterprise | Low | Phase 4 |
| PitchBook | PE portfolio exec data | Enterprise | Low | Phase 4 |

---

## Success Metrics

### Intelligence Quality
- Signal precision: % of `pattern_alert` signals that are followed by a confirmed search (90-day window)
- Signal lead time: avg days before a search is posted publicly for detected patterns
- False positive rate: % of `pattern_alert` signals with no subsequent search activity

### Database Coverage
- Executive positions in database: target 100,000 by end of Phase 2; 500,000 by end of Phase 4
- Departure-appointment pairs with computed lag: target 5,000 by end of E3; 25,000 by Phase 4
- Company tenure stats: target 2,000 companies with sufficient sample size (n >= 3)

### User Impact
- Signal-to-action rate: % of signals where user takes an action (log outreach, update contact)
- Pattern alert outreach conversion: % of pattern alert outreach drafts that are sent by user
- "First to know" rate: % of searches where user was alerted before the role was posted publicly

---

## Open Questions

1. **PredictLeads vs. PDL overlap**: After integrating both, measure what % of executive change signals are unique to each source vs. duplicated. If PDL already catches 90% of what PredictLeads finds, reassess cost.
2. **EDGAR 5.02 parsing accuracy**: 8-K Item 5.02 filings vary widely in structure. Build a parsing accuracy benchmark using 100 manually verified filings before scaling the backfill.
3. **PDL enrichment cost**: Run a sample of 500 EDGAR-extracted executive names through PDL enrichment before committing to the full backfill. Verify match rate and cost.
4. **Revelio Labs evaluation**: When user base exceeds 5,000, evaluate Revelio for org-structure signals as a complement to PDL roster snapshots.
5. **Boardex licensing**: When in-house executive database reaches 50,000 records, evaluate Boardex for relationship graph enrichment vs. organic growth via user-added contacts.

---

*Last updated: May 10, 2026. Update this document at the start of each sprint to reflect completed stories and revised scope.*
