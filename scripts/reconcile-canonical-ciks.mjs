import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  buildCanonicalCikReconciliationPlan,
  selectCanonicalCikApplyPayload,
} from './lib/cross-sector-coverage-core.mjs'

const POLICY_VERSION = 'linked-company-cik-global-unique-v1'
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...valueParts] = arg.split('=')
  return [key, valueParts.join('=')]
}))
const environment = args.get('--environment')
const outputPath = args.get('--output')
const apply = args.has('--apply')
const confirmedPolicy = args.get('--confirm-policy')
const expectedSafe = args.has('--expect-safe') ? Number(args.get('--expect-safe')) : null
const runId = args.get('--run-id') ?? (apply ? null : randomUUID())

if (!environment) throw new Error('Missing required --environment=<name>')
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables')
}
if (apply && confirmedPolicy !== POLICY_VERSION) {
  throw new Error(`Apply requires --confirm-policy=${POLICY_VERSION}`)
}
if (apply && !runId) throw new Error('Apply requires --run-id=<uuid>')
if (apply && (!Number.isInteger(expectedSafe) || expectedSafe < 0)) {
  throw new Error('Apply requires --expect-safe=<non-negative integer>')
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const page = data ?? []
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

async function readState() {
  const [companies, canonicalCompanies, e3, e6Company, e6Industry, e6Role] = await Promise.all([
    fetchAll('companies', 'canonical_company_id, sec_cik'),
    fetchAll('canonical_companies', 'id, sec_cik_padded'),
    db.from('exec_search_lag').select('id', { count: 'exact', head: true }),
    db.from('company_tenure_stats').select('id', { count: 'exact', head: true }),
    db.from('industry_tenure_stats').select('id', { count: 'exact', head: true }),
    db.from('search_lag_role_stats').select('id', { count: 'exact', head: true }),
  ])
  for (const [name, result] of [
    ['exec_search_lag', e3],
    ['company_tenure_stats', e6Company],
    ['industry_tenure_stats', e6Industry],
    ['search_lag_role_stats', e6Role],
  ]) {
    if (result.error) throw new Error(`${name}: ${result.error.message}`)
  }
  const plan = buildCanonicalCikReconciliationPlan(companies, canonicalCompanies)
  const populatedCiks = canonicalCompanies.map((row) => row.sec_cik_padded).filter(Boolean)
  return {
    plan,
    canonicalCikRows: populatedCiks.length,
    duplicateCanonicalCikRows: populatedCiks.length - new Set(populatedCiks).size,
    protectedCounts: {
      execSearchLag: e3.count ?? 0,
      companyStats: e6Company.count ?? 0,
      industryStats: e6Industry.count ?? 0,
      roleStats: e6Role.count ?? 0,
    },
  }
}

async function readLedgerRows(targetRunId) {
  const result = await db
    .from('canonical_cik_reconciliation_ledger')
    .select('id, run_id, canonical_company_id, applied_cik_padded, policy_version, rolled_back_at')
    .eq('run_id', targetRunId)
    .order('canonical_company_id')
    .limit(500)
  if (!result.error) return { schemaReady: true, rows: result.data ?? [] }
  if (/does not exist|schema cache/i.test(result.error.message ?? '')) {
    return { schemaReady: false, rows: [] }
  }
  throw new Error(`canonical_cik_reconciliation_ledger: ${result.error.message}`)
}

async function applyPlan(candidates) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await db.rpc('reconcile_canonical_company_ciks', {
      p_run_id: runId,
      p_candidates: candidates.map((candidate) => ({
        canonical_company_id: candidate.canonicalCompanyId,
        sec_cik_padded: candidate.secCikPadded,
      })),
      p_policy_version: POLICY_VERSION,
    })
    if (!error) return { result: data?.[0] ?? null, attempts: attempt }
    lastError = error
    if (!/fetch failed|network|timeout|temporar|connection/i.test(error.message ?? '') || attempt === 3) break
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
  }
  throw new Error(`reconcile_canonical_company_ciks: ${lastError?.message ?? 'unknown failure'}`)
}

const queriedAt = new Date().toISOString()
const before = await readState()
if (before.duplicateCanonicalCikRows !== 0) throw new Error('pre-existing duplicate canonical CIK rows')

const ledgerBefore = await readLedgerRows(runId)
const selection = selectCanonicalCikApplyPayload(
  before.plan.candidates,
  apply ? ledgerBefore.rows : [],
  POLICY_VERSION,
)
if (expectedSafe !== null) {
  const observed = selection.idempotentReplay
    ? selection.candidates.length
    : before.plan.summary.safeCandidates
  if (observed !== expectedSafe) {
    throw new Error(`safe candidate drift: expected ${expectedSafe}, found ${observed}`)
  }
}

let rpc = null
if (apply) rpc = await applyPlan(selection.candidates)

const after = apply ? await readState() : before
const ledger = await readLedgerRows(runId)
const protectedCountsUnchanged = JSON.stringify(before.protectedCounts) === JSON.stringify(after.protectedCounts)
const appliedDelta = after.canonicalCikRows - before.canonicalCikRows
const expectedApplied = apply && !selection.idempotentReplay ? selection.candidates.length : 0
const reconciled = before.plan.summary.linkedWithAnyCik === 100
  && before.plan.summary.safeCandidates + before.plan.summary.alreadyAligned
    + before.plan.summary.conflictingLinkedCiks + before.plan.summary.canonicalCikConflict
    + before.plan.summary.globalHeldRows === 100
  && after.duplicateCanonicalCikRows === 0
  && appliedDelta === expectedApplied
  && protectedCountsUnchanged
  && (!apply || (
    ledger.schemaReady
    && ledger.rows.length === selection.candidates.length
    && after.plan.summary.safeCandidates === 0
    && after.plan.summary.alreadyAligned === before.plan.summary.alreadyAligned + expectedApplied
  ))

const evidence = {
  schemaVersion: 'xs01-canonical-cik-reconciliation/v1',
  environment,
  queriedAt,
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    worktreeDirty: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim().length > 0,
  },
  mode: apply ? 'apply' : 'dry-run',
  runId,
  policyVersion: POLICY_VERSION,
  idempotentReplay: selection.idempotentReplay,
  mutation: apply ? 'bounded-canonical-cik-update' : 'none',
  before: {
    summary: before.plan.summary,
    canonicalCikRows: before.canonicalCikRows,
    duplicateCanonicalCikRows: before.duplicateCanonicalCikRows,
    protectedCounts: before.protectedCounts,
  },
  write: {
    attempted: apply ? selection.candidates.length : 0,
    rpc,
    appliedDelta,
    ledgerRows: ledger.rows.length,
    schemaReady: ledger.schemaReady,
  },
  after: {
    summary: after.plan.summary,
    canonicalCikRows: after.canonicalCikRows,
    duplicateCanonicalCikRows: after.duplicateCanonicalCikRows,
    protectedCounts: after.protectedCounts,
  },
  protectedCountsUnchanged,
  reconciled,
  disposition: reconciled
    ? apply ? 'WRITE_RECONCILED' : 'DRY_RUN_RECONCILED'
    : 'BLOCKED_RECONCILIATION_FAILURE',
}

const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)
if (!reconciled) process.exitCode = 1