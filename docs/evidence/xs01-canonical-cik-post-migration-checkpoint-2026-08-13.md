# XS-01 Canonical CIK Post-Migration Checkpoint

- Date: 2026-08-13
- Status: `MIGRATION_VERIFIED_DRY_RUN_RECONCILED`
- Product-local repository: Starting Monday
- Production application SHA: `60bb5985231d9abfbb18278f6def98eef0bba25e`
- Staging PR: #386, merge SHA `10b82fde32f604d17f4134fd8337b2ffe3934d6f`
- Production PR: #387, merge SHA `60bb5985231d9abfbb18278f6def98eef0bba25e`
- Migration workflow run: `31702941760`
- Production write status: `UNAUTHORIZED_NOT_EXECUTED`

## Deployment And Migration

Production web and worker both reported `SUCCESS` at exact SHA `60bb5985`.
Migration workflow run `31702941760` completed successfully at that SHA.
Its migration 172 job passed:

1. apply migration and record history;
2. verify nine ledger columns and two named constraints;
3. verify ledger RLS;
4. verify the unique partial canonical CIK index;
5. verify the writer RPC identity;
6. verify service-role-only table and function privileges; and
7. verify migration-history version 172.

The same workflow also passed migration sequence, global RLS coverage, and API
auth coverage. Migrations 168-171 were neutral skips.

## Fresh Production Dry-Run

The dry-run executed from a clean detached worktree at exact production SHA
`60bb5985`. Machine evidence:
`docs/evidence/xs01-canonical-cik-post-migration-dry-run-2026-08-13.json`.

Results:

- Mode: `dry-run`.
- Mutation: `none`.
- Disposition: `DRY_RUN_RECONCILED`.
- Hosted schema ready: true.
- Linked identity denominator: 100.
- Safe candidates: 36.
- Already aligned: 16.
- Held: 48.
- Populated canonical CIKs: 20.
- Duplicate populated CIKs: 0.
- Ledger rows for the dry-run ID: 0.
- E3 search-lag rows: 267.
- E6 company/industry/role rows: 0/0/1.
- Protected counts unchanged: true.

The governing equation remains `100 = safe 36 + aligned 16 + held 48`.

## Gate State

The authorized staging-first delivery, production migration 172, and fresh
dry-run are complete. The 36-row canonical CIK write remains outside this
authorization and was not attempted.

Before any write, Richard must explicitly authorize:

- policy `linked-company-cik-global-unique-v1`;
- expected safe count 36; and
- one fixed run ID.

After authorization, acceptance remains 0 safe / 52 aligned / 48 held, 56
populated canonical CIKs, 36 ledger rows, zero duplicate CIKs, unchanged E3/E6
counts, and an unchanged idempotency rerun with zero additional writes.

WS1-08 is the next governance slice only after the XS-01 write decision. XS-02
and external-source expansion remain unopened.
