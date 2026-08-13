# XS-01 Canonical CIK Write Authorization

- Date: 2026-08-13
- Status: `AUTHORIZED_EXECUTED_RECONCILED`
- Accountable owner: Richard Rothschild
- Product-local repository: Starting Monday
- Production application SHA: `c07a301482be9465cb1b0e868892c71770bfdce2`
- Migration: 172, verified by workflow run `31702941760`
- Policy: `linked-company-cik-global-unique-v1`
- Fixed run ID: `e20bbb60-e8f0-4462-ad6b-8f9996194615`
- Expected safe writes: 36
- Provider spend: $0
- Customer exposure: none

Richard Rothschild explicitly authorized the exact operation in this packet on
2026-08-13. The write and same-run-ID idempotency proof completed successfully;
see `docs/evidence/xs01-canonical-cik-write-closeout-2026-08-13.md`.

## Current Decision Evidence

The current-main production dry-run completed from a clean detached worktree at
SHA `c07a3014` with mutation `none` and disposition
`DRY_RUN_RECONCILED`:

- Linked identity denominator: 100.
- Safe candidates: 36.
- Already aligned: 16.
- Total held: 48 = 2 multiple-linked-CIK conflicts + 2 existing
  canonical/link conflicts + 44 global ownership holds.
- Existing populated canonical CIKs: 20.
- Duplicate populated canonical CIKs: 0.
- Reconciliation ledger rows: 0.
- E3 search-lag rows: 267.
- E6 company/industry/role rows: 0/0/1.
- Protected counts unchanged: true.

The 48 total held rows remain excluded (`2 + 2 + 44`). No best guess or
external lookup is used.

## Authorized Operation

Only the following exact operation is proposed:

```powershell
node --env-file='<production-env>' scripts/reconcile-canonical-ciks.mjs `
  --environment=production `
  --apply `
  --confirm-policy=linked-company-cik-global-unique-v1 `
  --expect-safe=36 `
  --run-id=e20bbb60-e8f0-4462-ad6b-8f9996194615
```

The command must run from exact production SHA `c07a3014`. It may update only
currently null `canonical_companies.sec_cik_padded` values through the
service-role-only migration 172 RPC and write one ledger row per mutation.

## Required Post-State

- RPC proposed/applied/aligned result: 36/36/0.
- Safe candidates: 0.
- Already aligned: 52.
- Total held: 48, with the same `2 + 2 + 44` breakdown.
- Populated canonical CIKs: 56.
- Reconciliation ledger rows for the fixed run ID: 36.
- Duplicate populated canonical CIKs: 0.
- E3 search-lag rows: 267.
- E6 company/industry/role rows: 0/0/1.
- Protected counts unchanged: true.
- Overall disposition: `WRITE_RECONCILED`.

An immediate unchanged rerun with the same run ID must apply zero additional
rows and preserve all required post-state values.

## Stop Conditions

Stop without retrying a changed payload if any of these occur:

- safe count differs from 36;
- production SHA differs from `c07a3014`;
- migration schema or service-only privileges are unavailable;
- local or global CIK ownership conflict reaches the candidate set;
- RPC result, ledger count, canonical count, duplicate count, or E3/E6 counts
  differ from the required post-state;
- a permanent database or policy error occurs; or
- any row-level value appears in evidence output.

## Rollback And Forward Fix

Rollback window: two hours after the authorized write, provided no later
reconciliation exists for the 36 canonical companies. Use the migration 172
run-ledger rollback for the fixed run ID and verify restoration to 36 safe / 16
aligned / 48 held, 20 populated canonical CIKs, zero duplicates, and unchanged
E3/E6 counts.

If downstream canonical events consume the new identities before a defect is
found, prefer an audited forward fix rather than deleting evidence. Do not drop
the ledger or unique index as a substitute for data rollback.

## Authorization Boundary

Authorization of this packet permits only the 36-row XS-01 write, immediate
reconciliation, and one same-run-ID idempotency proof. It does not authorize
SIC/NAICS enrichment, source expansion, WS1-08 decisions, XS-02, UI changes,
E3/E6 mutation, or customer-facing claims.