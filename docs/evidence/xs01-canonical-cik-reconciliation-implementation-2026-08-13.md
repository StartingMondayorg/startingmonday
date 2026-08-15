# XS-01 Canonical CIK Reconciliation Implementation

- Date: 2026-08-13
- Status: `IMPLEMENTED_LOCAL_READY_FOR_DELIVERY`
- Product-local repository: Starting Monday
- Branch: `feat/cross-sector-coverage-baseline`
- Base SHA: `8628d87bb6a4f4371aab5ebc3c39abed3a788bca`
- Policy: `linked-company-cik-global-unique-v1`
- Production writes: `UNAUTHORIZED`

## Implemented

- Collision-aware pure reconciliation planner.
- Migration 172 with globally unique populated canonical CIKs.
- Service-role-only RLS ledger and atomic reconciliation RPC.
- Exact run-ID reuse protection and bounded payload validation.
- Dry-run-default operator CLI with explicit apply, policy, run-ID, and expected
  count gates.
- E3/E6 before-and-after count reconciliation.
- Rollback playbook and default-off hosted apply/verify workflow.

## Production Dry-Run

The pre-migration read-only run produced:

- Linked identity denominator: 100.
- Globally safe candidates: 36.
- Already aligned: 16.
- Local/global holds: 48.
- Populated canonical CIKs: 20.
- Duplicate populated CIKs: 0.
- E3 search-lag rows: 267.
- E6 company/industry/role rows: 0/0/1.
- Protected counts unchanged: true.
- Hosted migration 172 schema ready: false.
- Disposition: `DRY_RUN_RECONCILED`.

Machine evidence:
`docs/evidence/xs01-canonical-cik-dry-run-2026-08-13.json`.

## Validation

- Focused planner and migration matrix: 14 tests passed.
- ESLint: passed for touched executable files.
- Migration 172 is the highest numbered migration.
- Workflow delta is one default-false input and one guarded apply/verify job.
- Independent review: `PASS`; no P0/P1 findings.
- Evidence output remains aggregate-only.

## Remaining Gates

1. Deliver the reviewed code through the repository release path.
2. Verify the exact deployed application SHA.
3. Dispatch migration 172's default-off apply/verify job.
4. Run a fresh post-migration dry-run and reproduce 36/16/48.
5. Obtain explicit 36-row write authorization.
6. Apply with a fixed run ID and exact policy/count confirmation.
7. Reconcile 0/52/48, 56 total populated canonical CIKs, 36 ledger rows,
   zero duplicate CIKs, and unchanged E3/E6 counts.
8. Re-run unchanged input to prove zero additional writes.

WS1-08 source-rights refresh remains the next governance slice after XS-01's
write decision. No XS-02 or external-source work has started.