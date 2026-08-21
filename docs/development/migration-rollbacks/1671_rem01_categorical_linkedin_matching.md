# Migration 1671 Rollback and Recovery

## Scope

Migration `1671_rem01_categorical_linkedin_matching.sql` narrows LinkedIn relationship matching to categorical `strong_overlap` and `possible_overlap` outcomes. It maps legacy `high` and `medium` tiers to `strong_overlap`, maps `low` to `possible_overlap`, removes the numeric similarity columns and index, and drops the numeric SQL classifier.

## Preconditions

- Confirm the relationship-network matching flag remains disabled.
- Capture a reviewed schema snapshot and row counts for `company_people_connection_matches`.
- Verify the migration has not been applied to production before attempting any repair.
- Preserve the existing default-off relationship matching kill path.

## Rollback posture

This migration is not reversible by restoring the dropped numeric columns from the live schema. Do not run a destructive reverse migration. The safe recovery is:

1. Disable relationship-network matching.
2. Stop any deployment that reads the affected matching path.
3. Preserve migration 1671 and all append-only audit evidence.
4. Restore service behavior through a forward-fix migration and code change.
5. Rebuild any required historical numeric data only from an approved backup, never from inferred categorical tiers.
6. Re-run the focused REM-01 tests, TypeScript, lint, migration checks, and a schema rehearsal before re-enabling anything.

## Failure cases

### Migration fails before commit

No committed schema change is expected because the migration is transactional. Keep the feature flag disabled, inspect the failed statement, and forward-fix the migration before retrying.

### Migration commits but the categorical path fails

Keep the feature flag disabled. Route reads to the previous disabled response, deploy a forward-fix that repairs the categorical constraint or writer, and replay only idempotent matching records after validation.

### Historical rows are missing after the column drop

Do not recreate numeric scores. Restore only the categorical source-of-truth fields from the approved database backup or rebuild categorical matches from the user-owned LinkedIn export and target-company records under the same rule version.

## Verification before re-enable

- `strong_overlap` and `possible_overlap` are the only persisted non-rejected tiers.
- No active application code selects, writes, sorts, or renders numeric similarity fields.
- RLS and user/tenant ownership tests pass.
- Matching remains disabled until REM-01 closeout and hosted evidence are approved.
- Production re-enable requires a separate founder/rights approval; this migration alone does not authorize activation.