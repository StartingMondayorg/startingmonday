import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/171_search_lag_stats_refresh.sql'),
  'utf8',
)
const rollback = fs.readFileSync(
  path.join(root, 'docs/development/migration-rollbacks/171_search_lag_stats_refresh.md'),
  'utf8',
)

describe('migration 171 search-lag stats contract', () => {
  it('enforces company, industry, and role support floors', () => {
    expect(migration).toContain('sample_size >= 3')
    expect(migration).toContain('sample_size >= 10')
    expect(migration).toContain('sample_size integer not null check (sample_size >= 20)')
  })

  it('keeps the five-argument replacement RPC service-role only', () => {
    expect(migration).toContain('public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text)')
    expect(migration).toContain("if (select auth.role()) <> 'service_role'")
    expect(migration).toContain('grant execute on function public.replace_search_lag_stats')
    expect(migration).toContain('alter table public.search_lag_role_stats enable row level security')
  })

  it('rolls back E6 outputs without deleting E3 source pairs', () => {
    expect(rollback).toContain('drop table if exists public.search_lag_role_stats')
    expect(rollback).toContain('Preserve all `exec_search_lag` rows')
    expect(rollback).not.toContain('delete from public.exec_search_lag')
  })
})