# REM-01 Apollo Purge Inventory (2026-08-10)

## Status
- Verified: purge/inventory script added at `scripts/rem-01-apollo-purge-inventory.mjs`.
- Verified: script was executed in this session in both dry-run and apply modes.
- Verified: execution is currently blocked in this shell due to missing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Unverified: before/after row counts and delete counts (cannot be produced until env vars are available).

## Scope
This inventory tracks Apollo-sourced rows in:
- `people.source_primary='apollo'`
- `company_people_candidates.source='apollo'`
- `person_sources.source_type='apollo'`
- `contact_people.source='apollo'`
- `contacts.enrichment_source='apollo'`
- `user_relationships.source='apollo'`

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

## Blocker detail
Current shell result:
- `Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`

Resolution:
1. Export/load both environment variables for this shell.
2. Re-run dry-run and apply commands above.
3. Attach the generated JSON artifacts to the REM-01 evidence package.
