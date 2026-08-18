import { describe, expect, it } from 'vitest'
import { DashboardProgressFeedSection } from './progress-feed-section'

describe('dashboard progress feed section module', () => {
  it('exports DashboardProgressFeedSection', () => {
    expect(typeof DashboardProgressFeedSection).toBe('function')
  })
})