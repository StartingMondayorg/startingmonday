# REM-01 Apollo Purge Inventory (2026-08-10)

## Status

- Verified: purge/inventory script added at `scripts/rem-01-apollo-purge-inventory.mjs`.
- Verified: script was executed in this session in both dry-run and apply modes.
- Verified: environment variables were loaded from `startingmonday/.env.local` into the active shell and execution completed.
- Verified: both runs returned clean results across canonical tables (all before/after counts 0; deleted 0).
- Verified: fail-closed behavior now covers remaining LinkedIn relationship entrypoints (`/api/linkedin-import/consent`, `/api/linkedin-import/audit`) and the contacts UI import surface when matching is disabled.
- Verified: dedicated route tests assert 403 behavior for disabled flag in consent, audit, and match handlers.
- Verified: schema hardening migration added at `supabase/migrations/166_rem01_remove_apollo_relationship_sources.sql` to remove Apollo from allowed source enums/defaults in relationship-layer tables.
- Verified: discover, onboarding enrichment progress, and enrichment-retention cron runtime paths now normalize to supported sources (`anthropic`, `fallback`) with Apollo-specific branching removed.
- Verified: EDGAR admin status route now reads provider quality alert state only (`provider-quality-audit`); legacy Apollo response alias/fallback removed.
- Verified: worker quality audit scheduling/runtime contract now targets provider-only surfaces (`worker/jobs/provider-quality-audit-job.js` -> `/api/cron/provider-quality-audit`) and Apollo-named worker module/path references were removed from scheduler and ops taxonomy docs.
- Verified: outreach provider priority datasets now use provider-prefixed identifiers in active pages, with suffix-based compatibility lookup in `readOutreachCsv` so legacy file names remain readable without Apollo literals in runtime code.
- Verified: compliance runbook path/title migrated to provider naming (`docs/provider-enrichment-compliance-runbook.md`) and downstream documentation references were updated.
- Verified: runtime/provider migration is complete; remaining `apollo` literal usage in `src/` is intentionally scoped to the compatibility alias route (`/api/cron/apollo-quality-audit`) and its test coverage.
- Verified: provider cron route now has explicit auth-gate regression coverage (`src/app/api/cron/provider-quality-audit/route.test.ts`) asserting static `runtime='nodejs'` and fail-closed `403` behavior for invalid cron auth.
- Verified: compatibility alias responses now include explicit migration headers (`x-startingmonday-compat-route`, `x-startingmonday-replacement-route`) so legacy usage can be audited and sunset safely.
- Verified: compatibility alias now records non-blocking hit telemetry in `monitoring_alert_state` (`alert_key='apollo-quality-audit-compat-hit'`) with cumulative `hitCount`, last path/query, user-agent, and replacement route metadata for deprecation-readiness tracking.

## Scope

This inventory tracks Apollo-sourced rows in:

- `people.source_primary='apollo'`
- `company_people_candidates.source='apollo'`
- `person_sources.source_type='apollo'`
- `contact_people.source='apollo'`

## Commands

Dry run:

```bash
node scripts/rem-01-apollo-purge-inventory.mjs --output=tmp/rem-01-apollo-purge-inventory-dry-run.json
```

Apply purge:

```bash
node scripts/rem-01-apollo-purge-inventory.mjs --apply --output=tmp/rem-01-apollo-purge-inventory-apply.json
```

## Expected artifacts

- `tmp/rem-01-apollo-purge-inventory-dry-run.json`
- `tmp/rem-01-apollo-purge-inventory-apply.json`

Both files include:

- `before` counts by table/filter
- per-table `purge` status
- `after` counts by table/filter
- `deleted` deltas (computed as before - after)

## Execution result snapshot

- Dry-run artifact: `tmp/rem-01-apollo-purge-inventory-dry-run.json`
- Apply artifact: `tmp/rem-01-apollo-purge-inventory-apply.json`

Per-table outcome (both runs):

- `people.source_primary='apollo'` → before 0, after 0, deleted 0
- `company_people_candidates.source='apollo'` → before 0, after 0, deleted 0
- `person_sources.source_type='apollo'` → before 0, after 0, deleted 0
- `contact_people.source='apollo'` → before 0, after 0, deleted 0
