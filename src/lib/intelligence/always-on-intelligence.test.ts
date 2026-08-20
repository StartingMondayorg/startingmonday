import { describe, expect, it } from 'vitest'
import { buildAlwaysOnIntelligencePulse } from '@/lib/intelligence/always-on-intelligence'

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('buildAlwaysOnIntelligencePulse', () => {
  it('summarizes signal volume and top types/companies within 30 days', () => {
    const pulse = buildAlwaysOnIntelligencePulse([
      { signal_type: 'exec_departure', signal_date: isoDaysAgo(2), companies: { name: 'Alpha Co' } },
      { signal_type: 'exec_departure', signal_date: isoDaysAgo(8), companies: { name: 'Alpha Co' } },
      { signal_type: 'funding', signal_date: isoDaysAgo(3), companies: { name: 'Beta Co' } },
      { signal_type: 'board_change', signal_date: isoDaysAgo(4), companies: { name: 'Alpha Co' } },
      { signal_type: 'funding', signal_date: isoDaysAgo(40), companies: { name: 'Gamma Co' } },
    ])

    expect(pulse.signalsLast30Days).toBe(4)
    expect(pulse.topSignalTypes[0]?.type).toBe('exec_departure')
    expect(pulse.topCompanies[0]?.companyName).toBe('Alpha Co')
    expect(pulse.topCompanies[0]?.signalCount).toBe(3)
  })
})