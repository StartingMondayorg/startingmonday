# 180_watchlist_source_coverage rollback

Goal:
- Remove the WS11 watchlist, source-coverage, and adapter-health tables if the watchlist scan slice causes schema, policy, or operational regressions.

Risk triggers:
- Watchlist entry creation or source-coverage writes fail after deploy.
- Service-role watchlist reads or adapter-health updates cause unexpected worker errors.
- A follow-up migration or operator decision requires removing the WS11 watchlist slice.

Pre-rollback safety checks:
- Confirm `WATCHLIST_SCAN_WATCHLIST_ID` is unset or the scheduled watchlist job is disabled.
- Export `public.watchlists`, `public.watchlist_entries`, `public.source_coverage`, and `public.adapter_health` if any pilot data exists.
- Confirm no later migration depends on these tables or on `public.touch_watchlist_updated_at()`.
- Record the current migration SHA and the reason for rollback in the deployment log.

Rollback SQL:
```sql
-- Stop new writes before removing the service-role-only WS11 tables.
-- Disable the watchlist worker configuration outside SQL before running this block.

DROP TRIGGER IF EXISTS trg_watchlist_entries_updated_at ON public.watchlist_entries;
DROP TRIGGER IF EXISTS trg_watchlists_updated_at ON public.watchlists;

DROP FUNCTION IF EXISTS public.touch_watchlist_updated_at();

DROP TABLE IF EXISTS public.source_coverage;
DROP TABLE IF EXISTS public.adapter_health;
DROP TABLE IF EXISTS public.watchlist_entries;
DROP TABLE IF EXISTS public.watchlists;
```

Validation queries:
```sql
SELECT to_regclass('public.watchlists');
SELECT to_regclass('public.watchlist_entries');
SELECT to_regclass('public.source_coverage');
SELECT to_regclass('public.adapter_health');
SELECT to_regprocedure('public.touch_watchlist_updated_at()');
```

Forward-fix plan:
- Keep `WATCHLIST_SCAN_WATCHLIST_ID` unset while investigating.
- Re-apply the forward migration in staging after correcting the schema or policy issue, run the focused worker tests, and only then re-enable the opt-in job.
- If data must be retained, restore the exported rows before re-enabling the watchlist job.
