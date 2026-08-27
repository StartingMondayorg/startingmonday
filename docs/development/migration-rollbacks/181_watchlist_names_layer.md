# 181_watchlist_names_layer rollback

Goal:
- Remove the watchlist-scoped executive snapshot table if the WS11 Names-layer storage contract causes schema, privacy, or retention concerns.

Risk triggers:
- Executive snapshot writes or reads fail after deploy.
- A review determines the watchlist Names layer exceeds the approved KEX-02 scope.
- The source-rights review requires the snapshot store to be removed before an approved roster adapter exists.

Pre-rollback safety checks:
- Confirm `WATCHLIST_SCAN_WATCHLIST_ID` is unset or the scheduled watchlist job is disabled.
- Export `public.watchlist_exec_snapshots` if any snapshot rows exist and retention is required.
- Confirm no later migration or worker release depends on `public.watchlist_exec_snapshots`.
- Record the current migration SHA, retention decision, and rollback reason in the deployment log.

Rollback SQL:
```sql
DROP TABLE IF EXISTS public.watchlist_exec_snapshots;
```

Validation queries:
```sql
SELECT to_regclass('public.watchlist_exec_snapshots');
```

Forward-fix plan:
- Keep the Names-layer populating adapter disabled until KEX-02 and WS1-08 source-rights requirements are satisfied.
- Re-apply the forward migration in staging after correcting the schema or privacy decision, run the focused worker tests, and only then re-enable any dependent code.
- Do not wire People Data Labs or another commercial person-data source into this table without a separately recorded WS1-08 rights decision.
