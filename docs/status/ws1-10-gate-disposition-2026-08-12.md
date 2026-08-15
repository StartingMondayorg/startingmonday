# WS1-10 Gate Disposition - 2026-08-12

Status: `FAIL_REPLAN_ACCEPTED`

Recommended disposition: `FAIL_REPLAN_AND_CONTINUE_MEASUREMENT`

Accountable owner: Richard Rothschild (AO)

Decision: Accept `FAIL_REPLAN_AND_CONTINUE_MEASUREMENT`

Decision basis: User directive received in the active execution session on 2026-08-12: "Work autonomously and make good decisions." The recommended fail/re-plan path is adopted for execution. This records workflow authorization, not a handwritten signature.

## Evidence

- Production report: `docs/evidence/intelligence-production-gates-2026-08-12-post-repair.md`
- Machine-readable snapshot: `docs/evidence/intelligence-production-gates-2026-08-12-post-repair.json`
- Production main SHA: `1a7ac4af1d1638d5b48601ac1184ed90fbd1c460`
- Replay run: `bb2eef03-0789-463e-8f4b-e0648dff9fdf`

## Story Dispositions

| Story | Disposition | Basis | Re-entry condition |
| --- | --- | --- | --- |
| WS0-02 | Pass | Main, staging, repair branch, deployment SHA, and dirty-state evidence captured | Re-pin on next implementation baseline |
| WS0-03 | Pass for this gate scope | Label, event, cohort, control, replay, metrics, jobs, routes, and tests identified | Extend inventory when matching schema changes |
| WS0-04 | Pass for deployed repair | Hosted counts and both production services verified at exact SHA | Reverify after matching migration |
| WS0-07 | Pass | Dated Markdown and JSON reconstruction pair retained | Add next replay and classifier evidence artifacts |
| WS0-08 | Continue collection | Current denominators are measured; classifier post-deploy denominator is still running | Fresh strict 24-hour classification gate |
| WS1-03 | Fail / re-plan | Completed 300-cohort replay produced 620 controls, not 900 | New frozen cohort version with support rules and complete denominators |
| WS1-09 | Continue collection only | Replay is reproducible at one current cutoff, but this packet does not close the required two historical-cutoff feasibility probe | Separate two-cutoff replay-gap report |
| WS1-10 | Fail / re-plan accepted | Two production gates remain unresolved; autonomous execution directive received | Re-review after classifier and new cohort-version evidence |
| WS2-07 | Continue collection only | Label volume and sources pass; this packet does not replace source-stratified quality sampling | Entity, role, date, duplicate, and privacy-exclusion sample report |
| WS2-08 | Fail / re-plan | Exact free-text sector and absent size dimensions make the inherited 900-control target structurally impossible | Canonical broad-sector and size-band coverage plus versioned matching policy |
| WS2-09 | Continue collection only | Machine-readable metrics exist; alert owner/severity/evidence/recovery drill remains outside this packet | Completed alert recovery exercise |

## Required WS2-08 Re-plan

The smallest defensible next change is an additive matching-dimension contract, not a relaxed query:

1. Add normalized broad-sector and size-band fields to canonical companies.
2. Define deterministic mappings to the existing eight-sector taxonomy and the existing size vocabulary.
3. Backfill from linked user-company rows with conflict and unknown reporting.
4. Record match tier and cohort version on controls.
5. Freeze inclusion rules before building the next cohort version.
6. Exclude unsupported cohorts explicitly; never silently substitute cross-sector controls.
7. Report eligible cohorts, excluded cohorts by reason, control support, and replay results.

Required rollback/kill behavior:

- Keep cohort version `v1` and replay evidence immutable.
- Build the repaired cohort as a new version.
- Stop if mapping coverage cannot support three controls for every included cohort.
- Do not expose backtest rates or promote calibrated product behavior from the failed cohort.

## Downstream Authorization

`permitsDownstreamImplementation: false`

Historical-roadmap E3 implementation remains blocked. In particular, do not begin PDL enrichment, a new executive-history schema, tenure/lag modeling, calibrated scoring, or relationship-graph expansion from this disposition.

After this gate closes, the historical E3 plan must be reconciled to canonical WS3 temporal/entity/claim contracts and Starting Monday adapter design before implementation.

## Decision Record

- [x] Accept `FAIL_REPLAN_AND_CONTINUE_MEASUREMENT`.
- [ ] Mark `BLOCKED` and stop further repair work.
- [ ] Return for correction with named evidence gap.

Decision date: 2026-08-12

Rationale: Continue autonomously with the smallest governed repair. Keep E3 blocked until the strict classifier and matched-control gates pass.