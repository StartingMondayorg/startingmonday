import { describe, expect, it } from 'vitest'
import {
  compareHostedRegistry,
  evaluateSourceRightsEntry,
} from '../../scripts/lib/source-rights-readiness-core.mjs'

describe('source rights readiness', () => {
  it('blocks a source missing from the catalog', () => {
    expect(evaluateSourceRightsEntry(null, {
      asOfDate: '2026-08-13',
      reviewCadenceDays: 30,
    })).toMatchObject({
      readiness: 'BLOCKED_MISSING_CATALOG_ENTRY',
      missingFields: ['catalogEntry'],
    })
  })

  it('blocks incomplete rights evidence without inferring public permissions', () => {
    expect(evaluateSourceRightsEntry({
      status: 'active',
      implemented: true,
      rightsStatus: 'public',
      lastReviewedAt: '2026-08-01',
    }, {
      asOfDate: '2026-08-13',
      reviewCadenceDays: 30,
    })).toMatchObject({
      readiness: 'BLOCKED_INCOMPLETE_RIGHTS_EVIDENCE',
      staleReview: false,
    })
  })

  it('blocks complete but stale rights evidence', () => {
    const uses = Object.fromEntries([
      'collection',
      'internalAnalysis',
      'customerDisplay',
      'modelTraining',
      'aggregateStatistics',
      'exportPublication',
    ].map((key) => [key, 'conditional']))
    expect(evaluateSourceRightsEntry({
      status: 'active',
      implemented: true,
      rightsStatus: 'licensed',
      lastReviewedAt: '2026-07-01',
      rightsDecision: {
        uses,
        termsUrl: 'https://example.test/terms',
        termsVersion: '2026-07-01',
        evidenceReviewedAt: '2026-07-01',
        owner: 'LEGAL',
        nextReviewAt: '2026-08-01',
        retentionDeletion: 'contract-specific',
        attribution: 'required',
        commercialTier: 'paid',
      },
    }, {
      asOfDate: '2026-08-13',
      reviewCadenceDays: 30,
    })).toMatchObject({
      readiness: 'BLOCKED_STALE_RIGHTS_EVIDENCE',
      staleReview: true,
    })
  })

  it('reports catalog and hosted registry drift', () => {
    expect(compareHostedRegistry([
      { key: 'sec', status: 'active', rightsStatus: 'public' },
      { key: 'pdl', status: 'active', rightsStatus: 'licensed' },
    ], [
      { source_key: 'sec', source_status: 'pilot', rights_status: 'public' },
      { source_key: 'orphan', source_status: 'active', rights_status: 'unknown' },
    ])).toEqual({
      catalogRows: 2,
      hostedRows: 2,
      catalogMissingHosted: ['pdl'],
      hostedMissingCatalog: ['orphan'],
      statusMismatches: [{
        key: 'sec',
        catalogStatus: 'active',
        hostedStatus: 'pilot',
        catalogRights: 'public',
        hostedRights: 'public',
      }],
      parity: false,
    })
  })
})