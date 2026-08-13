import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  CROSS_SECTOR_TAXONOMY_VERSION,
  SECTOR_BUCKETS,
  classifySector,
  privacyThresholdCounts,
  summarizeDistinctSources,
  summarizeCanonicalCikCandidates,
  summarizeFieldCoverage,
  summarizeSectorRows,
  summarizeUserDemand,
} from './lib/cross-sector-coverage-core.mjs'

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

function sha256(fileUrl) {
  return createHash('sha256').update(fs.readFileSync(fileUrl)).digest('hex')
}

async function fetchAll(table, columns, configure = (query) => query) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await configure(db.from(table).select(columns))
      .range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const page = data ?? []
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

const [
  activeUsers,
  profiles,
  companies,
  watchEvents,
  canonicalCompanies,
  searchLagRows,
  positions,
] = await Promise.all([
  fetchAll('users', 'id', (query) => query.in('subscription_status', ['active', 'trialing'])),
  fetchAll('user_profiles', 'user_id, target_sectors'),
  fetchAll('companies', 'id, user_id, sector, sec_cik, is_public_company, canonical_company_id, archived_at'),
  fetchAll('company_watch_events', 'user_id, sector, created_at'),
  fetchAll('canonical_companies', 'id, sector, sec_cik_padded, is_public_company'),
  fetchAll(
    'exec_search_lag',
    'departure_id, company_sector, company_sic_code, company_stage, company_revenue_band, title_normalized, matching_policy_version',
    (query) => query.eq('matching_policy_version', 'cik-role-earliest-v1'),
  ),
  fetchAll(
    'executive_positions',
    'id, company_sector, company_sic_code, company_stage, company_revenue_band, company_headcount_band, company_market_cap_band, company_growth_phase, title_normalized, start_date, end_date, is_current, data_sources',
  ),
])

const activeUserIds = new Set(activeUsers.map((row) => row.id))
const activeCompanies = companies.filter((row) => !row.archived_at && activeUserIds.has(row.user_id))
const activeWatchEvents = watchEvents.filter((row) => activeUserIds.has(row.user_id))
const demand = summarizeUserDemand([...activeUserIds], profiles)
const positionById = new Map(positions.map((row) => [row.id, row]))
const lagRows = searchLagRows.map((row) => ({ ...row, departure: positionById.get(row.departure_id) ?? null }))

function scaleValue(row) {
  return row.company_revenue_band || row.departure?.company_revenue_band
    || row.departure?.company_headcount_band || row.departure?.company_market_cap_band
}

function sectorCoverage(rows, getSector, fields) {
  return Object.fromEntries(SECTOR_BUCKETS.map((bucket) => {
    const cohort = rows.filter((row) => classifySector(getSector(row)) === bucket)
    return [bucket, {
      rows: cohort.length,
      fields: summarizeFieldCoverage(cohort, fields),
    }]
  }))
}

const lagFields = {
  industrySic: (row) => row.company_sic_code || row.departure?.company_sic_code,
  organizationType: () => null,
  ownership: () => null,
  scale: scaleValue,
  historicalLifecycle: (row) => row.departure?.company_growth_phase,
  legacyMixedCompanyStage: (row) => row.company_stage || row.departure?.company_stage,
  sourceProvenance: (row) => row.departure?.data_sources?.length ? 'present' : null,
}
const canonicalFields = {
  namedSector: (row) => row.sector,
  secIdentity: (row) => row.sec_cik_padded,
  publicStatusProxy: (row) => row.is_public_company,
  industrySicOrNaics: () => null,
  organizationType: () => null,
  ownership: () => null,
  scale: () => null,
  historicalLifecycle: () => null,
}
const watchedFields = {
  namedSector: (row) => row.sector,
  secIdentity: (row) => row.sec_cik,
  publicStatusProxy: (row) => row.is_public_company,
  canonicalIdentity: (row) => row.canonical_company_id,
}

const pilotVerticals = Object.fromEntries([
  ['pharmaceuticals_life_sciences', 'pharmaceuticals_life_sciences'],
  ['publishing_media', 'publishing_media'],
  ['nonprofit_ngo', 'nonprofit_ngo'],
].map(([name, bucket]) => {
  const canonical = canonicalCompanies.filter((row) => classifySector(row.sector) === bucket)
  const watched = activeCompanies.filter((row) => classifySector(row.sector) === bucket)
  const historicalPositions = positions.filter((row) => classifySector(row.company_sector) === bucket)
  const matchedLags = lagRows.filter((row) => classifySector(row.company_sector || row.departure?.company_sector) === bucket)
  return [name, {
    canonicalCompanies: canonical.length,
    activeWatchedCompanies: watched.length,
    executivePositions: historicalPositions.length,
    datedDepartures: historicalPositions.filter((row) => row.end_date).length,
    datedAppointments: historicalPositions.filter((row) => row.start_date).length,
    matchedSearchLags: matchedLags.length,
    positionSourceCoverage: summarizeDistinctSources(historicalPositions),
    reconstructionDisposition: matchedLags.length >= 10
      ? 'PROCEED_EXISTING_DATA_SUPPORTED'
      : historicalPositions.length > 0
        ? 'CONTINUE_COLLECTION_MATCHED_HISTORY_BELOW_10'
        : 'DEFER_SOURCE_GAP',
  }]
}))

const rawUserDemandCounts = {
  usersWithTargetSectors: demand.usersWithTargetSectors,
  multiTargetSectorUsers: demand.multiTargetSectorUsers,
  crossSectorUsers: demand.crossSectorUsers,
  ...Object.fromEntries(Object.entries(demand.usersBySector).map(([key, value]) => [`sector:${key}`, value])),
}

const evidence = {
  schemaVersion: 'cross-sector-coverage-baseline/v1',
  taxonomyProposalVersion: CROSS_SECTOR_TAXONOMY_VERSION,
  environment,
  queriedAt: new Date().toISOString(),
  repository: {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    worktreeDirty: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim().length > 0,
    auditLogic: {
      scriptSha256: sha256(new URL(import.meta.url)),
      coreSha256: sha256(new URL('./lib/cross-sector-coverage-core.mjs', import.meta.url)),
    },
  },
  governance: {
    stories: ['WS0-06', 'WS1-04', 'WS3-06'],
    supportingEvidence: ['WS1-05', 'WS1-13'],
    mutation: 'none',
    providerSpendUsd: 0,
    customerExposure: 'none',
  },
  demand: {
    activeUsers: demand.activeUsers,
    privacyMinimum: 3,
    userCounts: privacyThresholdCounts(rawUserDemandCounts),
    activeWatchedCompanies: {
      denominator: activeCompanies.length,
      bySector: summarizeSectorRows(activeCompanies),
      fieldCoverage: summarizeFieldCoverage(activeCompanies, watchedFields),
    },
    requestedCompanyProxy: {
      definition: 'company_watch_events emitted when a user adds a company; no separate pre-watch request object exists',
      denominator: activeWatchEvents.length,
      bySector: summarizeSectorRows(activeWatchEvents),
    },
  },
  coverage: {
    canonicalCompanyUniverse: {
      denominator: canonicalCompanies.length,
      bySector: summarizeSectorRows(canonicalCompanies),
      fields: summarizeFieldCoverage(canonicalCompanies, canonicalFields),
      linkedCompanyCikCandidates: {
        allCompanies: summarizeCanonicalCikCandidates(companies, canonicalCompanies),
        activeCompanies: summarizeCanonicalCikCandidates(activeCompanies, canonicalCompanies),
      },
      bySectorFields: sectorCoverage(canonicalCompanies, (row) => row.sector, canonicalFields),
    },
    verifiedSearchLagPairs: {
      denominator: lagRows.length,
      unmatchedDepartureRows: lagRows.filter((row) => !row.departure).length,
      bySector: summarizeSectorRows(lagRows, (row) => row.company_sector || row.departure?.company_sector),
      fields: summarizeFieldCoverage(lagRows, lagFields),
      bySectorFields: sectorCoverage(
        lagRows,
        (row) => row.company_sector || row.departure?.company_sector,
        lagFields,
      ),
      sources: summarizeDistinctSources(lagRows, (row) => row.departure?.data_sources),
    },
  },
  pilotVerticals,
  limitations: [
    'Free-text sectors are conservatively bucketed and are not taxonomy-grade classifications.',
    'No dedicated organization-type or ownership fields exist in the audited company or search-lag schemas.',
    'The legacy company_stage field mixes organization type, ownership, and scale and is not promoted as a canonical dimension.',
    'Current canonical-company state is not copied into historical executive-position or search-lag rows.',
    'Company add/watch events are a demand proxy, not a distinct requested-company workflow.',
    'Sparse user-demand cells below three are suppressed in repository evidence.',
  ],
}

const sumCounts = (counts) => Object.values(counts).reduce((sum, value) => sum + value, 0)
const cik = evidence.coverage.canonicalCompanyUniverse.linkedCompanyCikCandidates.allCompanies
const checks = {
  activeWatchedSectorDenominator: sumCounts(evidence.demand.activeWatchedCompanies.bySector)
    === evidence.demand.activeWatchedCompanies.denominator,
  requestedProxySectorDenominator: sumCounts(evidence.demand.requestedCompanyProxy.bySector)
    === evidence.demand.requestedCompanyProxy.denominator,
  canonicalSectorDenominator: sumCounts(evidence.coverage.canonicalCompanyUniverse.bySector)
    === evidence.coverage.canonicalCompanyUniverse.denominator,
  searchLagSectorDenominator: sumCounts(evidence.coverage.verifiedSearchLagPairs.bySector)
    === evidence.coverage.verifiedSearchLagPairs.denominator,
  canonicalCikCandidateEquation: cik.linkedWithAnyCik
    === cik.missingCanonicalCikWithUnambiguousCandidate
      + cik.alreadyAligned
      + cik.conflictingLinkedCiks
      + cik.canonicalCikConflict,
  canonicalCikGlobalSafetyEquation: cik.missingCanonicalCikWithUnambiguousCandidate
    === cik.safeCandidates + cik.globalHeldRows,
  canonicalCikFinalDispositionEquation: cik.linkedWithAnyCik
    === cik.safeCandidates
      + cik.alreadyAligned
      + cik.conflictingLinkedCiks
      + cik.canonicalCikConflict
      + cik.globalHeldRows,
  canonicalCikExistingUniqueness: cik.existingDuplicateCikGroups === 0,
  expectedSearchLagPairs: evidence.coverage.verifiedSearchLagPairs.denominator === 267,
  searchLagDepartureJoins: evidence.coverage.verifiedSearchLagPairs.unmatchedDepartureRows === 0,
  readOnly: evidence.governance.mutation === 'none',
}
const reconciled = Object.values(checks).every(Boolean)
evidence.acceptance = {
  expectedSearchLagPairs: 267,
  checks,
  reconciled,
  disposition: reconciled ? 'BASELINE_RECONCILED' : 'BLOCKED_DENOMINATOR_MISMATCH',
}

const serialized = `${JSON.stringify(evidence, null, 2)}\n`
if (outputPath) {
  const resolved = path.resolve(outputPath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, serialized, 'utf8')
}
process.stdout.write(serialized)
if (!reconciled) process.exitCode = 1