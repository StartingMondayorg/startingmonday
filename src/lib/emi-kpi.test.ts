import { describe, expect, it } from 'vitest'
import {
  EMI_KPI_MIN_DENOMINATOR,
  day7CohortRange,
  denominatorStatus,
  isMeasuredStatus,
  ratioPercent,
  weekRange,
} from './emi-kpi'

describe('weekRange', () => {
  it('returns the UTC Monday-to-Sunday week containing the reference date', () => {
    // 2026-07-22 is a Wednesday.
    expect(weekRange('2026-07-22T12:00:00.000Z')).toEqual({ start: '2026-07-20', end: '2026-07-26' })
  })

  it('keeps a Monday reference date as the week start', () => {
    expect(weekRange('2026-07-20T00:00:00.000Z')).toEqual({ start: '2026-07-20', end: '2026-07-26' })
  })

  it('maps a Sunday reference date to the week that started the previous Monday', () => {
    expect(weekRange('2026-07-26T23:00:00.000Z')).toEqual({ start: '2026-07-20', end: '2026-07-26' })
  })
})

describe('day7CohortRange', () => {
  it('scores the fixed cohort week one week before the reporting week', () => {
    expect(day7CohortRange('2026-07-20', '2026-07-26')).toEqual({
      cohortStart: '2026-07-13',
      cohortEnd: '2026-07-19',
    })
  })

  it('guarantees 7 full days of maturity: the cohort closes 7 days before the reporting week ends', () => {
    const { cohortEnd } = day7CohortRange('2026-07-20', '2026-07-26')
    const maturityMs = new Date('2026-07-26T23:59:59.999Z').getTime() - new Date(`${cohortEnd}T23:59:59.999Z`).getTime()
    expect(maturityMs).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('crosses month boundaries correctly', () => {
    expect(day7CohortRange('2026-08-03', '2026-08-09')).toEqual({
      cohortStart: '2026-07-27',
      cohortEnd: '2026-08-02',
    })
  })
})

describe('ratioPercent', () => {
  it('computes a rounded percentage', () => {
    expect(ratioPercent(1, 3)).toBe(33.33)
    expect(ratioPercent(2, 5)).toBe(40)
  })

  it('returns null when the denominator is zero or negative', () => {
    expect(ratioPercent(3, 0)).toBeNull()
    expect(ratioPercent(3, -1)).toBeNull()
  })

  it('can never exceed 100 percent, even with a broken numerator', () => {
    // The historical defect: baseline_users=2, adoption_users=4 recorded 200.00.
    expect(ratioPercent(4, 2)).toBe(100)
  })

  it('clamps a negative numerator to zero', () => {
    expect(ratioPercent(-5, 10)).toBe(0)
  })
})

describe('denominatorStatus', () => {
  it('returns no_data for a zero denominator', () => {
    expect(denominatorStatus(0)).toBe('no_data')
  })

  it('returns insufficient_data below the documented floor', () => {
    expect(denominatorStatus(1)).toBe('insufficient_data')
    expect(denominatorStatus(EMI_KPI_MIN_DENOMINATOR - 1)).toBe('insufficient_data')
  })

  it('returns ok at and above the floor', () => {
    expect(denominatorStatus(EMI_KPI_MIN_DENOMINATOR)).toBe('ok')
    expect(denominatorStatus(500)).toBe('ok')
  })

  it('documents the floor as 20', () => {
    expect(EMI_KPI_MIN_DENOMINATOR).toBe(20)
  })
})

describe('isMeasuredStatus', () => {
  it('treats ok and insufficient_data with a value as measured', () => {
    expect(isMeasuredStatus('ok', 42)).toBe(true)
    expect(isMeasuredStatus('insufficient_data', 100)).toBe(true)
  })

  it('treats no_data, query_error, and null values as not measured', () => {
    expect(isMeasuredStatus('no_data', null)).toBe(false)
    expect(isMeasuredStatus('query_error', null)).toBe(false)
    expect(isMeasuredStatus('ok', null)).toBe(false)
  })
})
