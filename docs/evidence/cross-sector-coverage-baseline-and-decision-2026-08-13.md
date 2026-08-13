# Cross-Sector Coverage Baseline And Taxonomy Decision

- Date: 2026-08-13
- Status: `MEASURED_BASELINE_COMPLETE`
- Scope: one-week maximum, completed in one day
- Provider spend: $0
- Mutation: none
- Customer exposure: none
- Production application baseline SHA: `8628d87bb6a4f4371aab5ebc3c39abed3a788bca`
- Governing stories: WS0-06, WS1-04, WS3-06
- Supporting evidence: WS1-05, WS1-13
- Machine evidence: `docs/evidence/cross-sector-coverage-baseline-2026-08-13.json`
- Taxonomy proposal: `docs/strategy/cross-sector-company-taxonomy-v1-proposal.md`

The machine artifact records `worktreeDirty: true` and SHA-256 hashes for the
exact audit script and aggregation core. The application SHA identifies the
deployed schema/data baseline; it does not claim the new audit files were
already committed at query time.

## Demand Baseline

Production read-only queries found:

- 65 active or trialing users.
- 20 users with at least one declared target sector.
- 19 users with multiple raw target-sector labels.
- 15 users spanning multiple broad cross-sector buckets.
- Technology demand: 13 users.
- Pharmaceuticals/life-sciences demand: 3 users.
- Publishing/media and nonprofit/NGO user cells are present but suppressed at
  the repository privacy floor of three.

The user base is therefore not technology-only. Among users who declared a
target sector, 75% span multiple broad buckets (15 of 20).

Current active-company demand contains 173 watched companies. Named sector is
present on 84 (48.6%); 89 are unspecified. Historical add/request demand uses
119 `company_watch_events`. This is explicitly a proxy emitted when a company
is added; no separate pre-watch requested-company object exists. Of those 119
events, 75 have no sector.

## Coverage Baseline

### Canonical company universe

- 577 canonical companies.
- 472 (81.8%) have a named free-text sector; 105 are unspecified.
- 20 (3.5%) have canonical SEC identity.
- 0 have canonical SIC/NAICS, organization type, ownership, scale, or
  historical lifecycle fields.
- Current free-text classification finds 189 technology companies and 9
  pharmaceuticals/life-sciences companies; publishing/media and nonprofit/NGO
  have no canonical rows under the conservative classifier.

Linked company records expose a deterministic identity opportunity. The first
per-canonical pass produced 80 missing/unambiguous candidates; a required
global ownership pass then held CIKs proposed for multiple canonical companies
or already owned elsewhere.

| Disposition | Canonical companies |
| --- | ---: |
| Globally safe missing canonical CIK candidate | 36 |
| Already aligned | 16 |
| Held: multiple linked CIKs within one canonical company | 2 |
| Held: existing canonical CIK conflicts with linked CIK | 2 |
| Held: globally colliding/already-owned candidate CIK | 44 |
| Reconciled linked CIK denominator | 100 |

The final identity equation is `100 = 36 + 16 + 2 + 2 + 44`. The 44 global
holds are a set union: 42 candidate-collision rows, 30 already-owned rows, and
28 rows in both categories. Existing populated canonical CIKs contain zero
duplicate groups. Conflict rows are held; no best guess is authorized.

### Verified search-lag corpus

- 267 verified E3 pairs; all departure joins resolve.
- 267 (100%) carry `edgar_8k_502` source provenance.
- 0 carry SIC, organization type, ownership, scale, lifecycle, or the legacy
  mixed `company_stage` value.
- All 267 therefore remain sector-unspecified. Current canonical state was not
  used to rewrite historical facts.

## Representative Vertical Tests

| Vertical | Canonical companies | Active watched | Executive positions | Matched lags | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Pharmaceuticals/life sciences | 9 | 0 | 0 | 0 | `DEFER_SOURCE_GAP` |
| Publishing/media | 0 | 0 | 0 | 0 | `DEFER_SOURCE_GAP` |
| Nonprofit/NGO | 0 | 0 | 0 | 0 | `DEFER_SOURCE_GAP` |

The test does not show absent user demand. It shows that the current historical
corpus cannot reconstruct these verticals.

## Source Rights, Cost, And Freshness Matrix

Rights labels below repeat repository evidence; they are not new legal
opinions. The active catalog was last reviewed 2026-07-05 with a 30-day review
cadence, so its review is stale as of this decision.

| Source | Sector use | Repository status | Recorded rights | Incremental provider cost | Freshness | Decision |
| --- | --- | --- | --- | ---: | --- | --- |
| SEC filings | Public-company identity, SIC, dated officer changes across sectors | Active and implemented | `public`; review refresh due | $0 | 24 hours | `PROCEED_AFTER_CATALOG_REVIEW` for exact-CIK SIC shadow resolution |
| Company press releases | Appointment evidence across all three pilots | Active and implemented | `public`; review refresh due | $0 | 72 hours | `CONTINUE_COLLECTION_ONLY`; historical completeness unmeasured |
| Google News | Publishing/media and cross-sector discovery | Active and implemented | Public research; catalog says paid commercial tier required by 2026-10-01 and article republication prohibited | $0 for bounded research | 72 hours | `DEFER_AS_HISTORY_SOURCE`; not a complete archive |
| Business journals | Publishing/media and regional appointments | Active and implemented | `public`; review refresh due | $0 recorded | 72 hours | `CONTINUE_COLLECTION_ONLY`; completeness and reuse need refresh |
| Regulatory calendar | Pharmaceutical context, not executive history | Active and implemented | `public`; review refresh due | $0 recorded | 168 hours | `DEFER_FOR_HISTORY`; contextual signal only |
| ProPublica Nonprofit Explorer | Nonprofit Form 990 candidate | Historical roadmap candidate; not in active catalog | Unreconciled under WS1-08 | $0 recorded in predecessor inventory | Unmeasured | `DEFER_RIGHTS_AND_SOURCE_CONTRACT` |
| Wikidata executive histories | Cross-sector candidate history | Historical roadmap candidate; not in active catalog | Unreconciled under WS1-08 | $0 recorded in predecessor inventory | Unmeasured | `DEFER_RIGHTS_QUALITY_AND_IDENTITY_PROBE` |
| PDL/Apollo executive data | Licensed person and organization history | Active implementation exists | Derivative/public aggregation restrictions recorded | Paid/licensed | 192 hours | `DEFER`; excluded from this $0 slice and public aggregate claims |

No FDA, ClinicalTrials.gov, IRS direct feed, Crossref, OpenAlex, or Census NAICS
source is approved by this decision because none has a current product-local
rights and quality contract in the reviewed catalog.

## Taxonomy Decision

Adopt `cross-sector-taxonomy-proposal-v1` for design review. Replace the mixed
future use of `company_stage` with separate industry, organization type,
ownership, scale, and lifecycle dimensions. Preserve unknowns and require
point-in-time provenance for every historical value.

Dimension build order:

1. `PROCEED`: canonical SEC identity reconciliation using already-held exact
   links and one unambiguous normalized CIK.
2. `PROCEED_AFTER_SOURCE_REVIEW`: SEC SIC shadow resolver for exact CIKs.
3. `DEFER_SOURCE_CONTRACT`: NAICS hierarchy and organization type.
4. `DEFER_DATED_EVIDENCE`: ownership and independent scale measures.
5. `DEFER_RULE_AND_EVIDENCE`: historical lifecycle condition.

## Approved Next Increment

`XS-01 Canonical SEC identity reconciliation` is approved for Definition of
Ready as one reviewable Starting Monday change set.

Scope:

- Recompute the 100-row linked-CIK denominator at the execution SHA.
- Propose only the 36 missing canonical CIKs that remain unique after local and
  global ownership checks.
- Hold all 48 local and global conflicts.
- Start read-only; any writer remains default off and requires dry-run,
  idempotency, hosted privilege evidence, rollback, and reconciliation.
- Make no SIC, organization type, ownership, scale, lifecycle, E3, E6, or
  customer-facing changes.

Acceptance equation: `100 = proposed 36 + aligned 16 + held 48`, with zero
silent selections and zero customer exposure.

## Acceptance Gate

- Reconciled denominators and sector missingness: `PASS`.
- Versioned taxonomy proposal: `PASS`.
- Source rights and cost matrix: `PASS_WITH_REVIEW_GATES`.
- No historical values inferred from current state: `PASS`.
- No schema writes, enrichment writes, new sources, or UI changes: `PASS`.
- Dimension and pilot proceed/defer decisions: `PASS`.
- One reviewable enrichment increment selected: `PASS` (`XS-01`).

The bounded baseline is complete. XS-01 is selected but is not yet implemented
or authorized for production writes.

## Reproduction

```powershell
node --env-file=.env.local scripts/cross-sector-coverage-baseline.mjs --environment=production --output=docs/evidence/cross-sector-coverage-baseline-2026-08-13.json
```

The command exits nonzero unless all sector denominators, the local and global
canonical CIK equations, existing CIK uniqueness, the 267-pair denominator,
departure joins, and read-only state reconcile.