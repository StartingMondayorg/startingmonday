import { describe, it, expect } from 'vitest'
import { buildDailyMomentumActions } from './momentum-actions'

const base = {
  warmPath: null,
  overdueCount: 0,
  interviewingCompany: null,
  profileScore: 100,
  profileHref: '/dashboard/profile',
  signalCount: 0,
  totalCount: 15,
  targetTitles: ['CTO'],
  targetSectors: ['Health Tech'],
}

describe('buildDailyMomentumActions', () => {
  it('returns three actions with why-chain fields on every action', () => {
    const actions = buildDailyMomentumActions(base)
    expect(actions).toHaveLength(3)
    for (const action of actions) {
      expect(action.whyNow, `${action.id} missing whyNow`).toBeTruthy()
      expect(action.whyYou, `${action.id} missing whyYou`).toBeTruthy()
    }
  })

  it('builds signal-anchored relationship action with deep links for a warm path', () => {
    const actions = buildDailyMomentumActions({
      ...base,
      warmPath: {
        contactId: 'c1',
        contactName: 'Dana Reyes',
        contactTitle: 'VP Operations',
        companyId: 'co1',
        companyName: 'Middleby',
        signal: {
          signal_type: 'exec_departure',
          signal_summary: 'CFO departed effective July 1.',
          signal_date: '2026-07-06',
        },
      },
    })
    const rel = actions[0]
    expect(rel.title).toContain('Dana Reyes')
    expect(rel.whyNow).toContain('exec departure')
    expect(rel.whyNow).toContain('CFO departed')
    expect(rel.whyYou).toContain('Middleby')
    expect(rel.whyYou).toContain('CTO')
    expect(rel.href).toBe('/dashboard/contacts/c1/outreach')
    expect(rel.links?.map(l => l.label)).toEqual(['View signal', 'View company'])
  })

  it('prioritizes live interview prep in the readiness slot', () => {
    const actions = buildDailyMomentumActions({
      ...base,
      interviewingCompany: { id: 'co2', name: 'Cotiviti' },
    })
    const readiness = actions[1]
    expect(readiness.title).toContain('Cotiviti')
    expect(readiness.href).toBe('/dashboard/companies/co2/prep')
    expect(readiness.whyNow).toContain('live interview')
  })

  it('uses profile gaps in readiness why-now when incomplete', () => {
    const actions = buildDailyMomentumActions({ ...base, profileScore: 60 })
    expect(actions[1].whyNow).toContain('60%')
  })

  it('falls back gracefully when the profile has no targets', () => {
    const actions = buildDailyMomentumActions({ ...base, targetTitles: [], targetSectors: [] })
    for (const action of actions) {
      expect(action.whyYou).not.toContain('undefined')
    }
  })
})
