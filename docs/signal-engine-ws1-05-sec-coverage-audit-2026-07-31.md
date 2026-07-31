# WS1-05 SEC Coverage Audit + WS1-13 Build-Order Decision â€” 2026-07-31

Governing plan: docs/signal-engine-cross-product-master-plan-2026-07-26.md (WS1-05, WS1-13).
Owner: ENG-SM. Method: read-only query of production `companies` via scripts/ws1-05-sec-coverage-audit.mjs.

## WS1-05 result (Verified)

- Query date: 2026-07-31T00:19:22.518Z
- Denominator: 91 active pipeline companies (145 rows total; 54 archived excluded)
- Numerator (SEC-reporting, `sec_cik` resolved): 55 â†’ **60.4% coverage**
- Confirmed non-SEC (`is_public_company = false`): 33
- Unresolved identities (no `sec_cik`, not confirmed private): 3
  - Sectors: Health Tech (1), AI (1), Entertainment (1). Re-run `scripts/resolve-ciks.mjs` to close.
- Segment dimension: `companies.sector` (free text; 36 distinct values, 30 rows unspecified).
  Largest segments: unspecified 30 (36.7% SEC), Commercial Foodservice Equipment 8 (87.5%),
  high tech 7 (100%), Health Tech 5 (80%), Foodservice Equipment 5 (100%).

Caveats recorded: sector is user-entered free text, so segment splits are indicative, not
taxonomy-grade; denominator is the current live ICP pipeline, which will shift as users add companies.

## WS1-13 decision (AO + DATA to countersign)

SEC reporting coverage (60.4%) is **above the 40% threshold**, so the WS1-13 trigger
("non-SEC lawful source evaluation moves ahead of SEC-dependent expansion") does **not** fire.

Recorded source-priority decision: SEC-dependent expansion proceeds in the sequencing already
committed in the MandateSignal source-expansion plan (SRC-1 â†’ SRC-3 â†’ SRC-4 â†’ SRC-2 â†’ SRC-6 â†’ SRC-5,
per docs/strategy/source-expansion-50.md Â§E6 in the MandateSignal repo). Existing owned ATS
reporting continues. This result governs live-claims build order only; per the amended path
(2026-07-30), it does not gate the SRC-1/INS-1 label harvester.

## Evidence

- Audit script: scripts/ws1-05-sec-coverage-audit.mjs (read-only; paginated select of
  sector, sec_cik, is_public_company, archived_at)
- Full per-sector table: terminal output of the 2026-07-31T00:19:22.518Z run (37 sector rows),
  reproducible by re-running the script.

