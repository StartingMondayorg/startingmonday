export const SEARCH_LAG_STATS_VERSION = 'search-lag-stats-v1'
export const SEARCH_LAG_SOURCE_POLICY = 'cik-role-earliest-v1'
export const COMPANY_SEARCH_LAG_MIN_SUPPORT = 3
export const INDUSTRY_SEARCH_LAG_MIN_SUPPORT = 10
export const ROLE_SEARCH_LAG_MIN_SUPPORT = 20

function percentile(sorted, ratio) {
  if (!sorted.length) return null
  return sorted[Math.floor((sorted.length - 1) * ratio)]
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const average = sorted.reduce((total, value) => total + value, 0) / sorted.length
  return {
    average: Math.round(average),
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    sampleSize: sorted.length,
  }
}

function normalizedCik(value) {
  const cik = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '')
  return cik || null
}

function groupRows(rows, keyFor) {
  const groups = new Map()
  for (const row of rows) {
    if (!Number.isInteger(row?.lag_days) || row.lag_days <= 0) continue
    const key = keyFor(row)
    if (!key) continue
    if (!groups.has(key.id)) groups.set(key.id, { key, rows: [] })
    groups.get(key.id).rows.push(row)
  }
  return groups
}

export function buildSearchLagStats(rows, {
  companyMinSupport = COMPANY_SEARCH_LAG_MIN_SUPPORT,
  industryMinSupport = INDUSTRY_SEARCH_LAG_MIN_SUPPORT,
  roleMinSupport = ROLE_SEARCH_LAG_MIN_SUPPORT,
} = {}) {
  const eligible = (rows ?? []).filter((row) => (
    row?.matching_policy_version === SEARCH_LAG_SOURCE_POLICY
    && Number.isInteger(row?.lag_days)
    && row.lag_days > 0
  ))

  const companyGroups = groupRows(eligible, (row) => {
    const cik = normalizedCik(row.company_cik)
    if (!cik || !row.title_normalized || !row.company_name) return null
    return { id: `${cik}::${row.title_normalized}`, cik, title: row.title_normalized, name: row.company_name }
  })
  const industryGroups = groupRows(eligible, (row) => {
    if (!row.company_sic_code || !row.company_stage || !row.title_normalized) return null
    return {
      id: `${row.company_sic_code}::${row.company_stage}::${row.title_normalized}`,
      sic: row.company_sic_code,
      stage: row.company_stage,
      title: row.title_normalized,
      sector: row.company_sector ?? null,
    }
  })
  const roleGroups = groupRows(eligible, (row) => (
    row.title_normalized ? { id: row.title_normalized, title: row.title_normalized } : null
  ))

  const companyRows = []
  for (const { key, rows: group } of companyGroups.values()) {
    if (group.length < companyMinSupport) continue
    const stats = summarize(group.map((row) => row.lag_days))
    const years = group.map((row) => row.search_year).filter(Number.isInteger)
    companyRows.push({
      company_name: key.name,
      company_cik: key.cik,
      title_normalized: key.title,
      avg_search_lag_days: stats.average,
      median_search_lag_days: stats.median,
      sample_size: stats.sampleSize,
      time_period_start: years.length ? `${Math.min(...years)}-01-01` : null,
      time_period_end: years.length ? `${Math.max(...years)}-12-31` : null,
      stats_version: SEARCH_LAG_STATS_VERSION,
      source_policy: SEARCH_LAG_SOURCE_POLICY,
    })
  }

  const industryRows = []
  for (const { key, rows: group } of industryGroups.values()) {
    if (group.length < industryMinSupport) continue
    const stats = summarize(group.map((row) => row.lag_days))
    const years = group.map((row) => row.search_year).filter(Number.isInteger)
    industryRows.push({
      sic_code: key.sic,
      sector_name: key.sector,
      company_stage: key.stage,
      title_normalized: key.title,
      avg_search_lag_days: stats.average,
      median_search_lag_days: stats.median,
      sample_size: stats.sampleSize,
      time_period_start: years.length ? `${Math.min(...years)}-01-01` : null,
      time_period_end: years.length ? `${Math.max(...years)}-12-31` : null,
      stats_version: SEARCH_LAG_STATS_VERSION,
      source_policy: SEARCH_LAG_SOURCE_POLICY,
    })
  }

  const roleRows = []
  for (const { key, rows: group } of roleGroups.values()) {
    if (group.length < roleMinSupport) continue
    const stats = summarize(group.map((row) => row.lag_days))
    const years = group.map((row) => row.search_year).filter(Number.isInteger)
    roleRows.push({
      title_normalized: key.title,
      avg_search_lag_days: stats.average,
      p25_search_lag_days: stats.p25,
      median_search_lag_days: stats.median,
      p75_search_lag_days: stats.p75,
      sample_size: stats.sampleSize,
      time_period_start: years.length ? `${Math.min(...years)}-01-01` : null,
      time_period_end: years.length ? `${Math.max(...years)}-12-31` : null,
      stats_version: SEARCH_LAG_STATS_VERSION,
      source_policy: SEARCH_LAG_SOURCE_POLICY,
    })
  }

  companyRows.sort((left, right) => left.company_cik.localeCompare(right.company_cik) || left.title_normalized.localeCompare(right.title_normalized))
  industryRows.sort((left, right) => left.sic_code.localeCompare(right.sic_code) || left.company_stage.localeCompare(right.company_stage) || left.title_normalized.localeCompare(right.title_normalized))
  roleRows.sort((left, right) => left.title_normalized.localeCompare(right.title_normalized))
  const global = eligible.length ? summarize(eligible.map((row) => row.lag_days)) : null

  return {
    companyRows,
    industryRows,
    roleRows,
    summary: {
      sourceRows: rows?.length ?? 0,
      eligibleRows: eligible.length,
      companyGroupsObserved: companyGroups.size,
      companyGroupsPublished: companyRows.length,
      companyRowsCovered: companyRows.reduce((total, row) => total + row.sample_size, 0),
      industryGroupsObserved: industryGroups.size,
      industryGroupsPublished: industryRows.length,
      industryRowsCovered: industryRows.reduce((total, row) => total + row.sample_size, 0),
      roleGroupsObserved: roleGroups.size,
      roleGroupsPublished: roleRows.length,
      roleRowsCovered: roleRows.reduce((total, row) => total + row.sample_size, 0),
      globalMedianSearchLagDays: global?.median ?? null,
      globalP25SearchLagDays: global?.p25 ?? null,
      globalP75SearchLagDays: global?.p75 ?? null,
      companyMinSupport,
      industryMinSupport,
      roleMinSupport,
      statsVersion: SEARCH_LAG_STATS_VERSION,
      sourcePolicy: SEARCH_LAG_SOURCE_POLICY,
    },
  }
}

export function enrichSearchLagRows(rows, canonicalCompanies) {
  const canonicalByCik = new Map()
  for (const company of canonicalCompanies ?? []) {
    const cik = normalizedCik(company?.sec_cik_padded)
    if (!cik || !company?.name) continue
    canonicalByCik.set(cik, company)
  }

  return (rows ?? []).map((row) => {
    const company = canonicalByCik.get(normalizedCik(row.company_cik))
    return {
      ...row,
      company_name: row.company_name?.trim() || company?.name || null,
      company_sector: row.company_sector ?? company?.sector ?? null,
    }
  })
}