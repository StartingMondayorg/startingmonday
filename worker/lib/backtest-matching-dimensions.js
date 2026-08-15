export const MATCHING_DIMENSION_VERSION = 'v1'
export const MATCHING_POLICY_VERSION = 'sector-size-v2'

const BROAD_SECTOR_RULES = [
  ['healthcare', /\b(health|healthcare|medical|medicine|pharma|pharmaceutical|biotech|life science|hospital|clinical|care delivery)\b/],
  ['financial-services', /\b(bank|banking|finance|financial|fintech|insurance|wealth|asset management|payments?|lending|capital markets?|investment)\b/],
  ['media-telecom', /\b(media|entertainment|telecom|telecommunications|communications|broadcast|publishing)\b/],
  ['public-sector', /\b(education|edtech|university|government|public sector|nonprofit|not for profit)\b/],
  ['professional-services', /\b(consulting|professional services|staffing|recruiting|legal services|business advisory)\b/],
  ['retail-consumer', /\b(retail|consumer|cpg|food|beverage|hospitality|travel|apparel|e commerce|commerce|baby|home decor)\b/],
  ['industrial-energy', /\b(manufacturing|industrial|energy|oil|gas|construction|warehouse|aerospace|automotive|machinery|utilities|logistics|infrastructure)\b/],
  ['technology', /\b(technology|software|saas|cloud|artificial intelligence|agentic ai|cyber|data|hardware|semiconductor|developer tools|automation|iot|platform|network|electronics)\b/],
]

function normalizedText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeBroadSector(value) {
  const normalized = normalizedText(value)
  if (!normalized) return null
  for (const [slug, pattern] of BROAD_SECTOR_RULES) {
    if (pattern.test(normalized)) return slug
  }
  return null
}

export function normalizeSizeBand(value) {
  const normalized = normalizedText(value)
  if (!normalized) return null
  if (['startup', 'start up', 'small'].includes(normalized)) return 'startup'
  if (['midmarket', 'mid market', 'middle market'].includes(normalized)) return 'midmarket'
  if (['enterprise', 'large enterprise', 'large'].includes(normalized)) return 'enterprise'
  return null
}

function consensus(values) {
  const known = new Set(values.filter(Boolean))
  return known.size === 1 ? [...known][0] : null
}

export function resolveMatchingDimensions(canonicalCompany, linkedCompanies = []) {
  return {
    broad_sector_slug: consensus([
      normalizeBroadSector(canonicalCompany?.sector),
      ...linkedCompanies.map((company) => normalizeBroadSector(company.sector)),
    ]),
    size_band: consensus(linkedCompanies.map((company) => normalizeSizeBand(company.company_size))),
    matching_dimension_version: MATCHING_DIMENSION_VERSION,
  }
}

export function buildCanonicalDimensionUpdates(canonicalCompanies, linkedCompanies) {
  const linkedByCanonicalId = new Map()
  for (const company of linkedCompanies) {
    if (!company.canonical_company_id) continue
    if (!linkedByCanonicalId.has(company.canonical_company_id)) {
      linkedByCanonicalId.set(company.canonical_company_id, [])
    }
    linkedByCanonicalId.get(company.canonical_company_id).push(company)
  }

  return canonicalCompanies.map((canonicalCompany) => ({
    id: canonicalCompany.id,
    ...resolveMatchingDimensions(
      canonicalCompany,
      linkedByCanonicalId.get(canonicalCompany.id) ?? [],
    ),
  }))
}

export function controlMatchTier(cohort, candidate) {
  if (!cohort?.broad_sector_slug || cohort.broad_sector_slug !== candidate?.broad_sector_slug) {
    return null
  }
  if (cohort.size_band && candidate.size_band) {
    return cohort.size_band === candidate.size_band ? 'broad_sector_size' : null
  }
  return 'broad_sector_size_unknown'
}

export function selectControlCandidates(cohort, candidates, nearbyOpeningIds, desired = 3) {
  const tierPriority = { broad_sector_size: 0, broad_sector_size_unknown: 1 }
  return [...candidates]
    .filter((candidate) => candidate.id !== cohort.canonical_company_id)
    .filter((candidate) => !nearbyOpeningIds.has(candidate.id))
    .map((candidate) => ({
      ...candidate,
      match_tier: controlMatchTier(cohort, candidate),
    }))
    .filter((candidate) => candidate.match_tier)
    .sort((left, right) => (
      tierPriority[left.match_tier] - tierPriority[right.match_tier]
      || String(left.id).localeCompare(String(right.id))
    ))
    .slice(0, desired)
}

export function assertReplayBuildSupport(buildRun, cohortTarget) {
  if (!buildRun) throw new Error('cohort_build_run_missing')
  if (buildRun.included_cohort_count !== cohortTarget) {
    throw new Error(`cohort_support_below_target:${buildRun.included_cohort_count}/${cohortTarget}`)
  }
}

export function assertExactControlCount(cohortId, actual, expected) {
  if (actual !== expected) {
    throw new Error(`incomplete_controls:${cohortId}:${actual}/${expected}`)
  }
}

export function assertVersionPrefix(prefix) {
  if (!prefix || prefix === 'v1') {
    throw new Error('BACKTEST_COHORT_VERSION must be a non-v1 prefix')
  }
}