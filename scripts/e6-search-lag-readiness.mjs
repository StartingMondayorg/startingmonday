import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { buildSearchLagStats, enrichSearchLagRows } from '../worker/lib/search-lag-stats.js'

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...valueParts] = arg.split('=')
  return [key, valueParts.join('=')]
}))
const environment = args.get('--environment')
const outputPath = args.get('--output')
if (!environment) throw new Error('Missing required --environment=<name>')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const [lagResult, companyResult] = await Promise.all([
  db
    .from('exec_search_lag')
    .select('company_name, company_cik, company_sector, company_sic_code, company_stage, title_normalized, lag_days, search_year, matching_policy_version')
    .eq('matching_policy_version', 'cik-role-earliest-v1')
    .limit(5000),
  db
    .from('canonical_companies')
    .select('name, sec_cik_padded, sector')
    .not('sec_cik_padded', 'is', null)
    .limit(5000),
])
if (lagResult.error) throw lagResult.error
if (companyResult.error) throw companyResult.error

const { summary } = buildSearchLagStats(enrichSearchLagRows(lagResult.data, companyResult.data))
const evidence = {
  schemaVersion: 'e6-search-lag-readiness/v1',
  environment,
  queriedAt: new Date().toISOString(),
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  },
  mutation: 'none',
  summary,
  disposition: summary.roleGroupsPublished > 0
    ? 'READY_FOR_INTERNAL_REFRESH'
    : 'BLOCKED_NO_SUPPORTED_ROLE_COHORTS',
}
const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)