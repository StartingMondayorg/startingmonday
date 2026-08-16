# Migration 166 Rollback and Recovery

## Scope

Migration `166_rem01_remove_apollo_relationship_sources.sql` normalizes legacy Apollo source markers to `other`, changes relationship-table defaults to `manual`, and tightens source constraints so Apollo is no longer an allowed runtime source.

## Preconditions

- Keep relationship-network matching disabled.
- Capture reviewed before/after counts for all four declared source columns.
- Verify the approved provider-retention and backup decision before any hosted apply.
- Preserve the migration and its evidence as an append-only release artifact.

## Rollback posture

Do not reverse the source constraints or restore Apollo as an allowed runtime source. The migration is a compliance remediation, and re-enabling Apollo would violate the REM-01 decision.

If a deployment fails after migration 166:

1. Keep the relationship matching feature flag disabled.
2. Leave the tightened constraints in place.
3. Restore application availability with a forward-fix that uses only `manual`, `public_web`, or `other` sources.
4. Re-run focused route, RLS, migration, and source-policy tests.
5. Reconcile any affected rows from approved backups only when required for data integrity; do not recreate Apollo provenance as an active source.

## Failure cases

### Migration fails before commit

The transaction should leave the schema unchanged. Inspect the failed statement, correct it in a forward migration, and keep the feature disabled while retrying.

### Legacy rows remain after normalization

Do not relax the constraint. Use the approved count-only inventory and an idempotent forward cleanup for remaining rows, then rerun the zero-row verification.

### An application path still emits Apollo

Stop promotion, keep matching disabled, remove or normalize the emitting path, and add a regression test. No runtime rollback to Apollo is permitted.

## Verification before REM-01 closeout

- All four declared Apollo source counts are zero.
- No active application source path emits Apollo relationship records.
- The tightened constraints and defaults are present.
- Matching remains default-off and independently guarded.
- The migration, hosted counts, backup/retention decision, and any notice decision are linked in the REM-01 closeout evidence.
