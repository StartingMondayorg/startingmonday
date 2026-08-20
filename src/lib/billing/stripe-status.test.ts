import { describe, expect, it } from 'vitest'
import { mapStripeStatus } from './stripe-status'

describe('mapStripeStatus (library contract)', () => {
  it('maps active and trialing states directly', () => {
    expect(mapStripeStatus('active')).toBe('active')
    expect(mapStripeStatus('trialing')).toBe('trialing')
  })

  it('maps paused when pause_collection is present', () => {
    expect(mapStripeStatus('active', { behavior: 'void' })).toBe('paused')
  })

  it('maps unknown statuses to inactive', () => {
    expect(mapStripeStatus('incomplete')).toBe('inactive')
    expect(mapStripeStatus('unpaid')).toBe('inactive')
  })
})
