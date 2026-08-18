import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  from: vi.fn(),
  stripeCustomerCreate: vi.fn(),
  stripeSessionCreate: vi.fn(),
  fromCalls: 0,
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: state.from }) }))
vi.mock('@/lib/config', () => ({ APP_URL: 'https://startingmonday.app' }))
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    customers: { create: state.stripeCustomerCreate },
    checkout: { sessions: { create: state.stripeSessionCreate } },
  }),
}))

import { POST } from './route'

describe('billing checkout seats route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.fromCalls = 0
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u1' })
    process.env.STRIPE_PRICE_PARTNER_ACTIVE = 'price_active'
    process.env.STRIPE_PRICE_PARTNER_PASSIVE = 'price_passive'

    state.stripeCustomerCreate.mockResolvedValue({ id: 'cus_1' })
    state.stripeSessionCreate.mockResolvedValue({ url: 'https://stripe.test/session' })

    state.from.mockImplementation((table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(async () => {
          if (table === 'users') return { data: { email: 'coach@example.com', stripe_customer_id: null }, error: null }
          if (table === 'user_profiles') return { data: { full_name: 'Coach Name' }, error: null }
          return { data: null, error: null }
        }),
        maybeSingle: vi.fn(async () => {
          if (table === 'partners') return { data: { id: 'p_1', user_id: null }, error: null }
          return { data: null, error: null }
        }),
        update: vi.fn(() => chain),
      }
      return chain
    })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout/seats', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid plan values', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout/seats', {
      method: 'POST',
      body: JSON.stringify({ plan: 'invalid' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates checkout session for partner seat purchase', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout/seats', {
      method: 'POST',
      body: JSON.stringify({ plan: 'active', quantity: 3 }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(state.stripeCustomerCreate).toHaveBeenCalled()
    expect(state.stripeSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({ price: 'price_active', quantity: 3 })],
    }))
    await expect(res.json()).resolves.toMatchObject({ url: 'https://stripe.test/session' })
  })
})
