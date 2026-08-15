import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/172_canonical_cik_reconciliation.sql'),
  'utf8',
)

describe('canonical CIK reconciliation migration', () => {
  it('enforces globally unique populated canonical CIKs', () => {
    expect(migration).toMatch(/create unique index if not exists canonical_companies_sec_cik_unique_idx/i)
    expect(migration).toMatch(/where sec_cik_padded is not null/i)
  })

  it('keeps the ledger service-only behind RLS', () => {
    expect(migration).toMatch(/canonical_cik_reconciliation_ledger enable row level security/i)
    expect(migration).toMatch(/constraint canonical_cik_reconciliation_cik_check/i)
    expect(migration).toMatch(/constraint canonical_cik_reconciliation_run_company_key/i)
    expect(migration).toMatch(/revoke all on table public\.canonical_cik_reconciliation_ledger from authenticated/i)
    expect(migration).toMatch(/grant select on table public\.canonical_cik_reconciliation_ledger to service_role/i)
  })

  it('guards policy, role, payload, bounded batches, and drift', () => {
    expect(migration).toMatch(/service_role_required/)
    expect(migration).toMatch(/linked-company-cik-global-unique-v1/)
    expect(migration).toMatch(/candidate_batch_too_large/)
    expect(migration).toMatch(/duplicate_candidate_cik/)
    expect(migration).toMatch(/run_id_reuse_conflict/)
    expect(migration).toMatch(/canonical_cik_state_drift/)
    expect(migration).toMatch(/canonical_cik_already_owned/)
  })

  it('records the ledger and update in one security-definer RPC', () => {
    expect(migration).toMatch(/security definer/i)
    expect(migration).toMatch(/insert into public\.canonical_cik_reconciliation_ledger/i)
    expect(migration).toMatch(/update public\.canonical_companies company/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/)
  })

  it('denies RPC execution to browser roles', () => {
    expect(migration).toMatch(/revoke all on function public\.reconcile_canonical_company_ciks\(uuid, jsonb, text\) from anon/i)
    expect(migration).toMatch(/revoke all on function public\.reconcile_canonical_company_ciks\(uuid, jsonb, text\) from authenticated/i)
    expect(migration).toMatch(/grant execute on function public\.reconcile_canonical_company_ciks\(uuid, jsonb, text\) to service_role/i)
  })
})