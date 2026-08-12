/**
 * Capture redacted intelligence label/backtest gate evidence from a declared environment.
 * Read-only: queries counts, label-source names, and the latest replay summary.
 *
 * Usage:
 *   node --env-file=.env.local scripts/capture-intelligence-production-evidence.mjs \
 *     --environment=production [--output=path/to/evidence.json]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...valueParts] = arg.split('=')
  return [key, valueParts.join('=')]
}))

const environment = args.get('--environment')
const outputPath = args.get('--output')

if (!environment) {
  console.error('Missing required --environment=<name> argument')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing required Supabase environment variables')
  process.exit(1)
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function exactCount(table, configure = (query) => query) {
  const result = await configure(db.from(table).select('id', { count: 'exact', head: true }))
  if (result.error) throw new Error(`${table}: ${result.error.message}`)
  if (result.count === null) throw new Error(`${table}: exact count unavailable`)
  return result.count
}

async function fetchAllLabelSources() {
  const sources = new Set()
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('role_openings')
      .select('label_source')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`role_openings label sources: ${error.message}`)
    const page = data ?? []
    for (const row of page) sources.add(row.label_source)
    if (page.length < PAGE_SIZE) return [...sources].sort()
  }
}

function thresholdGate(current, target) {
  return { current, target, status: current >= target ? 'pass' : 'in_progress' }
}

function availabilityGate(current) {
  return { current, target: 1, status: current > 0 ? 'pass' : 'no_data' }
}

const queriedAt = new Date().toISOString()
const freshSince = new Date(Date.now() - 86_400_000).toISOString()

try {
  const [
    canonicalCompanyCount,
    openingCount,
    labelCount,
    precursorStatCount,
    cohortCount,
    controlCount,
    patternCount,
    labelSources,
    latestReplayResult,
  ] = await Promise.all([
    exactCount('canonical_companies'),
    exactCount('role_openings'),
    exactCount('event_outcome_labels'),
    exactCount('precursor_stats', (query) => query.gte('computed_at', freshSince)),
    exactCount('backtest_cohorts'),
    exactCount('backtest_controls'),
    exactCount('pattern_backtests'),
    fetchAllLabelSources(),
    db
      .from('backtest_replay_runs')
      .select('id, status, cohort_count, control_count, started_at, finished_at, error')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (latestReplayResult.error) {
    throw new Error(`backtest_replay_runs: ${latestReplayResult.error.message}`)
  }

  const latestReplay = latestReplayResult.data ?? null
  const replayCohortCount = latestReplay?.cohort_count ?? 0
  const replayControlCount = latestReplay?.control_count ?? 0
  const matchedControlTarget = replayCohortCount * 3
  const gates = {
    labeledOpenings: thresholdGate(openingCount, 500),
    eventOutcomeLabels: thresholdGate(labelCount, 1000),
    labelSources: thresholdGate(labelSources.length, 4),
    precursorStats: availabilityGate(precursorStatCount),
    backtestCohorts: thresholdGate(cohortCount, 300),
    matchedControls: replayCohortCount === 0
      ? { current: replayControlCount, target: 0, status: 'no_data' }
      : thresholdGate(replayControlCount, matchedControlTarget),
    patternBacktests: {
      current: patternCount,
      target: 1,
      latestReplayStatus: latestReplay?.status ?? null,
      status: patternCount > 0 && latestReplay?.status === 'complete'
        ? 'pass'
        : patternCount === 0
          ? 'no_data'
          : 'in_progress',
    },
  }

  const blockedGates = Object.entries(gates)
    .filter(([, gate]) => gate.status !== 'pass')
    .map(([name]) => name)

  const evidence = {
    schemaVersion: 'intelligence-production-evidence/v1',
    environment,
    queriedAt,
    repository: {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    },
    governance: {
      stories: ['WS0-02', 'WS0-03', 'WS0-04', 'WS0-07', 'WS0-08', 'WS1-03', 'WS1-09', 'WS1-10', 'WS2-07', 'WS2-08', 'WS2-09'],
      controls: ['GOV-02', 'GOV-03', 'EVD-01', 'INT-02', 'INT-03'],
      mutation: 'none',
    },
    counts: {
      canonicalCompanies: canonicalCompanyCount,
      roleOpenings: openingCount,
      eventOutcomeLabels: labelCount,
      precursorStatsFresh24h: precursorStatCount,
      backtestCohortInventory: cohortCount,
      backtestControlInventory: controlCount,
      patternBacktests: patternCount,
    },
    labelSources,
    latestReplay,
    gates,
    disposition: {
      status: blockedGates.length === 0 ? 'pass' : 'blocked',
      blockedGates,
      permitsDownstreamImplementation: false,
      reason: blockedGates.length === 0
        ? 'Measurement evidence captured; AO gate review is still required.'
        : 'One or more production evidence gates are below target; gate review and re-plan are required.',
    },
  }

  const serialized = `${JSON.stringify(evidence, null, 2)}\n`
  if (outputPath) {
    const resolved = path.resolve(outputPath)
    fs.mkdirSync(path.dirname(resolved), { recursive: true })
    fs.writeFileSync(resolved, serialized, 'utf8')
  }
  process.stdout.write(serialized)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}