# WS0-06 Cross-Sector Coverage Disposition

- Date: 2026-08-13
- Story: WS0-06 partial disposition; full E4-E6 and Specs 00-12 reconciliation remains open
- Accountable owner: Richard Rothschild
- Product-local repository: Starting Monday
- Evidence: `docs/evidence/cross-sector-coverage-baseline-and-decision-2026-08-13.md`
- Review date: at XS-01 Definition of Ready and WS1-10 gate review

## Disposition Rows

| Legacy scope | Disposition | Canonical target | Re-entry trigger |
| --- | --- | --- | --- |
| E3/E6 company and industry search-lag context | `MERGE/CONTINUE_COLLECTION` | WS1-04 historical reconstruction; WS3-06 taxonomy; later WS6 measurement only after support | Exact, dated dimensions create supported cohorts without lowering n floors |
| Legacy `company_stage` | `REPLACE_PROSPECTIVELY` | WS3-06 separate organization type, ownership, scale, and lifecycle contracts | Additive contract and adapter pass fixtures; no blanket historical migration |
| Current industry taxonomy migration 075 | `RETAIN_AS_UI_REFERENCE` | WS3-06 proposal input only | Versioned SIC/NAICS codes, temporal semantics, and unknown behavior are approved |
| Cross-sector user demand | `MEASURED_BASELINE` | WS1 evidence and source build order | Re-run on taxonomy or demand-event contract change, or after 30 days |
| Pharmaceuticals/life-sciences history | `DEFER_SOURCE_GAP` | WS1-08 source rights then WS1-04 reconstruction | Current source contract plus bounded sample produces dated executive history |
| Publishing/media history | `DEFER_SOURCE_GAP` | WS1-08 source rights then WS1-04 reconstruction | Current source contract plus bounded sample produces dated executive history |
| Nonprofit/NGO history | `DEFER_SOURCE_GAP` | WS1-08 source rights then WS1-04 reconstruction | Nonprofit source contract plus bounded sample produces dated executive history |
| XS-01 canonical SEC identity reconciliation | `APPROVED_FOR_DOR` | WS3-06 prerequisite and Starting Monday adapter evidence | Recompute 100-row denominator; propose only 36 globally safe candidates; protect all 48 local/global holds; write path remains separately gated |

## Controls Preserved

- Starting Monday remains the only repository and runtime in this slice.
- No MandateSignal data, schema, credentials, or release process is used.
- Existing E3 pairs and E6 support floors remain unchanged.
- Sparse user-demand cells remain privacy-thresholded.
- Source rights are not inferred from technical accessibility.
- Full WS0-06 remains open; this record does not claim its completion.

## Rollback And Kill

The completed baseline is read-only. Remove its generated evidence and proposal
to roll it back. XS-01 must remain default off until its separate Definition of
Ready records acceptance evidence, conflict holds, rollback, and explicit write
authorization.