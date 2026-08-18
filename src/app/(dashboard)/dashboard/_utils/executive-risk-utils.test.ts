import { describe, it, expect } from 'vitest'
import { buildExecutiveRiskModel } from './executive-risk-utils'

const base = {
  daysSinceLastAction: 0,
  daysSinceOnboard: 0,
  totalCount: 5,
  profileScore: 100,
  sponsorCoveragePercent: 80,
  offerCount: 0,
  signalCount: 0,
  overdueCount: 0,
}

describe('buildExecutiveRiskModel', () => {
  it('returns managed state when nothing is at risk', () => {
    const { riskItems, executivePrimaryRisk, executiveDecisionBrief } = buildExecutiveRiskModel(base)
    expect(riskItems).toHaveLength(4)
    expect(executivePrimaryRisk.label).toBe('Managed')
    expect(executiveDecisionBrief.cta).toBe('Strengthen sponsor map')
  })

  it('prioritizes decision drag when offers stall', () => {
    const out = buildExecutiveRiskModel({ ...base, offerCount: 1, daysSinceLastAction: 8 })
    expect(out.executivePrimaryRisk.label).toBe('Decision drag')
    expect(out.executivePrimaryRisk.level).toBe('high')
    expect(out.executiveDecisionBrief.href).toBe('/dashboard/offers')
  })

  it('flags sponsor depth gap when coverage is low with several targets', () => {
    const out = buildExecutiveRiskModel({ ...base, totalCount: 4, sponsorCoveragePercent: 25 })
    expect(out.executivePrimaryRisk.label).toBe('Sponsor depth gap')
    const isolation = out.riskItems.find(r => r.id === 'isolation-risk')
    expect(isolation?.level).toBe('high')
  })

  it('flags momentum decay after 14 idle days', () => {
    const out = buildExecutiveRiskModel({ ...base, daysSinceLastAction: 15 })
    expect(out.executivePrimaryRisk.label).toBe('Momentum decay')
  })

  it('routes decision brief to signals when fresh signals exist', () => {
    const out = buildExecutiveRiskModel({ ...base, signalCount: 3 })
    expect(out.executiveDecisionBrief.href).toBe('/dashboard/signals')
    expect(out.executiveDecisionBrief.changed).toContain('3 fresh market signals')
  })

  it('routes decision brief to calendar when follow-ups are overdue', () => {
    const out = buildExecutiveRiskModel({ ...base, overdueCount: 2 })
    expect(out.executiveDecisionBrief.href).toBe('/dashboard/calendar')
  })
})
