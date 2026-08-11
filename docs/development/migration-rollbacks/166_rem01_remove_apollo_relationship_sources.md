# 166_rem01_remove_apollo_relationship_sources rollback

Goal:
- Re-open Apollo as an allowed relationship-layer source if REM-01 source
  tightening blocks critical ingestion flows or invalidates legacy analytics
  that still depend on `apollo` labels.

Risk triggers:
- Runtime write paths begin failing due to source-check constraint violations
  after deploy.
- Backfill/import jobs require temporary Apollo labeling to complete historical
  repair work.
- Product or analytics consumers need a controlled temporary rollback window
  while provider-only migration callers are remediated.

Pre-rollback safety checks:
- Confirm why rollback is required and identify affected write surfaces.
- Export rows currently labeled `other` in impacted tables for later replay if
  source relabeling needs to be reconstructed.
- Coordinate with REM-01 owner before reopening `apollo` labels so policy drift
  is explicit and time-bounded.

Rollback SQL:
```sql
ALTER TABLE public.people
  DROP CONSTRAINT IF EXISTS people_source_primary_check;

ALTER TABLE public.people
  ADD CONSTRAINT people_source_primary_check
  CHECK (source_primary IN ('manual', 'public_web', 'other', 'apollo'));

ALTER TABLE public.person_sources
  DROP CONSTRAINT IF EXISTS person_sources_source_type_check;

ALTER TABLE public.person_sources
  ADD CONSTRAINT person_sources_source_type_check
  CHECK (source_type IN ('public_web', 'manual', 'other', 'apollo'));

ALTER TABLE public.contact_people
  DROP CONSTRAINT IF EXISTS contact_people_source_check;

ALTER TABLE public.contact_people
  ADD CONSTRAINT contact_people_source_check
  CHECK (source IN ('manual', 'public_web', 'other', 'apollo'));

ALTER TABLE public.company_people_candidates
  DROP CONSTRAINT IF EXISTS company_people_candidates_source_check;

ALTER TABLE public.company_people_candidates
  ADD CONSTRAINT company_people_candidates_source_check
  CHECK (source IN ('public_web', 'manual', 'other', 'apollo'));
```

Validation queries:
```sql
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.relname IN ('people', 'person_sources', 'contact_people', 'company_people_candidates')
  AND conname LIKE '%source%check';

-- Confirm each returned CHECK definition includes 'apollo'.
```

Forward-fix plan:
- Restore provider-only constraints after caller remediation is complete.
- Re-run REM-01 inventory script and verify Apollo rows are zero before
  re-tightening.