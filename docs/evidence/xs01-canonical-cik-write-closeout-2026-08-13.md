# XS-01 Canonical CIK Write Closeout

- Date: 2026-08-13
- Status: `VERIFIED`
- Product-local repository: Starting Monday
- Production application SHA: `c07a301482be9465cb1b0e868892c71770bfdce2`
- Migration: 172; workflow run `31702941760`
- Policy: `linked-company-cik-global-unique-v1`
- Run ID: `e20bbb60-e8f0-4462-ad6b-8f9996194615`
- Explicit authorization: Richard Rothschild, 2026-08-13

## Authorized Write

The exact authorized 36-row write ran once from a clean detached worktree at
production SHA `c07a3014`.

- RPC proposed/applied/aligned: 36/36/0.
- RPC attempts: 1.
- Applied canonical CIK delta: 36.
- Reconciliation ledger rows: 36.
- Safe candidates: 36 to 0.
- Already aligned: 16 to 52.
- Total held: 48 to 48, comprising 2 multiple-linked-CIK conflicts, 2
	existing canonical/link conflicts, and 44 global ownership holds.
- Populated canonical CIKs: 20 to 56.
- Duplicate populated CIKs: 0.
- E3 search-lag rows: 267.
- E6 company/industry/role rows: 0/0/1.
- Protected counts unchanged: true.
- Disposition: `WRITE_RECONCILED`.

Machine evidence:
`docs/evidence/xs01-canonical-cik-write-2026-08-13.json`.

That raw write artifact is preserved exactly as emitted by the pre-follow-up
CLI and therefore does not contain the later `idempotentReplay` field. Its
36-row applied delta and 36/36/0 RPC result establish first-apply semantics.
The separate idempotency artifact records the same-run replay; neither artifact
was regenerated after the production operations.

## Idempotency Proof

The immutable 36-row run ledger reconstructed the exact original payload. The
same policy and same run ID were replayed through the migration 172 RPC.

- RPC proposed/applied/aligned: 36/0/36.
- Canonical CIK rows remained 56.
- Ledger rows remained 36.
- Duplicate CIKs remained 0.
- E3/E6 counts remained 267 and 0/0/1.
- Disposition: `IDEMPOTENCY_PROVEN`.

Machine evidence:
`docs/evidence/xs01-canonical-cik-idempotency-2026-08-13.json`.

## Operator Follow-Up

The production RPC was idempotent as designed. The shipped CLI initially
recomputed only currently safe candidates, which becomes an empty payload after
a successful write. A follow-up fix now reconstructs same-run-ID replay payloads
from active ledger rows, rejects rolled-back or policy-mismatched ledgers, and
keeps evidence aggregate-only. Focused tests cover first apply, valid replay,
and invalid replay ledgers.

These Vitest tests run in the required CI predeploy job through `npm test` and
again under `npm run test:coverage` for pull requests and protected branches.

## Final Gate State

XS-01 is `VERIFIED` for the bounded canonical CIK reconciliation scope. The 48
total held rows remain unresolved and unchanged (`2 + 2 + 44`). This closes neither the broader
cross-sector source gap nor WS1-08, XS-02, SIC/NAICS enrichment, organization
type, ownership, scale, lifecycle, E3, or E6.

The next primary slice is the focused WS1-08 source-rights refresh. External
source expansion and XS-02 remain blocked until that review is current.
