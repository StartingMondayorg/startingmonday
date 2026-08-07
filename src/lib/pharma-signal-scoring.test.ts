import { describe, expect, it } from 'vitest'
import { buildPharmaSignalInputFromSignal, scorePharmaSignal, shouldSurfacePharmaSignal } from '@/lib/pharma-signal-scoring'

describe('scorePharmaSignal', () => {
  it('scores clinical and pharma-related signals as high confidence', () => {
    const result = scorePharmaSignal({
      title: 'Clinical Operations Director',
      companyName: 'Moderna',
      description: 'Leading clinical trial operations for a new oncology program.',
      sourceCategory: 'job_posting',
      roleFamily: 'clinical_operations',
    })

    expect(result.isPharmaRelevant).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.confidenceTier).toBe('high')
  })

  it('down-ranks generic company updates without pharma context', () => {
    const result = scorePharmaSignal({
      title: 'Company Update',
      companyName: 'Acme',
      description: 'Acme announces a new office opening in Chicago.',
      sourceCategory: 'company_press_releases',
      roleFamily: 'leadership',
    })

    expect(result.isPharmaRelevant).toBe(false)
    expect(result.score).toBeLessThan(40)
    expect(result.confidenceTier).toBe('low')
  })
})

describe('shouldSurfacePharmaSignal', () => {
  it('suppresses weak or noisy signals', () => {
    expect(
      shouldSurfacePharmaSignal({
        title: 'Company Update',
        companyName: 'Acme',
        description: 'Acme announced a new office opening.',
        sourceCategory: 'company_press_releases',
        roleFamily: 'leadership',
      })
    ).toBe(false)
  })

  it('allows strong pharma signals through', () => {
    expect(
      shouldSurfacePharmaSignal({
        title: 'Senior Director, Clinical Operations',
        companyName: 'Regeneron',
        description: 'Leading clinical trial operations for a gene therapy program.',
        sourceCategory: 'job_posting',
        roleFamily: 'clinical_operations',
      })
    ).toBe(true)
  })
})

describe('buildPharmaSignalInputFromSignal', () => {
  it('maps product and trial signals to a relevant role family', () => {
    const input = buildPharmaSignalInputFromSignal({
      signalType: 'new_product',
      companyName: 'Moderna',
      description: 'Moderna launched a new oncology therapy platform.',
      sourceKind: 'job_posting',
    })

    expect(input.roleFamily).toBe('clinical_operations')
    expect(input.title).toBe('new_product')
  })
})
