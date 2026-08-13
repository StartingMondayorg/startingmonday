# WS1-08 Source Rights Readiness

- Date: 2026-08-13
- Status: `EVIDENCE_REQUIRED_FAIL_CLOSED`
- Accountable owner: Richard Rothschild
- Owners: LEGAL + ENG-SM
- Product-local repository: Starting Monday
- Production application baseline: `9d186b832e25617139266d536935696814951f91`
- Machine evidence: `docs/evidence/ws1-08-source-rights-readiness-2026-08-13.json`
- Provider spend: $0
- Mutation: none

This artifact is explicitly the `PRE_CONTAINMENT_BASELINE`. Static enforcement
facts are read from Git `HEAD` at `9d186b83`, not from later uncommitted
remediation in the isolated worktree. The baseline's fail-open findings are the
defect that migration 173 and the paired worker change are designed to correct;
they are not claims about the proposed post-remediation code.

## Readiness Result

The read-only repository and production audit evaluated 16 priority sources.

- Ready for accountable review: 0.
- Current sources with incomplete use-specific evidence: 8.
- Proposed sources missing catalog entries: 8.
- Hosted `signal_sources` registry available through PostgREST: no
  (`PGRST205`).
- Repository catalog rows: 16.
- Hosted registry rows available: 0.
- Catalog-to-hosted sync writer: not found.

The catalog is version 2, dated 2026-07-05, with a 30-day review cadence. Its
source rows are 39 days old at this audit. Incomplete evidence takes precedence
over a stale-only classification: every current priority source lacks one or
more mandatory use decisions and evidence fields.

## Required Rights Contract

Each source must record explicit `allowed`, `blocked`, or `conditional`
decisions for:

1. collection;
2. internal analysis;
3. customer display;
4. model training;
5. aggregate statistics; and
6. export/publication.

Each decision also requires terms URL, terms version/date, evidence review
date, owner, next review date, retention/deletion rule, attribution rule, and
commercial-tier requirement. `public`, `licensed`, or technical accessibility
does not substitute for these decisions.

Likewise, catalog classifications `public` and `licensed` are not runtime
approval enums. The containment helper intentionally requires an explicit
hosted `allowed` or `approved` decision after accountable review; copying
catalog classifications into the hosted registry would keep sources blocked.

## Source Dispositions

| Source | Current evidence | Disposition | Re-entry requirement |
| --- | --- | --- | --- |
| SEC EDGAR | Public-record characterization only | `INCOMPLETE` | Pin SEC access terms/policy and all six use decisions |
| Company press releases | Public-web strategy notes | `INCOMPLETE` | Site-policy/robots contract, retention, display, training and publication decisions |
| Google News / GNews | July audit notes paid tier by 2026-10-01; article redistribution prohibited | `INCOMPLETE_URGENT` | Identify RSS versus GNews API path, current tier, current terms, and all six use decisions |
| Business journals | Public-web label only | `INCOMPLETE` | Current access/reuse evidence and all six decisions |
| Crunchbase | Licensed; external exposure cautioned | `INCOMPLETE_EXTERNAL` | Actual agreement/tier, retention, derived-data and termination terms |
| PredictLeads | Licensed; attribution/resale notes | `INCOMPLETE_EXTERNAL` | Actual agreement/version, retention, model/aggregate/export decisions |
| People Data Labs | Licensed; derivative/person restrictions noted | `INCOMPLETE_EXTERNAL` | Actual agreement/version, person retention/deletion and all six decisions |
| Apollo / leadership changes | Apollo compliance metadata conflicts with PDL implementation mapping | `BLOCKED_IDENTITY` | Reconcile source identity, actual agreement and writer provenance |
| Census NAICS | Absent from catalog | `BLOCKED_MISSING` | Candidate catalog row plus current source terms and six decisions |
| ProPublica Nonprofit Explorer | Absent from catalog | `BLOCKED_MISSING` | Candidate row, API terms/version, attribution and reuse decisions |
| Wikidata | Absent from catalog | `BLOCKED_MISSING` | Candidate row, license/version, attribution and person-data decisions |
| IRS Form 990 | Absent from catalog | `BLOCKED_MISSING` | Candidate row, direct-source policy and six decisions |
| FDA | Absent from catalog | `BLOCKED_MISSING` | Candidate row, exact dataset/API and six decisions |
| ClinicalTrials.gov | Absent from catalog | `BLOCKED_MISSING` | Candidate row, API terms/version and six decisions |
| Crossref | Absent from catalog | `BLOCKED_MISSING` | Candidate row, metadata terms/version and attribution decisions |
| OpenAlex | Absent from catalog | `BLOCKED_MISSING` | Candidate row, license/version and six decisions |

No source is approved, promoted, deprecated, or newly collected by this audit.

## Control Preemption

The audit also found a bounded internal control defect:

- `person-signal-job` is scheduled every four hours;
- it is the only caller of `resolveSourceDecision`;
- at pre-containment Git `HEAD` `9d186b83`, registry read errors, misses and
  exceptions return `allowed: true`; the proposed worktree change returns
  `allowed: false` for all three paths;
- production person tables currently contain zero rows; and
- migrations grant broad authenticated reads to shared people, source,
  affiliation and signal tables.

This is a latent privacy/rights defect, not a measured live disclosure incident.
WS2-06 containment preempts the external rights review: registry failure/miss
must fail closed, explicit `allowed`/`approved` rights are required, and person
reads must be limited to rows linked through the requesting user's contact or
company-person candidate records.

The machine artifact separates these states explicitly:

- `enforcement.baselineHead` reads Git `HEAD` and records the three fail-open
  paths present in the deployed baseline; and
- `enforcement.proposedWorktree` reads the uncommitted containment code and
  records three fail-closed paths plus the explicit approval requirement.

## Follow-On Blockers

- `precursor-stats-job` does not evaluate registry decisions. It relies on
  `QUARANTINED_SOURCE_KINDS`, whose default is empty. A source-family-aware
  aggregate policy requires a separate re-plan; this containment does not
  claim to fix it.
- The hosted registry schema/synchronization contract remains absent. Do not
  seed `public` or `licensed` classifications as approvals; design an explicit
  six-use decision schema and controlled synchronization path first.

## Gate State

- WS1-08 evidence collection: `BLOCKED_EXTERNAL` pending actual terms and
  agreements plus accountable legal/product decisions.
- WS2-06 person-signal containment: `READY_FOR_STAGING` after focused tests and
  independent review.
- XS-02 and every new cross-sector source: `BLOCKED`.
- Existing collection need not be broadly disabled solely because the review
  is late; purpose-specific paths without explicit permission must fail closed.

## Rollback And Kill

- Runtime containment kill: keep person-signal registry decisions blocked.
- Migration rollback is documented separately; do not restore global reads if
  person rows have been populated without a new risk decision.
- Source catalog and hosted registry remain unmodified in this slice.