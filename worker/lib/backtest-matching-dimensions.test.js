import { describe, expect, it } from 'vitest'
import {
  MATCHING_DIMENSION_VERSION,
  MATCHING_POLICY_VERSION,
  assertExactControlCount,
  assertReplayBuildSupport,
  buildCanonicalDimensionUpdates,
  controlMatchTier,
  normalizeBroadSector,
  normalizeSizeBand,
  resolveMatchingDimensions,
  selectControlCandidates,
} from './backtest-matching-dimensions.js'

describe('backtest matching dimensions', () => {
  it('maps raw sectors into the governed broad taxonomy', () => {
    expect(normalizeBroadSector('Health Tech')).toBe('healthcare')
    expect(normalizeBroadSector('FinTech / Payments')).toBe('financial-services')
    expect(normalizeBroadSector('Cybersecurity / Network Detection')).toBe('technology')
    expect(normalizeBroadSector('Warehouse Automation')).toBe('industrial-energy')
    expect(normalizeBroadSector('unknown niche')).toBeNull()
  })

  it('normalizes only the declared size vocabulary', () => {
    expect(normalizeSizeBand('startup')).toBe('startup')
    expect(normalizeSizeBand('mid-market')).toBe('midmarket')
    expect(normalizeSizeBand('Enterprise')).toBe('enterprise')
    expect(normalizeSizeBand('1001-10000')).toBeNull()
  })

  it('never permits a cross-sector control', () => {
    expect(controlMatchTier(
      { broad_sector_slug: 'technology', size_band: null },
      { broad_sector_slug: 'financial-services', size_band: null },
    )).toBeNull()
  })

  it('requires equal sizes when both sides have known size', () => {
    expect(controlMatchTier(
      { broad_sector_slug: 'technology', size_band: 'enterprise' },
      { broad_sector_slug: 'technology', size_band: 'enterprise' },
    )).toBe('broad_sector_size')
    expect(controlMatchTier(
      { broad_sector_slug: 'technology', size_band: 'enterprise' },
      { broad_sector_slug: 'technology', size_band: 'startup' },
    )).toBeNull()
  })

  it('records an explicit unknown-size tier instead of guessing', () => {
    expect(controlMatchTier(
      { broad_sector_slug: 'technology', size_band: null },
      { broad_sector_slug: 'technology', size_band: 'midmarket' },
    )).toBe('broad_sector_size_unknown')
    expect(MATCHING_DIMENSION_VERSION).toBe('v1')
    expect(MATCHING_POLICY_VERSION).toBe('sector-size-v2')
  })

  it('uses a dimension only when linked evidence has one normalized value', () => {
    expect(resolveMatchingDimensions(
      { sector: 'Cloud Security' },
      [{ sector: 'Cybersecurity', company_size: 'Enterprise' }],
    )).toEqual({
      broad_sector_slug: 'technology',
      size_band: 'enterprise',
      matching_dimension_version: 'v1',
    })
    expect(resolveMatchingDimensions(
      { sector: 'Cloud Security' },
      [
        { sector: 'Financial Services', company_size: 'Enterprise' },
        { sector: 'Cybersecurity', company_size: 'Startup' },
      ],
    )).toEqual({
      broad_sector_slug: null,
      size_band: null,
      matching_dimension_version: 'v1',
    })
  })

  it('selects three deterministic eligible controls without cross-sector fallback', () => {
    const selected = selectControlCandidates(
      { canonical_company_id: 'opening', broad_sector_slug: 'technology', size_band: null },
      [
        { id: 'd', broad_sector_slug: 'financial-services', size_band: null },
        { id: 'c', broad_sector_slug: 'technology', size_band: 'enterprise' },
        { id: 'opening', broad_sector_slug: 'technology', size_band: null },
        { id: 'a', broad_sector_slug: 'technology', size_band: null },
        { id: 'b', broad_sector_slug: 'technology', size_band: 'startup' },
      ],
      new Set(['a']),
    )

    expect(selected.map((candidate) => candidate.id)).toEqual(['b', 'c'])
    expect(selected.every((candidate) => candidate.match_tier === 'broad_sector_size_unknown')).toBe(true)
  })

  it('ranks exact size matches ahead of unknown-size matches', () => {
    const selected = selectControlCandidates(
      { canonical_company_id: 'opening', broad_sector_slug: 'technology', size_band: 'enterprise' },
      [
        { id: 'a', broad_sector_slug: 'technology', size_band: null },
        { id: 'b', broad_sector_slug: 'technology', size_band: 'enterprise' },
      ],
      new Set(),
      2,
    )

    expect(selected.map((candidate) => candidate.id)).toEqual(['b', 'a'])
    expect(selected.map((candidate) => candidate.match_tier)).toEqual([
      'broad_sector_size',
      'broad_sector_size_unknown',
    ])
  })

  it('plans one reconciliation update per canonical company', () => {
    const updates = buildCanonicalDimensionUpdates(
      [
        { id: 'a', sector: 'Health Tech' },
        { id: 'b', sector: null },
      ],
      [
        { canonical_company_id: 'a', sector: 'Healthcare', company_size: 'midmarket' },
        { canonical_company_id: 'b', sector: 'Banking', company_size: 'enterprise' },
      ],
    )

    expect(updates).toEqual([
      {
        id: 'a', broad_sector_slug: 'healthcare', size_band: 'midmarket',
        matching_dimension_version: 'v1',
      },
      {
        id: 'b', broad_sector_slug: 'financial-services', size_band: 'enterprise',
        matching_dimension_version: 'v1',
      },
    ])
  })

  it('fails replay when build or per-cohort support is incomplete', () => {
    expect(() => assertReplayBuildSupport(null, 300)).toThrow('cohort_build_run_missing')
    expect(() => assertReplayBuildSupport({ included_cohort_count: 299 }, 300))
      .toThrow('cohort_support_below_target:299/300')
    expect(() => assertReplayBuildSupport({ included_cohort_count: 300 }, 300)).not.toThrow()

    expect(() => assertExactControlCount('cohort-a', 2, 3))
      .toThrow('incomplete_controls:cohort-a:2/3')
    expect(() => assertExactControlCount('cohort-a', 3, 3)).not.toThrow()
  })
})