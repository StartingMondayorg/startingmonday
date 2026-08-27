import { describe, it, expect } from 'vitest'
import { groupEntriesByState, matchNoticesToEntry } from './watchlist-warn.js'

describe('groupEntriesByState', () => {
  it('groups entries by uppercased state and skips entries with no state', () => {
    const entries = [
      { id: '1', company_name: 'Acme', state: 'ct' },
      { id: '2', company_name: 'Widget Co', state: 'CT' },
      { id: '3', company_name: 'No State Co', state: null },
      { id: '4', company_name: 'Empire Corp', state: 'NY' },
    ]
    const grouped = groupEntriesByState(entries)
    expect([...grouped.keys()].sort()).toEqual(['CT', 'NY'])
    expect(grouped.get('CT')).toHaveLength(2)
    expect(grouped.get('NY')).toHaveLength(1)
  })
})

describe('matchNoticesToEntry', () => {
  const notices = [
    { employer_name: 'Acme Inc.', event_date: '2026-08-01' },
    { employer_name: 'Widget Works LLC', event_date: '2026-08-05' },
    { employer_name: 'Unrelated Co', event_date: '2026-08-10' },
  ]

  it('matches an exact normalized name', () => {
    const matches = matchNoticesToEntry(notices, { company_name: 'Acme' })
    expect(matches).toHaveLength(1)
    expect(matches[0].employer_name).toBe('Acme Inc.')
  })

  it('matches when one normalized name contains the other', () => {
    const matches = matchNoticesToEntry(notices, { company_name: 'Widget Works' })
    expect(matches).toHaveLength(1)
    expect(matches[0].employer_name).toBe('Widget Works LLC')
  })

  it('returns no matches for an unrelated company', () => {
    const matches = matchNoticesToEntry(notices, { company_name: 'Totally Different Co' })
    expect(matches).toHaveLength(0)
  })

  it('returns no matches when the entry has no usable name', () => {
    expect(matchNoticesToEntry(notices, { company_name: '' })).toEqual([])
  })
})
