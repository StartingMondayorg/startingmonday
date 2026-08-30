# Release Note - Watchlist-Scoped Source Coverage and Adapter Controls

Date: 2026-08-27
Tickets: WS11-01, WS11-02, WS11-03, WS11-04, WS11-05
Owner: Engineering + Product

## Scope covered in this release series
1. Watchlist-scoped source orchestration over existing SEC, PR wire, WARN, and public ATS adapters.
2. Per-source coverage accounting, first-observed/dedup reuse, and adapter health controls.
3. Explicit rollback playbooks and human-reviewed adapter re-enable behavior.

## User-visible changes
1. Internal watchlist operations can run approved public-source adapters against a watchlist without mixing that data with per-user company records.
2. Operations can see `full`, `thin`, or `failed` source coverage for each watchlist entry and scan run.
3. Adapters can auto-disable after repeated failures and require an explicit reviewed re-enable operation; the scheduled watchlist scan remains opt-in until a watchlist ID is configured.
4. WARN notices are fetched once per state and matched to watchlist entries, while public ATS leadership openings can be recorded when an entry has an explicitly configured board.

## KPI intent
1. Reduce redundant research and web-search usage by reusing existing source adapters and first-observed event deduplication.
2. Make source gaps visible instead of presenting incomplete coverage as a successful scan.
3. Prevent repeated source failures from silently continuing and require human review before resumption.
4. Measure watchlist coverage and source freshness before expanding the scheduled scan beyond its default-off state.

## Rollback triggers
1. Watchlist reads or source-coverage writes cause worker errors or unexpected database load.
2. An adapter produces repeated unauthorized responses, malformed output, or materially incorrect company matches.
3. Watchlist data is found to cross the product-local boundary or the approved public-source scope.
4. A migration rollback readiness check or source-rights review identifies an unresolved control gap.

## Rollback plan
1. Unset `WATCHLIST_SCAN_WATCHLIST_ID` to keep the scheduled job disabled.
2. Re-enable an adapter only through the reviewed `reEnableAdapter` operation after its failure cause is documented.
3. Use the dedicated rollback playbooks for migrations 180 and 181 if the schema must be removed.
4. Preserve or export any pilot rows before rollback when retention is required.

## Post-release verification checklist
1. Confirm the merged worker and main application deployments run the approved `main` SHA.
2. Confirm migrations 180 and 181 are applied before configuring any watchlist ID.
3. Confirm the default-off scheduled job logs a disabled state when no watchlist ID is configured.
4. Confirm strict rollback readiness, source scans, and focused WS11 tests pass before enabling a pilot watchlist.
