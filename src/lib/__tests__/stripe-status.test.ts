import { describe, it, expect } from 'vitest'
import { mapStripeStatus } from '@/lib/billing/stripe-status'

describe('mapStripeStatus', () => {
  it('maps known Stripe statuses to internal statuses', () => {
    expect(mapStripeStatus('active')).toBe('active')
    expect(mapStripeStatus('trialing')).toBe('trialing')
    expect(mapStripeStatus('past_due')).toBe('past_due')
    expect(mapStripeStatus('canceled')).toBe('canceled')
  })

  it('maps unknown/uncommon Stripe statuses to inactive', () => {
    expect(mapStripeStatus('incomplete')).toBe('inactive')
    expect(mapStripeStatus('incomplete_expired')).toBe('inactive')
    expect(mapStripeStatus('unpaid')).toBe('inactive')
    expect(mapStripeStatus('')).toBe('inactive')
  })

  it('returns paused when pause_collection has a behavior', () => {
    expect(mapStripeStatus('active', { behavior: 'void' })).toBe('paused')
    expect(mapStripeStatus('active', { behavior: 'mark_uncollectible' })).toBe('paused')
  })

  it('ignores null or absent pause_collection', () => {
    expect(mapStripeStatus('active', null)).toBe('active')
    expect(mapStripeStatus('active', undefined)).toBe('active')
  })

  it('pause_collection takes precedence over stripe status', () => {
    // If somehow past_due but paused, paused wins
    expect(mapStripeStatus('past_due', { behavior: 'void' })).toBe('paused')
  })
})
