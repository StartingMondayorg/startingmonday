# REM-01 Apollo Purge Inventory (2026-08-10)

## Status

- Verified: purge/inventory script added at `scripts/rem-01-apollo-purge-inventory.mjs`.
- Verified: script was executed in this session in both dry-run and apply modes.
- Verified: environment variables were loaded from `startingmonday/.env.local` into the active shell and execution completed.
- Verified: both runs returned clean results across canonical tables (all before/after counts 0; deleted 0).
- Verified: fail-closed behavior now covers remaining LinkedIn relationship entrypoints (`/api/linkedin-import/consent`, `/api/linkedin-import/audit`) and the contacts UI import surface when matching is disabled.
- Verified: dedicated route tests assert 403 behavior for disabled flag in consent, audit, and match handlers.
- Verified: schema hardening migration added at `supabase/migrations/166_rem01_remove_apollo_relationship_sources.sql` to remove Apollo from allowed source enums/defaults in relationship-layer tables.

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
