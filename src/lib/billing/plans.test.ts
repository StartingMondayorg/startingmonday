import { describe, expect, it } from 'vitest'
import { PLANS } from './plans'

describe('plans', () => {
  it('keeps the plan ladder ordered by monthly price', () => {
    expect(PLANS.passive.amount).toBeLessThan(PLANS.active.amount)
    expect(PLANS.active.amount).toBeLessThan(PLANS.executive.amount)
    expect(PLANS.executive.features).toContain('Priority contact flagging and CSV export')
  })
})
