# E3 Search-Lag Write Authorization

Date: 2026-08-13

Status: `AUTHORIZED_NOT_EXECUTED`

Environment: production

Matching policy: `cik-role-earliest-v1`

## Deployment and Migration

- Production web and worker: `SUCCESS` at exact main SHA
  `97158ca65f8216dca47db1bae4df2f2ca794fc7f`.
- Migration workflow run: `31664801557`.
- Workflow head SHA: `97158ca65f8216dca47db1bae4df2f2ca794fc7f`.
- Migration 170 apply and history recording: pass.
- Hosted columns, constraints, writer function, RLS, and privileges: pass.
- Service role can execute the writer; anon and authenticated roles cannot.

## Fresh Post-Migration Dry Run

Machine evidence:
`docs/evidence/e3-search-lag-post-migration-dry-run-2026-08-13.json`.

- Mode: `dry-run`.
- Executive-position rows: 5,284.
- Departure candidates: 2,556.
- Deterministic pairs: 267.
- Held departures: 2,289.
- Denominator reconciliation: 2,556 = 267 + 2,289.
- Attempted writes: 0.
- Applied writes: 0.
- Failed writes: 0.
- Persisted policy rows: 0.
- Hosted schema ready: true.

## Pair-by-Pair Aggregate Reconciliation

A second read-only audit reloaded the current production source rows and
reconciled every proposed pair without emitting row-level identifiers:

- Unique departure IDs: 267.
- Unique appointment IDs: 267.
- Missing source rows: 0.
- Duplicate departures: 0.
- Duplicate appointments: 0.
- Missing executive identities: 0.
- Same-executive pairs: 0.
- Company identity mismatches: 0.
- Role identity mismatches: 0.
- Non-positive lags: 0.
- Appointments after the as-of date: 0.
- Existing successor conflicts: 0.
- Existing predecessor conflicts: 0.
- Total issues: 0.
- Authorization result: true.

## Authorization Decision

The one-time explicit production write is authorized for exactly the current
267 pairs under policy `cik-role-earliest-v1` and as-of date `2026-08-13`.

Authorization does not execute the write. Execution requires the explicit CLI
flags:

```powershell
node --env-file='<production-env-path>' scripts/compute-search-lag.mjs --environment=production --apply --confirm-policy=cik-role-earliest-v1 --output='<closeout-artifact-path>'
```

The command must stop on any RPC failure, reconciliation mismatch, source-row
change that alters the 267-pair denominator, or pre-existing persisted row.
After execution, rerun the command to prove idempotency and verify all 267
search-lag rows plus successor/predecessor links before advancing E3.

No explicit data write was executed while producing this authorization.
