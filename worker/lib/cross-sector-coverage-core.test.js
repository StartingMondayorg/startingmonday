import { describe, expect, it } from 'vitest'
import {
  classifySector,
  buildCanonicalCikReconciliationPlan,
  privacyThresholdCounts,
  summarizeDistinctSources,
  summarizeCanonicalCikCandidates,
  summarizeFieldCoverage,
  summarizeSectorRows,
  summarizeUserDemand,
} from '../../scripts/lib/cross-sector-coverage-core.mjs'

describe('cross-sector coverage core', () => {
  it('classifies named pilot sectors conservatively', () => {
    expect(classifySector('Pharmaceuticals & Biotech')).toBe('pharmaceuticals_life_sciences')
    expect(classifySector('Publishing & Information Services')).toBe('publishing_media')
    expect(classifySector('Nonprofit & NGO')).toBe('nonprofit_ngo')
    expect(classifySector('Enterprise Software / SaaS')).toBe('technology')
    expect(classifySector('Commercial Foodservice Equipment')).toBe('other_named')
    expect(classifySector('  ')).toBe('unspecified')
  })

  it('summarizes sector rows without dropping unknowns', () => {
    expect(summarizeSectorRows([
      { sector: 'Biotech' },
      { sector: 'Magazine Publishing' },
      { sector: null },
    ])).toMatchObject({
      pharmaceuticals_life_sciences: 1,
      publishing_media: 1,
      unspecified: 1,
    })
  })

  it('counts unique active-user demand and cross-sector users', () => {
    expect(summarizeUserDemand(['u1', 'u2'], [
      { user_id: 'u1', target_sectors: ['SaaS', 'Pharmaceuticals'] },
      { user_id: 'u2', target_sectors: [] },
      { user_id: 'inactive', target_sectors: ['Publishing'] },
    ])).toEqual({
      activeUsers: 2,
      usersWithTargetSectors: 1,
      multiTargetSectorUsers: 1,
      crossSectorUsers: 1,
      usersBySector: {
        technology: 1,
        pharmaceuticals_life_sciences: 1,
        publishing_media: 0,
        nonprofit_ngo: 0,
        other_named: 0,
        unspecified: 0,
      },
    })
  })

  it('reports field denominators, populated values, and missing values', () => {
    expect(summarizeFieldCoverage([
      { sic: '2834', scale: 0 },
      { sic: null, scale: '' },
    ], {
      sic: (row) => row.sic,
      scale: (row) => row.scale,
    })).toEqual({
      sic: { denominator: 2, populated: 1, missing: 1, coveragePercent: 50 },
      scale: { denominator: 2, populated: 1, missing: 1, coveragePercent: 50 },
    })
  })

  it('uses null coverage for an empty cohort', () => {
    expect(summarizeFieldCoverage([], { sic: (row) => row.sic })).toEqual({
      sic: { denominator: 0, populated: 0, missing: 0, coveragePercent: null },
    })
  })

  it('deduplicates repeated sources within a row', () => {
    expect(summarizeDistinctSources([
      { data_sources: ['sec', 'sec', 'press_release'] },
      { data_sources: [] },
    ])).toEqual({
      denominator: 2,
      rowsWithSource: 1,
      rowsWithoutSource: 1,
      bySource: { press_release: 1, sec: 1 },
    })
  })

  it('suppresses sparse user-demand cells without hiding zeroes', () => {
    expect(privacyThresholdCounts({ pharma: 2, publishing: 0, technology: 3 })).toEqual({
      pharma: { count: null, suppressed: true, minimum: 3 },
      publishing: { count: 0, suppressed: false, minimum: 3 },
      technology: { count: 3, suppressed: false, minimum: 3 },
    })
  })

  it('identifies only unambiguous linked CIK candidates', () => {
    expect(summarizeCanonicalCikCandidates([
      { canonical_company_id: 'c1', sec_cik: '0000123' },
      { canonical_company_id: 'c1', sec_cik: '123' },
      { canonical_company_id: 'c2', sec_cik: '456' },
      { canonical_company_id: 'c2', sec_cik: '789' },
      { canonical_company_id: 'c3', sec_cik: '999' },
    ], [
      { id: 'c1', sec_cik_padded: null },
      { id: 'c2', sec_cik_padded: null },
      { id: 'c3', sec_cik_padded: '0000000999' },
    ])).toEqual({
      canonicalCompanies: 3,
      linkedCanonicalCompanies: 3,
      linkedWithAnyCik: 3,
      conflictingLinkedCiks: 1,
      missingCanonicalCikWithUnambiguousCandidate: 1,
      alreadyAligned: 1,
      canonicalCikConflict: 0,
      candidateCikCollisionRows: 0,
      candidateCikAlreadyOwnedRows: 0,
      globalCollisionOverlapRows: 0,
      globalHeldRows: 0,
      safeCandidates: 1,
      existingDuplicateCikGroups: 0,
    })
  })

  it('holds candidate CIKs that collide globally or are already owned', () => {
    const { candidates, summary } = buildCanonicalCikReconciliationPlan([
      { canonical_company_id: 'c1', sec_cik: '123' },
      { canonical_company_id: 'c2', sec_cik: '123' },
      { canonical_company_id: 'c3', sec_cik: '456' },
      { canonical_company_id: 'c4', sec_cik: '789' },
    ], [
      { id: 'c1', sec_cik_padded: null },
      { id: 'c2', sec_cik_padded: null },
      { id: 'c3', sec_cik_padded: null },
      { id: 'c4', sec_cik_padded: null },
      { id: 'existing', sec_cik_padded: '0000000456' },
    ])

    expect(candidates).toEqual([
      { canonicalCompanyId: 'c4', secCikPadded: '0000000789' },
    ])
    expect(summary).toMatchObject({
      missingCanonicalCikWithUnambiguousCandidate: 4,
      candidateCikCollisionRows: 2,
      candidateCikAlreadyOwnedRows: 1,
      globalHeldRows: 3,
      safeCandidates: 1,
    })
  })
})