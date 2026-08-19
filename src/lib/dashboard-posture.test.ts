import { describe, expect, it } from 'vitest'
import { resolveDashboardSearchPosture } from './dashboard-posture'

describe('dashboard posture resolution', () => {
  it('prefers an explicit posture over inferred state', () => {
    expect(resolveDashboardSearchPosture({
      searchPosture: 'not_looking',
      employmentStatus: 'employed_exploring',
      searchTimeline: 'opportunistic',
    })).toBe('not_looking')
  })

  it('treats opportunistic exploring candidates as exploring', () => {
    expect(resolveDashboardSearchPosture({
      employmentStatus: 'employed_exploring',
      searchTimeline: 'opportunistic',
    })).toBe('exploring')
  })

  it('treats immediate searchers as active', () => {
    expect(resolveDashboardSearchPosture({
      employmentStatus: 'between_roles',
      searchTimeline: 'immediately',
    })).toBe('active')
  })

  it('treats non-looking users as not_looking', () => {
    expect(resolveDashboardSearchPosture({
      employmentStatus: 'employed_secure',
      searchTimeline: 'not_active',
    })).toBe('not_looking')
  })
})
