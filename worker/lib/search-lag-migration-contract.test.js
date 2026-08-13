import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/170_exec_search_lag_matching.sql'),
  'utf8',
)
const rollback = fs.readFileSync(
  path.join(root, 'docs/development/migration-rollbacks/170_exec_search_lag_matching.md'),
  'utf8',
)

describe('migration 170 search-lag writer contract', () => {
  it('enforces one-to-one positive-lag evidence', () => {
    expect(migration).toContain('exec_search_lag_departure_key unique (departure_id)')
    expect(migration).toContain('exec_search_lag_appointment_key unique (appointment_id)')
    expect(migration).toContain('exec_search_lag_positive_lag_check')
    expect(migration).toContain('exec_search_lag_matching_evidence_check')
  })

  it('keeps the atomic RPC service-role only and fail closed', () => {
    expect(migration).toContain("if (select auth.role()) <> 'service_role'")
    expect(migration).toContain("raise exception 'appointment_not_earliest'")
    expect(migration).toContain("raise exception 'ambiguous_earliest_appointment'")
    expect(migration).toContain('revoke all on function public.upsert_exec_search_lag_match')
    expect(migration).toContain('grant execute on function public.upsert_exec_search_lag_match')
    expect(migration).toContain("'[^0-9]', '', 'g'")
  })

  it('refreshes all derived evidence on an idempotent rerun', () => {
    for (const field of [
      'company_name', 'company_cik', 'company_sector', 'company_sic_code',
      'company_stage', 'company_revenue_band', 'title_normalized', 'lag_days',
      'replacement_type', 'search_year',
    ]) {
      expect(migration).toContain(`${field} = excluded.${field}`)
    }
  })

  it('documents reversal of derived links and rows', () => {
    expect(rollback).toContain('set successor_id = null')
    expect(rollback).toContain('set predecessor_id = null')
    expect(rollback).toContain("delete from public.exec_search_lag")
    expect(rollback).toContain('drop function if exists public.upsert_exec_search_lag_match')
    expect(rollback.indexOf('remaining_v1_rows_before_schema_drop'))
      .toBeLessThan(rollback.indexOf('drop column if exists matching_policy_version'))
  })
})