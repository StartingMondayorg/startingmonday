import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { matchExecutiveSearchLags } from '../worker/lib/search-lag-matcher.js'

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...valueParts] = arg.split('=')
  return [key, valueParts.join('=')]
}))
const environment = args.get('--environment')
const outputPath = args.get('--output')
if (!environment) throw new Error('Missing required --environment=<name> argument')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing required Supabase environment variables')

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchAllPositions() {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('executive_positions')
      .select('id, executive_id, company_name, company_cik, company_sector, company_sic_code, company_stage, company_revenue_band, title_normalized, start_date, end_date')
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) throw new Error(`executive_positions: ${error.message}`)
    const page = data ?? []
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

const positions = await fetchAllPositions()
const queriedAt = new Date().toISOString()
const asOfDate = queriedAt.slice(0, 10)
const { summary } = matchExecutiveSearchLags(positions, { asOfDate })
const evidence = {
  schemaVersion: 'e3-search-lag-readiness/v1',
  environment,
  queriedAt,
  asOfDate,
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  },
  mutation: 'none',
  summary,
}

const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)