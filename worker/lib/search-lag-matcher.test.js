import { describe, expect, it } from 'vitest'
import { matchExecutiveSearchLags, normalizeSearchLagCik } from './search-lag-matcher.js'

const departure = {
  id: 'departure-1',
  executive_id: 'exec-old',
  company_name: 'Acme',
  company_cik: '0000123456',
  title_normalized: 'CIO',
  end_date: '2025-01-15',
}

describe('matchExecutiveSearchLags', () => {
  it('matches the unique earliest appointment using normalized CIK and exact role', () => {
    const result = matchExecutiveSearchLags([
      departure,
      {
        id: 'appointment-later', executive_id: 'exec-later', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-05-01',
      },
      {
        id: 'appointment-first', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(result.matches).toEqual([
      expect.objectContaining({
        departureId: 'departure-1',
        appointmentId: 'appointment-first',
        companyCik: '123456',
        titleNormalized: 'CIO',
        lagDays: 45,
      }),
    ])
    expect(result.summary.holds.no_appointment_in_window).toBe(0)
  })

  it('normalizes formatted CIKs consistently', () => {
    const result = matchExecutiveSearchLags([
      { ...departure, company_cik: 'CIK 0000123456' },
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '000-123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(result.matches[0].companyCik).toBe('123456')
  })

  it('holds tied earliest appointments instead of guessing', () => {
    const result = matchExecutiveSearchLags([
      departure,
      {
        id: 'appointment-a', executive_id: 'exec-a', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
      {
        id: 'appointment-b', executive_id: 'exec-b', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(result.matches).toHaveLength(0)
    expect(result.summary.holds.ambiguous_earliest_appointment).toBe(1)
  })

  it('excludes same-executive, wrong-role, before-departure, and out-of-window rows', () => {
    const result = matchExecutiveSearchLags([
      departure,
      {
        id: 'same-exec', executive_id: 'exec-old', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-02-01',
      },
      {
        id: 'wrong-role', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CTO', start_date: '2025-02-01',
      },
      {
        id: 'before', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-01-01',
      },
      {
        id: 'too-late', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2026-08-01',
      },
    ])

    expect(result.matches).toHaveLength(0)
    expect(result.summary.holds.same_executive_appointment).toBe(1)
  })

  it('prevents one appointment from satisfying duplicate departures', () => {
    const result = matchExecutiveSearchLags([
      departure,
      { ...departure, id: 'departure-2' },
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(result.matches).toHaveLength(1)
    expect(result.summary.holds.appointment_reused).toBe(1)
  })

  it('holds when either executive identity is missing', () => {
    const missingDeparture = matchExecutiveSearchLags([
      { ...departure, executive_id: null },
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])
    const missingAppointment = matchExecutiveSearchLags([
      departure,
      {
        id: 'appointment', executive_id: null, company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(missingDeparture.summary.holds.missing_departure_executive_identity).toBe(1)
    expect(missingAppointment.summary.holds.missing_appointment_executive_identity).toBe(1)
  })

  it('rejects impossible calendar dates instead of rolling them forward', () => {
    const result = matchExecutiveSearchLags([
      { ...departure, end_date: '2025-02-31' },
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ])

    expect(result.matches).toHaveLength(0)
    expect(result.summary.holds.invalid_departure_date).toBe(1)
  })

  it('clamps month-end boundaries and includes the exact 18-month cutoff', () => {
    const result = matchExecutiveSearchLags([
      { ...departure, end_date: '2024-01-31' },
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-07-31',
      },
      {
        id: 'too-late', executive_id: 'exec-later', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-08-01',
      },
    ])

    expect(result.matches[0].appointmentId).toBe('appointment')
  })

  it('holds appointments after the declared as-of date', () => {
    const result = matchExecutiveSearchLags([
      departure,
      {
        id: 'appointment', executive_id: 'exec-new', company_cik: '123456',
        title_normalized: 'CIO', start_date: '2025-03-01',
      },
    ], { asOfDate: '2025-02-15' })

    expect(result.matches).toHaveLength(0)
    expect(result.summary.holds.appointment_after_as_of).toBe(1)
  })

  it('rejects an invalid as-of date', () => {
    expect(() => matchExecutiveSearchLags([], { asOfDate: '2026-02-30' }))
      .toThrow('invalid_as_of_date')
  })
})

describe('normalizeSearchLagCik', () => {
  it('normalizes padded CIKs and rejects empty identities', () => {
    expect(normalizeSearchLagCik('0000123456')).toBe('123456')
    expect(normalizeSearchLagCik(null)).toBeNull()
  })
})