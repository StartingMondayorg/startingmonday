import { describe, expect, it } from 'vitest'
import { coverageGate, rateGate } from './intelligence-gate-status'

describe('intelligence gate status', () => {
  it('does not pass a rate gate without a denominator', () => {
    expect(rateGate({ numerator: 0, denominator: 0, maximumExclusive: 3 })).toEqual({
      ratePercent: null,
      status: 'no_data',
    })
  })

  it('evaluates rate thresholds when observations exist', () => {
    expect(rateGate({ numerator: 2, denominator: 100, maximumExclusive: 3 }).status).toBe('pass')
    expect(rateGate({ numerator: 3, denominator: 100, maximumExclusive: 3 }).status).toBe('fail')
  })

  it('does not claim provenance coverage without events', () => {
    expect(coverageGate({ covered: 0, total: 0, targetPercent: 100 })).toEqual({
      coveragePercent: null,
      status: 'no_data',
    })
  })
})