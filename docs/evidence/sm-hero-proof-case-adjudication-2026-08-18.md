# Starting Monday Hero Proof Case Adjudication

Date: 2026-08-18
Brief: `docs/inbox/sm-hero-implementation-brief-2026-08-16.md`
Implementation plan: `docs/strategy/sm-hero-implementation-plan-2026-08-18.md`
Status: G-SM-1 resolved; G-SM-2 case selected; generalized closing claim rejected

## G-SM-1: Pilot microcopy

Requested copy: `Free during pilot.`

Current observed product copy on the Starting Monday homepage:

- `Free for 30 days. No credit card. No employer visibility.`

Disposition: **DO NOT SHIP** `Free during pilot.`.

Decision: 30 days free is the approved offer. It is not equivalent to being free for the entire pilot, so the broader microcopy is omitted.

Reason: the existing 30-day statement does not establish that access remains free for the entire current pilot period or for all new signups.

Required approval record:

- confirmed by: Rich
- confirmed at: 2026-08-18
- applicable signup/plan state: 30 days free; not free during the entire pilot
- expiration or review date: review if pilot terms change

## G-SM-2: Proof-card case

Required proof surface:

- one real Starting Monday signal-history case, anonymized and rights-reviewed; or
- an approved illustrative mock with visible `Illustrative example` label.

Current disposition: **APPROVED CASE SELECTION**.

Selected case: Backtest Exhibit 2026-Q3 case `C20`, anonymized for the marketing surface as `National building-products supplier`. The shape-reference example in the implementation brief is not evidence and is not rendered.

Required case fields before implementation:

- case identifier or fixture reference: `docs/proof/backtest-2026q3-case-list.csv`, `C20`
- anonymized descriptor: `National building-products supplier`
- three factual dated events: May 18, June 5, and July 30, 2026
- source class for each event: company announcement; SEC 8-K; SEC 10-Q and 8-K
- source references:
	- Case announcement: `docs/proof/backtest-2026q3-case-list.csv`, case `C20`
	- Officer appointment disclosure: `https://www.sec.gov/Archives/edgar/data/0001316835/000119312526259521/bldr-20260603.htm`
	- Quarterly report: `https://www.sec.gov/Archives/edgar/data/0001316835/000119312526325451/bldr-20260630.htm`
	- Earnings disclosure: `https://www.sec.gov/Archives/edgar/data/0001316835/000119312526324859/bldr-20260730.htm`
- source/display rights review: public-source factual summary; no person names or private data rendered
- date-shifting decision: no date shifting
- privacy/anonymization review: company descriptor only; no person-level details
- compact and expanded rendering approved: approved for implementation
- Rich approval and date: Rich, 2026-08-18

## Closing-line claim

Requested copy:

`Signals like these usually appear weeks before a job ad does. Starting Monday watches for them so you see the role forming, not just the posting.`

Disposition: **DO NOT SHIP** the generalized timing claim.

The example page will omit the closing line entirely. The case card will use the narrower factual status `Status: leadership transition documented.`

## Current implementation state

- Default-off flag added: `NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED`
- Flag unit coverage added: `src/lib/feature-flags.test.ts`
- No homepage hero rendering change made yet
- No `/example` route added yet
- No telemetry or sitemap change made
- No MandateSignal code, data, assets, analytics, or deployment touched

## Release rule

Do not enable the flag or implement the public proof surface until G-SM-1 and G-SM-2 are resolved, the copy contract is approved, and the required rights/privacy evidence is recorded. After resolution, continue with the phased implementation plan and keep production exposure behind the flag until the applicable Starting Monday UX and promotion gates pass.
