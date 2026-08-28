import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STATE,
  clampScore,
  weightedScore,
  scoreClass,
  type VendorOption,
} from './sales-enablement-data'

function makeOption(overrides: Partial<VendorOption> = {}): VendorOption {
  return {
    id: 'test',
    name: 'Test',
    model: 'freelancer',
    monthlyCost: 1000,
    status: 'active',
    owner: 'Owner',
    strategicFit: 3,
    commercialRisk: 3,
    executionConfidence: 3,
    day14Target: '',
    day30Target: '',
    notes: '',
    ...overrides,
  }
}

describe('clampScore', () => {
  it('bounds rating values to the 0-5 scale', () => {
    expect(clampScore(-25)).toBe(0)
    expect(clampScore(150)).toBe(5)
    expect(clampScore(3)).toBe(3)
  })

  it('coerces NaN to 0', () => {
    expect(clampScore(Number.NaN)).toBe(0)
  })
})

describe('weightedScore', () => {
  it('returns 100 for a maxed-out option', () => {
    expect(weightedScore(makeOption({ strategicFit: 5, commercialRisk: 5, executionConfidence: 5 }))).toBe(100)
  })

  it('returns 0 for a floor option', () => {
    expect(weightedScore(makeOption({ strategicFit: 0, commercialRisk: 0, executionConfidence: 0 }))).toBe(0)
  })

  it('weights strategic fit most heavily', () => {
    const fitHeavy = weightedScore(makeOption({ strategicFit: 5, commercialRisk: 0, executionConfidence: 0 }))
    const confidenceHeavy = weightedScore(makeOption({ strategicFit: 0, commercialRisk: 0, executionConfidence: 5 }))
    expect(fitHeavy).toBeGreaterThan(confidenceHeavy)
  })

  it('stays within 0-100 for every default-state option', () => {
    for (const option of DEFAULT_STATE.options) {
      const score = weightedScore(option)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })
})

describe('scoreClass', () => {
  it('maps score bands to distinct style buckets', () => {
    const high = scoreClass(85)
    const mid = scoreClass(65)
    const low = scoreClass(30)
    expect(high).not.toBe(mid)
    expect(mid).not.toBe(low)
    // Semantic tokens now, not raw hues: green -> success, amber -> warning.
    expect(high).toContain('success')
    expect(mid).toContain('warning')
  })
})
