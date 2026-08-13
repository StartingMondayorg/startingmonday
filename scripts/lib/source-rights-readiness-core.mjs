export const REQUIRED_USE_DECISIONS = [
  'collection',
  'internalAnalysis',
  'customerDisplay',
  'modelTraining',
  'aggregateStatistics',
  'exportPublication',
]

export const DECISION_VALUES = new Set(['allowed', 'blocked', 'conditional'])

function daysBetween(earlier, later) {
  const start = new Date(`${earlier}T00:00:00Z`).getTime()
  const end = new Date(`${later}T00:00:00Z`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.floor((end - start) / 86400000)
}

export function evaluateSourceRightsEntry(source, { asOfDate, reviewCadenceDays }) {
  if (!source) {
    return {
      catalogStatus: 'missing',
      readiness: 'BLOCKED_MISSING_CATALOG_ENTRY',
      missingFields: ['catalogEntry'],
      staleReview: true,
    }
  }

  const rights = source.rightsDecision ?? {}
  const missingFields = []
  for (const use of REQUIRED_USE_DECISIONS) {
    if (!DECISION_VALUES.has(rights.uses?.[use])) missingFields.push(`uses.${use}`)
  }
  for (const field of [
    'termsUrl',
    'termsVersion',
    'evidenceReviewedAt',
    'owner',
    'nextReviewAt',
    'retentionDeletion',
    'attribution',
    'commercialTier',
  ]) {
    if (!rights[field]) missingFields.push(field)
  }

  const reviewedAt = rights.evidenceReviewedAt ?? source.lastReviewedAt
  const ageDays = reviewedAt ? daysBetween(reviewedAt, asOfDate) : null
  const staleReview = ageDays === null || ageDays >= reviewCadenceDays
  const readiness = missingFields.length > 0
    ? 'BLOCKED_INCOMPLETE_RIGHTS_EVIDENCE'
    : staleReview
      ? 'BLOCKED_STALE_RIGHTS_EVIDENCE'
      : 'READY_FOR_ACCOUNTABLE_REVIEW'

  return {
    catalogStatus: source.status,
    implemented: source.implemented,
    rightsStatus: source.rightsStatus,
    reviewedAt,
    reviewAgeDays: ageDays,
    staleReview,
    missingFields,
    readiness,
  }
}

export function compareHostedRegistry(catalogSources, hostedRows) {
  const catalogByKey = new Map(catalogSources.map((source) => [source.key, source]))
  const hostedByKey = new Map(hostedRows.map((source) => [source.source_key, source]))
  const catalogMissingHosted = [...catalogByKey.keys()].filter((key) => !hostedByKey.has(key)).sort()
  const hostedMissingCatalog = [...hostedByKey.keys()].filter((key) => !catalogByKey.has(key)).sort()
  const statusMismatches = []

  for (const [key, catalog] of catalogByKey) {
    const hosted = hostedByKey.get(key)
    if (!hosted) continue
    if (catalog.status !== hosted.source_status || catalog.rightsStatus !== hosted.rights_status) {
      statusMismatches.push({
        key,
        catalogStatus: catalog.status,
        hostedStatus: hosted.source_status,
        catalogRights: catalog.rightsStatus,
        hostedRights: hosted.rights_status,
      })
    }
  }

  return {
    catalogRows: catalogSources.length,
    hostedRows: hostedRows.length,
    catalogMissingHosted,
    hostedMissingCatalog,
    statusMismatches,
    parity: catalogMissingHosted.length === 0
      && hostedMissingCatalog.length === 0
      && statusMismatches.length === 0,
  }
}