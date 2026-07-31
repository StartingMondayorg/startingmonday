# WS0-06 Scope-Addition Disposition Record — Source Expansion & Insight Layer

- Date: 2026-07-30
- Participants: Rich (AO), Sol (ENG)
- Story: WS0-06 (partial — scope addition per source-expansion-50 §E6; the full
  predecessor-plan matrix covering E4-E6 and kit Specs 00-12 remains open)
- Rationale: three MandateSignal strategy documents were committed and require
  disposition against the canonical plan before build. This record adds scope;
  it does not modify any existing story, gate, or gate criterion.
- Review date: at WS1-10 gate review. Reversal trigger: any mapped story's
  transferred acceptance criterion is weakened or dropped.

## Dispositioned artifacts (commit-pinned)

| Artifact | Version | Commit | Home |
| --- | --- | --- | --- |
| source-expansion-50.md | 1.1 | mandatesignal `3ea12d1` (PR #47) | MS docs/strategy/ |
| data-insight-architecture-plan.md | 1.3 | mandatesignal `3ea12d1` (PR #47) | MS docs/strategy/ |
| sol-insight-layer-brief.md | 1.1 | mandatesignal `3ea12d1` (PR #47) | MS docs/strategy/ |
| sol-clarity-brief-startingmonday.md | 2.1 | startingmonday `257d49d3` | SM docs/strategy/ (outside signal-engine scope; listed for completeness) |

## Disposition rows

| Story / artifact | Disposition | Master-plan target | Conditions and re-entry triggers |
| --- | --- | --- | --- |
| MS docs/scanner-expansion-plan.md (pre-existing) | `replace` (superseded by source-expansion-50 v1.1 + data-insight-architecture-plan v1.3) | Spec 12 candidate-inventory rule | Sol's call, recorded here per Rich 2026-07-30. Re-entry: any source listed there but absent from source-expansion-50 gets a catalog row (status `planned`) before the old doc is retired from reference. Its backtest-scaffolding notes remain evidence inputs only. |
| SRC-1 SEC item expansion | `merge` | WS2 (scanner integrity) — MandateSignal product-local story | EDGAR declared User-Agent from config (E5-3); ≤10 req/s with backoff; zero regression on existing 5.02 flow. Dual-output with INS-1 (label sink is not gated by WS1-05; see INS-1 row). |
| SRC-2 Subsidy Tracker | `defer` (rights-blocked) | WS1-08 → WS2 | Rights-register row is `pending`; per WS2-06 fail-closed policy, ingestion may proceed for internal scoring only; customer display blocked until written permission recorded. |
| SRC-3 H-1B LCA + Form 5500 | `merge` | WS2 + WS1-13 | Private-company coverage report is the story's justification; re-run coverage number after SRC-3 and record against register row C17. |
| SRC-4 SAM.gov contract awards | `merge` | WS2 | Credential is MandateSignal-local (separate-credentials boundary, section 4). Key registered 2026-07-30; UEI→canonical mapping table required (E3 rule). |
| SRC-5 CT-log watcher | `defer` (build last per E6) | WS2 | Kill criterion required at catalog ingestion (Spec 12 AC5); independent kill switch. |
| SRC-6 people-moves parser | `merge`, gated | WS4 | Chain INPUTS only; D18/manual-50 gate (WS1-06/WS1-07) applies before any chain automation; hold-queue rules per Spec 03. |
| INS-1 label harvester | `merge` | WS6-01 (outcome taxonomies) + WS2 (label/backtest scorecard inputs) | **Gate transfers verbatim:** "Gate: label_registry ≥ 1,000 rows before any backtest or mining runs." WS1-05 does not gate the label sink (labels are structurally SEC-skewed regardless of live coverage; recorded per Rich 2026-07-30); WS1-13 governs live-claims build order only. |
| INS-2 free-archive backfill | `merge` | WS2 bronze ingestion + WS1-08 | Every backfilled claim carries simulated observability (`first_observed_at = source_published_at + lag(source)`, flag `observability: simulated`); rights rows must exist before ingestion. |
| INS-3 silver state vectors | `merge` | WS5 | **AC transfers verbatim:** "as-of discipline enforced in code: a vector for week *t* reads only claims with `first_observed_at ≤ t`. A unit test constructs a claim observed after *t* and asserts it cannot influence the *t* vector." Person-grain columns schema-impossible (Spec 11 AC2 mirror). |
| INS-4 gold marts | `merge` | WS3 product-local views + WS2-04/WS2-05 | **AC transfers verbatim:** "`source_scorecard` computes uniqueness with syndication collapse: wire-service reprints cluster to one underlying fact before corroboration/uniqueness counts (dedupe on normalized headline+date or wire markers). A test feeds 5 reprints and asserts corroboration = 1." |
| INS-5 backtest harness | `merge` | WS2-08 + WS6 | **AC transfers verbatim:** "the harness physically refuses to fit or select on holdout years (config flag + test)"; windows computed by rule at run time (holdout = 3 most recent complete calendar years; mining = 2010 → holdout_start−1; auto-roll each Jan 1); 🟢 signatures re-validated on the new holdout at the next quarterly run, never grandfathered. |
| INS-6 signature engine | `merge` | WS3-06 (versioned recipes) + WS6 rules baseline | Customer-facing renders never include numeric confidence (D9; aligns with DG-12); signature lifecycle transitions recorded with scorecard evidence. |
| INS-7 ops separation | `merge` | WS6/WS2 runtime scorecards | Analytics store separate from serving DB; store separation lands with INS-3, before heavy compute. |

## Standing notes

- All SRC/INS stories are MandateSignal product-local; Starting Monday consumes
  nothing from this work until a versioned contract exists (section 4 boundary;
  recorded per Rich 2026-07-30).
- Cross-product signature/scorecard learning remains blocked until DG-01 closes
  and WS9-01 defines the allowed-field matrix.
- Rights register home: MandateSignal `docs/strategy/rights-register.md`
  (WS1-08 schema; WS2-06 fail-closed enforcement).
