import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  compareHostedRegistry,
  evaluateSourceRightsEntry,
} from './lib/source-rights-readiness-core.mjs'

const PRIORITY_SOURCES = [
  { sourceId: 'sec_filings_8k_10k_10q', lane: 'current', label: 'SEC EDGAR' },
  { sourceId: 'company_press_releases', lane: 'current', label: 'Company press releases' },
  { sourceId: 'google_news', lane: 'current', label: 'Google News / GNews' },
  { sourceId: 'business_journals', lane: 'current', label: 'Business journals' },
  { sourceId: 'crunchbase_funding', lane: 'current', label: 'Crunchbase' },
  { sourceId: 'predictleads_events', lane: 'current', label: 'PredictLeads' },
  { sourceId: 'pdl_executive_snapshot', lane: 'current', label: 'People Data Labs' },
  { sourceId: 'leadership_changes', lane: 'current', label: 'Apollo / leadership changes' },
  { sourceId: 'census_naics', lane: 'proposed', label: 'Census NAICS' },
  { sourceId: 'propublica_nonprofit_explorer', lane: 'proposed', label: 'ProPublica Nonprofit Explorer' },
  { sourceId: 'wikidata_executive_history', lane: 'proposed', label: 'Wikidata' },
  { sourceId: 'irs_form_990', lane: 'proposed', label: 'IRS Form 990' },
  { sourceId: 'fda', lane: 'proposed', label: 'FDA' },
  { sourceId: 'clinicaltrials_gov', lane: 'proposed', label: 'ClinicalTrials.gov' },
  { sourceId: 'crossref', lane: 'proposed', label: 'Crossref' },
  { sourceId: 'openalex', lane: 'proposed', label: 'OpenAlex' },
]

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

function readHeadFile(file) {
  return execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' })
}

const catalog = JSON.parse(readHeadFile('config/signal-source-catalog.json'))
const catalogByKey = new Map(catalog.sources.map((source) => [source.key, source]))
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: hostedRows, error: hostedError } = await db
  .from('signal_sources')
  .select('source_key, source_status, rights_status, last_reviewed_at')
  .order('source_key')
  .limit(1000)
const hostedRegistryUnavailable = Boolean(
  hostedError && /does not exist|schema cache|could not find the table/i.test(hostedError.message ?? ''),
)
if (hostedError && !hostedRegistryUnavailable) {
  throw new Error(`signal_sources: ${hostedError.message}`)
}
const hostedRegistryRows = hostedRegistryUnavailable ? [] : (hostedRows ?? [])

const queriedAt = new Date().toISOString()
const asOfDate = queriedAt.slice(0, 10)
const sources = PRIORITY_SOURCES.map((priority) => ({
  ...priority,
  ...evaluateSourceRightsEntry(catalogByKey.get(priority.sourceId), {
    asOfDate,
    reviewCadenceDays: catalog.reviewCadenceDays,
  }),
  hosted: hostedRegistryRows.some((row) => row.source_key === priority.sourceId),
}))
const counts = Object.fromEntries([
  'READY_FOR_ACCOUNTABLE_REVIEW',
  'BLOCKED_MISSING_CATALOG_ENTRY',
  'BLOCKED_INCOMPLETE_RIGHTS_EVIDENCE',
  'BLOCKED_STALE_RIGHTS_EVIDENCE',
].map((status) => [status, sources.filter((source) => source.readiness === status).length]))

const sourceRegistry = readHeadFile('worker/lib/source-registry.js')
const proposedSourceRegistry = fs.readFileSync('worker/lib/source-registry.js', 'utf8')
const precursorStats = readHeadFile('worker/jobs/precursor-stats-job.js')
const personSignals = readHeadFile('worker/jobs/person-signal-job.js')
const sourceCatalogRoute = readHeadFile('src/app/api/(ops)/admin/automation/signals/source-catalog/route.ts')

const evidence = {
  schemaVersion: 'ws1-08-source-rights-readiness/v1',
  environment,
  queriedAt,
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    sourceSnapshot: 'HEAD',
    worktreeDirty: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim().length > 0,
  },
  evidencePhase: 'PRE_CONTAINMENT_BASELINE',
  governance: {
    story: 'WS1-08',
    mutation: 'none',
    providerSpendUsd: 0,
    customerExposureChange: 'none',
  },
  catalog: {
    version: catalog.version,
    updatedAt: catalog.updatedAt,
    reviewCadenceDays: catalog.reviewCadenceDays,
    totalRows: catalog.sources.length,
  },
  prioritySources: sources,
  readinessCounts: counts,
  hostedRegistry: {
    available: !hostedRegistryUnavailable,
    errorCode: hostedRegistryUnavailable ? hostedError.code : null,
    ...compareHostedRegistry(catalog.sources, hostedRegistryRows),
  },
  enforcement: {
    baselineHead: {
      sourceSnapshot: 'HEAD',
      registryReadFailureFailsOpen: sourceRegistry.includes('registry_read_failed_fail_open'),
      registryMissFailsOpen: sourceRegistry.includes('registry_miss_fail_open'),
      registryExceptionFailsOpen: sourceRegistry.includes('registry_exception_fail_open'),
    },
    proposedWorktree: {
      sourceSnapshot: 'WORKTREE',
      registryReadFailureFailsClosed: proposedSourceRegistry.includes('registry_read_failed_fail_closed'),
      registryMissFailsClosed: proposedSourceRegistry.includes('registry_miss_fail_closed'),
      registryExceptionFailsClosed: proposedSourceRegistry.includes('registry_exception_fail_closed'),
      explicitApprovalRequired: proposedSourceRegistry.includes("new Set(['allowed', 'approved'])"),
    },
    personSignalJobUsesRegistryDecision: personSignals.includes('resolveSourceDecision'),
    precursorQuarantineDefaultsEmpty: precursorStats.includes("process.env.QUARANTINED_SOURCE_KINDS ?? ''"),
    catalogRouteIsReadOnly: sourceCatalogRoute.includes('export async function GET')
      && !/export async function (POST|PUT|PATCH|DELETE)/.test(sourceCatalogRoute),
    catalogToHostedSyncWriterFound: false,
  },
  contradictions: [
    {
      findingId: 'leadership_changes_identity',
      issue: 'Catalog compliance metadata names Apollo while implemented module mapping points to PDL snapshot/diff code.',
      disposition: 'BLOCKED_IDENTITY_RECONCILIATION',
    },
  ],
  followOnBlockers: [
    {
      findingId: 'precursor_stats_rights_policy',
      issue: 'Precursor aggregation relies on QUARANTINED_SOURCE_KINDS with an empty default and does not evaluate source-registry rights decisions.',
      disposition: 'BLOCKED_REPLAN_REQUIRED',
    },
    {
      findingId: 'hosted_registry_contract',
      issue: 'Hosted registry is unavailable and no catalog-to-hosted synchronization writer exists.',
      disposition: 'BLOCKED_SCHEMA_AND_SYNC_DESIGN',
    },
  ],
  disposition: counts.READY_FOR_ACCOUNTABLE_REVIEW === PRIORITY_SOURCES.length
    && !hostedRegistryUnavailable
    && compareHostedRegistry(catalog.sources, hostedRegistryRows).parity
    ? 'READY_FOR_ACCOUNTABLE_REVIEW'
    : 'EVIDENCE_REQUIRED_FAIL_CLOSED',
}

const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)