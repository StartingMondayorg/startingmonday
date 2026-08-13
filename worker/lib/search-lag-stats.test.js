import { describe, expect, it } from 'vitest'
import {
  buildSearchLagStats,
  enrichSearchLagRows,
  SEARCH_LAG_SOURCE_POLICY,
  SEARCH_LAG_STATS_VERSION,
} from './search-lag-stats.js'

function row(overrides = {}) {
  return {
    company_name: 'Acme',
    company_cik: '0000123456',
    company_sector: 'Technology',
    company_sic_code: '7372',
    company_stage: 'public_mid',
    title_normalized: 'CIO',
    lag_days: 90,
    search_year: 2024,
    matching_policy_version: SEARCH_LAG_SOURCE_POLICY,
    ...overrides,
  }
}

describe('buildSearchLagStats', () => {
  it('enriches blank company names from canonical CIK identity', () => {
    const enriched = enrichSearchLagRows(
      [row({ company_name: '', company_cik: '123456' })],
      [{ name: 'Canonical Acme', sec_cik_padded: '0000123456', sector: 'Technology' }],
    )

    expect(enriched[0]).toEqual(expect.objectContaining({
      company_name: 'Canonical Acme',
      company_sector: 'Technology',
    }))
  })

  it('publishes supported company and industry cohorts with deterministic medians', () => {
    const rows = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300]
      .map((lag_days) => row({ lag_days }))
    const result = buildSearchLagStats(rows)

    expect(result.companyRows).toEqual([
      expect.objectContaining({
        company_cik: '123456',
        median_search_lag_days: 150,
        avg_search_lag_days: 165,
        sample_size: 10,
        stats_version: SEARCH_LAG_STATS_VERSION,
      }),
    ])
    expect(result.industryRows).toEqual([
      expect.objectContaining({ median_search_lag_days: 150, sample_size: 10 }),
    ])
    expect(result.roleRows).toHaveLength(0)
    expect(result.summary.globalMedianSearchLagDays).toBe(150)
  })

  it('suppresses company and industry cohorts below their support floors', () => {
    const result = buildSearchLagStats([row({ lag_days: 30 }), row({ lag_days: 60 })])

    expect(result.companyRows).toHaveLength(0)
    expect(result.industryRows).toHaveLength(0)
    expect(result.roleRows).toHaveLength(0)
    expect(result.summary.eligibleRows).toBe(2)
  })

  it('publishes role context at the independent support floor', () => {
    const rows = Array.from({ length: 20 }, (_, index) => row({ lag_days: index + 1 }))
    const result = buildSearchLagStats(rows)

    expect(result.roleRows).toEqual([
      expect.objectContaining({
        title_normalized: 'CIO',
        median_search_lag_days: 10,
        sample_size: 20,
      }),
    ])
  })

  it('excludes rows outside the verified source policy or with invalid lag', () => {
    const result = buildSearchLagStats([
      row({ matching_policy_version: 'other-policy' }),
      row({ lag_days: 0 }),
      row({ lag_days: null }),
    ])

    expect(result.summary.eligibleRows).toBe(0)
    expect(result.summary.globalMedianSearchLagDays).toBeNull()
  })

  it('requires complete SIC, stage, and role identity for industry context', () => {
    const rows = Array.from({ length: 10 }, (_, index) => row({
      lag_days: index + 1,
      company_stage: index === 0 ? null : 'public_mid',
    }))
    const result = buildSearchLagStats(rows)

    expect(result.companyRows).toHaveLength(1)
    expect(result.industryRows).toHaveLength(0)
  })
})