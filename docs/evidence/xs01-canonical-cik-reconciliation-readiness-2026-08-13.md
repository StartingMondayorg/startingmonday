# XS-01 Canonical CIK Reconciliation Readiness

- Date: 2026-08-13
- Status: `READY`
- Accountable owner: Richard Rothschild
- Engineering owner: ENG-SM
- Product-local repository: Starting Monday
- Governing re-plan: WS0-06 partial disposition
- Canonical relationships: WS3-06 identity/taxonomy prerequisite; DG-03 product-local physical schema
- Production application baseline: `8628d87bb6a4f4371aab5ebc3c39abed3a788bca`
- Source: already-held `companies.sec_cik` linked by existing `canonical_company_id`
- External source access: none
- Provider spend ceiling: $0
- Customer exposure: none

## Vertical Outcome

Reconcile canonical SEC identity only where already-held linked company rows
produce one globally unique normalized CIK. Preserve every local or global
conflict as a hold. Do not infer company identity by name, domain, current
sector, model output, or external lookup.

## Reproducible Baseline

The production cross-sector audit passes 11 executable reconciliation checks.
The linked-CIK denominator is:

`100 = safe 36 + aligned 16 + local holds 4 + global holds 44`.

Local holds contain two canonical companies with multiple linked CIKs and two
whose existing canonical CIK conflicts with the linked CIK. Global holds are a
set union of 42 candidate-collision rows and 30 already-owned rows, with 28 in
both categories. Existing populated canonical CIKs contain zero duplicate
groups.

## Owning Paths

- Schema: `supabase/migrations/157_canonical_event_layer.sql`.
- Existing resolver: `worker/lib/canonical-company.js`.
- Baseline and planner: `scripts/cross-sector-coverage-baseline.mjs` and
  `scripts/lib/cross-sector-coverage-core.mjs`.
- New operator path: `scripts/reconcile-canonical-ciks.mjs`.
- New guarded migration: `supabase/migrations/172_canonical_cik_reconciliation.sql`.

## Data And Security

- Canonical and per-user company identifiers are internal operational data.
- Evidence artifacts contain aggregate counts only; no company IDs, names,
  CIKs, user IDs, or row-level candidate payloads.
- The reconciliation ledger and RPC remain service-role only with RLS enabled
  and no user policies.
- The RPC revalidates target identity, CIK format, global uniqueness, current
  null state, policy version, and bounded batch size inside one transaction.
- A unique partial index enforces one canonical company per populated CIK.
- Retention of the reconciliation ledger follows operational-evidence policy;
  this slice deletes no source or historical evidence.

## Implementation Contract

Policy version: `linked-company-cik-global-unique-v1`.

1. Dry-run is the default and emits aggregate counts only.
2. Apply requires `--apply` and the exact policy confirmation.
3. The planner proposes only the 36 globally safe candidates at the baseline.
4. The RPC atomically records the run and updates only null canonical CIKs.
5. Repeated application is idempotent and records no duplicate mutation.
6. Any target drift, CIK ownership collision, duplicate input, malformed CIK,
   unknown target, or unsupported policy aborts the transaction.
7. E3 pairs, E6 statistics, canonical events, readers, schedules, source
   collection, and customer surfaces remain unchanged.

## Acceptance Evidence

- Planner fixtures cover normalization, local conflicts, global candidate
  collisions, already-owned CIKs, overlap, and empty cohorts.
- Migration contract tests cover service-role-only access, RLS, unique CIK,
  bounded input, policy assertion, atomic ledger/write behavior, and drift
  rejection.
- Production dry-run reproduces `100 = 36 + 16 + 48` before migration.
- Hosted migration verification proves table/function identity, RLS,
  privileges, unique index, and migration sequence.
- A fresh post-migration dry-run must reproduce the same candidate set before
  any write authorization.
- Explicit write authorization is separate from this readiness decision.
- Post-write reconciliation must produce `100 = safe 0 + aligned 52 + held
  48`, 56 populated canonical CIKs overall, zero duplicate CIKs, and 36 ledger
  rows for the authorized run.
- An unchanged rerun must apply zero additional rows.

## Rollback And Kill

- Before writes: disable the operator path or do not invoke `--apply`.
- After a bounded write: use the run ledger and rollback playbook to clear only
  values written from a prior null state, within the declared rollback window
  and only if no later reconciliation superseded them.
- Drop the RPC and ledger only after data disposition is complete; dropping
  schema alone is not data rollback.
- Any denominator mismatch, duplicate CIK, unexpected target state, failed
  privilege check, or nonzero E3/E6 delta stops the rollout.

## Readiness Decision

All Definition of Ready inputs are present: dependencies and decisions are
named, the repository and implementation boundary are known, the baseline is
reproducible, data/RLS/retention effects are bounded, acceptance and rollback
are written, unrelated work is isolated, and the change fits one Starting
Monday review set. XS-01 may proceed to default-off implementation and dry-run;
production writes remain unauthorized.