import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { matchExecutiveSearchLags } from '../worker/lib/search-lag-matcher.js'

const POLICY_VERSION = 'cik-role-earliest-v1'
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...valueParts] = arg.split('=')
  return [key, valueParts.join('=')]
}))
const environment = args.get('--environment')
const outputPath = args.get('--output')
const apply = args.has('--apply')
const expectEmpty = args.has('--expect-empty')
const confirmedPolicy = args.get('--confirm-policy')
if (!environment) throw new Error('Missing required --environment=<name> argument')
if (apply && confirmedPolicy !== POLICY_VERSION) {
  throw new Error(`Apply requires --confirm-policy=${POLICY_VERSION}`)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing required Supabase environment variables')

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const RETRIABLE_CODES = new Set(['40001', '40P01', '53300', '57014', '57P03', '08000', '08003', '08006'])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetriable(error) {
  return RETRIABLE_CODES.has(error?.code)
    || /fetch failed|network|timeout|temporar|connection/i.test(error?.message ?? '')
}

async function writeMatch(match, asOfDate) {
  let lastError = null
  let attemptsUsed = 0
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attemptsUsed = attempt
    const { error } = await db.rpc('upsert_exec_search_lag_match', {
      p_departure_id: match.departureId,
      p_appointment_id: match.appointmentId,
      p_matching_policy_version: POLICY_VERSION,
      p_as_of_date: asOfDate,
    })
    if (!error) return { error: null, attempts: attempt }
    lastError = error
    if (!isRetriable(error) || attempt === 3) break
    await sleep(250 * attempt)
  }
  return { error: lastError, attempts: attemptsUsed }
}

async function countPersistedPolicyRows({ requireSchema }) {
  const policyResult = await db
    .from('exec_search_lag')
    .select('id', { count: 'exact', head: true })
    .eq('matching_policy_version', POLICY_VERSION)
  if (!policyResult.error) return { count: policyResult.count, schemaReady: true }
  if (requireSchema) throw new Error('exec_search_lag matching schema unavailable')
  const totalResult = await db
    .from('exec_search_lag')
    .select('id', { count: 'exact', head: true })
  if (totalResult.error) throw new Error(`exec_search_lag reconciliation: ${totalResult.error.message}`)
  if ((totalResult.count ?? 0) > 0) {
    throw new Error('matching policy column unavailable with existing search-lag rows')
  }
  return { count: 0, schemaReady: false }
}

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

const queriedAt = new Date().toISOString()
const asOfDate = queriedAt.slice(0, 10)
const positions = await fetchAllPositions()
const { matches, summary } = matchExecutiveSearchLags(positions, { asOfDate })
let applied = 0
let failed = 0
let retryAttempts = 0
const failureReasons = {}

if (apply) {
  for (const match of matches) {
    const { error, attempts } = await writeMatch(match, asOfDate)
    retryAttempts += attempts - 1
    if (error) {
      failed += 1
      const reason = error.message?.split(':')[0] || 'unknown_rpc_failure'
      failureReasons[reason] = (failureReasons[reason] ?? 0) + 1
    } else {
      applied += 1
    }
  }
}

const persisted = await countPersistedPolicyRows({ requireSchema: apply })
if (expectEmpty && persisted.count !== 0) throw new Error('expected empty search-lag baseline')

const evidence = {
  schemaVersion: 'e3-search-lag-run/v1',
  environment,
  queriedAt,
  asOfDate,
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  },
  mode: apply ? 'apply' : 'dry-run',
  matchingPolicyVersion: POLICY_VERSION,
  summary,
  writes: {
    attempted: apply ? matches.length : 0,
    applied,
    failed,
    retryAttempts,
    failureReasons,
    persistedPolicyRows: persisted.count,
    schemaReady: persisted.schemaReady,
  },
}

const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)

if (apply && (failed > 0 || persisted.count !== matches.length)) process.exitCode = 1