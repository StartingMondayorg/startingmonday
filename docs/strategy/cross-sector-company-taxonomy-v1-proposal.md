# Cross-Sector Company Taxonomy Proposal v1

- Version: `cross-sector-taxonomy-proposal-v1`
- Date: 2026-08-13
- Status: `PROPOSED`; no schema, writer, reader, or customer behavior changes
- Governing stories: WS3-06, supported by WS1-04 and WS0-06
- Product-local repository: Starting Monday

## Decision

Retire `company_stage` as a prospective canonical concept. It currently mixes
organization type, ownership, scale, and operating traits. Existing values
remain untouched until an additive contract and reversible adapter are
approved. Unknown values remain unknown.

The proposed contract separates five dimensions.

| Dimension | Proposed representation | Initial values or system | Point-in-time requirement |
| --- | --- | --- | --- |
| Industry | `industry_system`, `industry_code`, `industry_label`, `taxonomy_version` | SEC SIC first; NAICS only after a versioned crosswalk/source decision | Classification valid at the evidence date; current classification cannot rewrite history |
| Organization type | `organization_type` | `for_profit`, `nonprofit`, `government`, `education`, `association`, `cooperative`, `other`, `unknown` | Source must establish type at the applicable date |
| Ownership | `ownership_model` | `publicly_traded`, `independent_private`, `pe_backed`, `vc_backed`, `subsidiary`, `government_owned`, `member_owned`, `other`, `unknown` | Requires dated ownership evidence; later ownership cannot backfill an earlier tenure |
| Scale | Separate versioned measures, not one label | revenue band, headcount band, market-cap band, each with currency/unit and as-of date | Every measure carries its own effective and observation dates |
| Lifecycle condition | `lifecycle_condition` | `startup`, `growth`, `scale`, `mature`, `declining`, `turnaround`, `unknown` | Derived only from a versioned rule and dated evidence; otherwise `unknown` |

## Temporal And Provenance Contract

Every populated dimension must carry:

1. `valid_from` and optional `valid_to`;
2. date precision;
3. `first_observed_at`;
4. source reference and source-policy version;
5. taxonomy/configuration version;
6. derivation method (`reported`, `deterministic_mapping`, or `versioned_rule`);
7. correction lineage rather than destructive overwrite.

Current canonical-company state must never be copied into historical executive
positions or search-lag rows without evidence that it was valid at that time.

## Legacy Mapping Rules

No blanket migration from `company_stage` is allowed.

| Legacy value | Safe information | Held information |
| --- | --- | --- |
| `public_f500`, `public_mid`, `public_small` | Public ownership may be proposed only with dated market evidence | Scale and Fortune status remain unknown without dated evidence |
| `pe_backed`, `vc_backed` | Ownership may be proposed only with a dated transaction/source | Organization type, scale, and lifecycle remain independent |
| `private` | None; the term is too broad | Organization type, ownership, and lifecycle remain unknown |
| `nonprofit` | Organization type may be proposed with dated registry evidence | Ownership and lifecycle remain independent |
| `gov_contractor` | Operating trait only | It is not organization type, ownership, scale, or lifecycle |

## Acceptance For A Future Contract Increment

- Valid, missing, malformed, boundary, unknown, and conflicting fixtures exist
  for every dimension.
- Replay pins taxonomy and rule versions.
- Unsupported values fail or remain explicitly unknown.
- Source rights and retention are decided before collection.
- Starting Monday adapters map every legacy field to source, derivation,
  unknown, or new collection.
- No customer rendering begins in this proposal.

## Rollback And Kill

This proposal is documentation only. Rollback is withdrawal of the proposal.
Any later implementation must be additive, default off, and independently
killable without deleting source evidence or changing E3 search-lag pairs.