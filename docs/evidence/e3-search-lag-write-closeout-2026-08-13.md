# E3 Search-Lag Write Closeout

Date: 2026-08-13

Status: `VERIFIED`

Environment: production

Matching policy: `cik-role-earliest-v1`

## Authority and Deployment

- Write authorization:
  `docs/evidence/e3-search-lag-write-authorization-2026-08-13.md`.
- Deployed implementation SHA:
  `97158ca65f8216dca47db1bae4df2f2ca794fc7f`.
- Production web and worker were `SUCCESS` at that exact SHA before execution.
- Migration 170 workflow `31664801557` passed apply, history, schema,
  constraints, service-only privileges, and RLS verification.

## Initial Write

- Departure candidates: 2,556.
- Deterministic pairs: 267.
- Held departures: 2,289.
- Attempted writes: 267.
- Applied writes: 267.
- Failed writes: 0.
- Retry attempts: 0.
- Persisted policy rows: 267.

The first execution inherited the primary checkout as its process working
directory, so its generated repository metadata named the wrong local branch.
That artifact was discarded. The executed script path and implementation were
the promoted E3 code; exact-SHA provenance is established by the idempotency
run below.

## Exact-SHA Idempotency Run

Machine evidence:
`docs/evidence/e3-search-lag-idempotency-2026-08-13.json`.

- Runner: detached exact SHA `97158ca65f8216dca47db1bae4df2f2ca794fc7f`.
- Attempted writes: 267.
- Applied writes: 267 idempotent same-pair upserts.
- Failed writes: 0.
- Retry attempts: 0.
- Persisted policy rows after rerun: 267.

## Post-Write Reconciliation

Machine evidence:
`docs/evidence/e3-search-lag-post-write-reconciliation-2026-08-13.json`.

- Recomputed expected pairs: 267.
- Persisted pairs: 267.
- Unique departure IDs: 267.
- Unique appointment IDs: 267.
- Missing or unexpected persisted pairs: 0.
- Duplicate departure or appointment IDs: 0.
- Lag mismatches: 0.
- Policy or as-of mismatches: 0.
- Successor-link mismatches: 0.
- Successor-lag mismatches: 0.
- Predecessor-link mismatches: 0.
- Total reconciliation issues: 0.

## Disposition

The bounded E3 departure-to-appointment increment is `VERIFIED` for the 267
deterministic pairs under policy `cik-role-earliest-v1` and as-of date
`2026-08-13`.

This closes the first E3 vertical increment. It does not complete E3 as a
whole, authorize paid PDL enrichment, populate tenure-stat tables, or expose
search-lag context to customers. The next admitted slice is the scheduled E6
search-lag refresh and evidence-bounded internal alert context described by the
execution ledger, subject to its own Definition of Ready.
