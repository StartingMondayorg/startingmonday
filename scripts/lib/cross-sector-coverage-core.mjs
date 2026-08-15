export const CROSS_SECTOR_TAXONOMY_VERSION = 'cross-sector-taxonomy-proposal-v1'

export const SECTOR_BUCKETS = [
  'technology',
  'pharmaceuticals_life_sciences',
  'publishing_media',
  'nonprofit_ngo',
  'other_named',
  'unspecified',
]

const SECTOR_PATTERNS = [
  ['nonprofit_ngo', /\b(non[ -]?profit|ngo|charit|foundation|philanthrop|social impact|association)\b/i],
  ['pharmaceuticals_life_sciences', /\b(pharmac\w*|biotech|biotechnology|life science|therapeutic|drug discovery)\b/i],
  ['publishing_media', /\b(publish|publisher|media|newspaper|magazine|journalism|information services|content)\b/i],
  ['technology', /\b(technology|software|saas|cloud|cyber|artificial intelligence|\bai\b|data|semiconductor|fintech|healthtech|edtech)\b/i],
]

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

export function classifySector(value) {
  if (!hasValue(value)) return 'unspecified'
  const normalized = String(value).trim()
  for (const [bucket, pattern] of SECTOR_PATTERNS) {
    if (pattern.test(normalized)) return bucket
  }
  return 'other_named'
}

export function summarizeSectorRows(rows, getSector = (row) => row.sector) {
  const counts = Object.fromEntries(SECTOR_BUCKETS.map((bucket) => [bucket, 0]))
  for (const row of rows) counts[classifySector(getSector(row))] += 1
  return counts
}

export function summarizeUserDemand(activeUserIds, profiles) {
  const active = new Set(activeUserIds)
  const usersBySector = new Map(SECTOR_BUCKETS.map((bucket) => [bucket, new Set()]))
  let usersWithTargets = 0
  let multiTargetSectorUsers = 0
  let crossSectorUsers = 0

  for (const profile of profiles) {
    if (!active.has(profile.user_id)) continue
    const rawSectors = new Set(
      (profile.target_sectors ?? [])
        .filter(hasValue)
        .map((sector) => String(sector).trim().toLowerCase()),
    )
    const sectors = new Set([...rawSectors].map(classifySector))
    sectors.delete('unspecified')
    if (sectors.size > 0) usersWithTargets += 1
    if (rawSectors.size > 1) multiTargetSectorUsers += 1
    if (sectors.size > 1) crossSectorUsers += 1
    for (const sector of sectors) usersBySector.get(sector).add(profile.user_id)
  }

  return {
    activeUsers: active.size,
    usersWithTargetSectors: usersWithTargets,
    multiTargetSectorUsers,
    crossSectorUsers,
    usersBySector: Object.fromEntries(
      SECTOR_BUCKETS.map((bucket) => [bucket, usersBySector.get(bucket).size]),
    ),
  }
}

export function summarizeFieldCoverage(rows, fields) {
  const denominator = rows.length
  return Object.fromEntries(Object.entries(fields).map(([name, getValue]) => {
    const populated = rows.filter((row) => hasValue(getValue(row))).length
    return [name, {
      denominator,
      populated,
      missing: denominator - populated,
      coveragePercent: denominator === 0 ? null : Number((100 * populated / denominator).toFixed(1)),
    }]
  }))
}

export function summarizeDistinctSources(rows, getSources = (row) => row.data_sources) {
  const counts = new Map()
  let rowsWithSource = 0
  for (const row of rows) {
    const sources = [...new Set((getSources(row) ?? []).filter(hasValue).map((source) => String(source).trim()))]
    if (sources.length > 0) rowsWithSource += 1
    for (const source of sources) counts.set(source, (counts.get(source) ?? 0) + 1)
  }
  return {
    denominator: rows.length,
    rowsWithSource,
    rowsWithoutSource: rows.length - rowsWithSource,
    bySource: Object.fromEntries([...counts.entries()].sort((left, right) => (
      right[1] - left[1] || left[0].localeCompare(right[0])
    ))),
  }
}

export function privacyThresholdCounts(counts, minimum = 3) {
  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, (
    count > 0 && count < minimum
      ? { count: null, suppressed: true, minimum }
      : { count, suppressed: false, minimum }
  )]))
}

function normalizeCik(value) {
  if (!hasValue(value)) return null
  const digits = String(value).replace(/\D/g, '').replace(/^0+/, '')
  return digits || null
}

export function buildCanonicalCikReconciliationPlan(companies, canonicalCompanies) {
  const canonicalById = new Map(canonicalCompanies.map((row) => [row.id, row]))
  const linkedCiks = new Map()
  for (const company of companies) {
    if (!company.canonical_company_id || !canonicalById.has(company.canonical_company_id)) continue
    if (!linkedCiks.has(company.canonical_company_id)) linkedCiks.set(company.canonical_company_id, new Set())
    const cik = normalizeCik(company.sec_cik)
    if (cik) linkedCiks.get(company.canonical_company_id).add(cik)
  }

  const existingOwners = new Map()
  for (const company of canonicalCompanies) {
    const cik = normalizeCik(company.sec_cik_padded)
    if (!cik) continue
    if (!existingOwners.has(cik)) existingOwners.set(cik, [])
    existingOwners.get(cik).push(company.id)
  }

  const initialCandidates = []
  const summary = {
    canonicalCompanies: canonicalCompanies.length,
    linkedCanonicalCompanies: linkedCiks.size,
    linkedWithAnyCik: 0,
    conflictingLinkedCiks: 0,
    missingCanonicalCikWithUnambiguousCandidate: 0,
    alreadyAligned: 0,
    canonicalCikConflict: 0,
    candidateCikCollisionRows: 0,
    candidateCikAlreadyOwnedRows: 0,
    globalCollisionOverlapRows: 0,
    globalHeldRows: 0,
    safeCandidates: 0,
    existingDuplicateCikGroups: [...existingOwners.values()].filter((ids) => ids.length > 1).length,
  }
  for (const [id, ciks] of linkedCiks) {
    if (ciks.size === 0) continue
    summary.linkedWithAnyCik += 1
    if (ciks.size > 1) {
      summary.conflictingLinkedCiks += 1
      continue
    }
    const [linkedCik] = ciks
    const canonicalCik = normalizeCik(canonicalById.get(id).sec_cik_padded)
    if (!canonicalCik) {
      summary.missingCanonicalCikWithUnambiguousCandidate += 1
      initialCandidates.push({ canonicalCompanyId: id, cik: linkedCik })
    }
    else if (canonicalCik === linkedCik) summary.alreadyAligned += 1
    else summary.canonicalCikConflict += 1
  }

  const candidateOwners = new Map()
  for (const candidate of initialCandidates) {
    if (!candidateOwners.has(candidate.cik)) candidateOwners.set(candidate.cik, [])
    candidateOwners.get(candidate.cik).push(candidate.canonicalCompanyId)
  }
  const duplicateCandidateIds = new Set(
    [...candidateOwners.values()].filter((ids) => ids.length > 1).flat(),
  )
  const alreadyOwnedIds = new Set(initialCandidates
    .filter((candidate) => (
      (existingOwners.get(candidate.cik) ?? []).some((id) => id !== candidate.canonicalCompanyId)
    ))
    .map((candidate) => candidate.canonicalCompanyId))
  const unsafeIds = new Set([...duplicateCandidateIds, ...alreadyOwnedIds])

  summary.candidateCikCollisionRows = duplicateCandidateIds.size
  summary.candidateCikAlreadyOwnedRows = alreadyOwnedIds.size
  summary.globalCollisionOverlapRows = [...duplicateCandidateIds]
    .filter((id) => alreadyOwnedIds.has(id)).length
  summary.globalHeldRows = unsafeIds.size

  const candidates = initialCandidates
    .filter((candidate) => !unsafeIds.has(candidate.canonicalCompanyId))
    .map((candidate) => ({
      canonicalCompanyId: candidate.canonicalCompanyId,
      secCikPadded: candidate.cik.padStart(10, '0'),
    }))
    .sort((left, right) => left.canonicalCompanyId.localeCompare(right.canonicalCompanyId))
  summary.safeCandidates = candidates.length

  return { candidates, summary }
}

export function summarizeCanonicalCikCandidates(companies, canonicalCompanies) {
  return buildCanonicalCikReconciliationPlan(companies, canonicalCompanies).summary
}

export function selectCanonicalCikApplyPayload(planCandidates, ledgerRows, policyVersion) {
  if (ledgerRows.length === 0) {
    return { candidates: planCandidates, idempotentReplay: false }
  }
  const invalidRows = ledgerRows.filter((row) => (
    row.policy_version !== policyVersion
    || row.rolled_back_at !== null
    || !row.canonical_company_id
    || !/^\d{10}$/.test(row.applied_cik_padded ?? '')
  ))
  if (invalidRows.length > 0) throw new Error('existing run ledger is not replayable')

  return {
    candidates: ledgerRows.map((row) => ({
      canonicalCompanyId: row.canonical_company_id,
      secCikPadded: row.applied_cik_padded,
    })),
    idempotentReplay: true,
  }
}