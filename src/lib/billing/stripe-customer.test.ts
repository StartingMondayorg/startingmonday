import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  userRow: null as null | { email: string | null; stripe_customer_id: string | null },
  stripeListData: [] as Array<{ id: string; created: number }>,
  updateCalls: [] as Array<{ stripe_customer_id: string }>,
}))

vi.mock('@/lib/billing/stripe', () => ({
  getStripe: () => ({
    customers: {
      list: vi.fn(async () => ({ data: state.stripeListData })),
    },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: state.userRow }),
        }),
      }),
      update: (payload: { stripe_customer_id: string }) => {
        state.updateCalls.push(payload)
        return {
          eq: async () => ({ error: null }),
        }
      },
    }),
  }),
}))

import { getOrRecoverStripeCustomerId } from './stripe-customer'

describe('getOrRecoverStripeCustomerId', () => {
  beforeEach(() => {
    state.userRow = null
    state.stripeListData = []
    state.updateCalls = []
  })

  it('returns null when user does not exist', async () => {
    const result = await getOrRecoverStripeCustomerId('u1')
    expect(result).toBeNull()
  })

  it('returns existing stripe_customer_id without stripe lookup', async () => {
    state.userRow = { email: 'u@example.com', stripe_customer_id: 'cus_saved' }
    const result = await getOrRecoverStripeCustomerId('u1')
    expect(result).toBe('cus_saved')
    expect(state.updateCalls).toHaveLength(0)
  })

  it('returns null when email is missing and no saved customer id', async () => {
    state.userRow = { email: null, stripe_customer_id: null }
    const result = await getOrRecoverStripeCustomerId('u1')
    expect(result).toBeNull()
  })

  it('recovers newest stripe customer and backfills user row', async () => {
    state.userRow = { email: 'u@example.com', stripe_customer_id: null }
    state.stripeListData = [
      { id: 'cus_old', created: 10 },
      { id: 'cus_new', created: 20 },
    ]

    const result = await getOrRecoverStripeCustomerId('u1')
    expect(result).toBe('cus_new')
    expect(state.updateCalls).toEqual([{ stripe_customer_id: 'cus_new' }])
  })
})
