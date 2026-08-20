import { describe, expect, it } from 'vitest'
import { computePersonaRelevance, computeSignalConfidence } from './intelligence-quality'

describe('intelligence quality scoring', () => {
  it('weights authoritative fresh signals above unknown stale signals', () => {
    const fresh = computeSignalConfidence({ signalType: 'funding', sourceKind: 'sec_filing', hasSourceUrl: true, evidenceCount: 2, signalDate: new Date().toISOString().slice(0, 10) })
    const stale = computeSignalConfidence({ signalType: 'award', sourceKind: 'unknown', signalDate: '2020-01-01' })
    expect(fresh).toBeGreaterThan(stale)
    expect(computePersonaRelevance('exec_departure', { searchPersona: 'passive' })).toBeGreaterThan(0)
  })
})
