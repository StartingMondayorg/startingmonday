import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  customerCreate: vi.fn(),
  customerUpdate: vi.fn(),
  checkoutCreate: vi.fn(),
  getPriceId: vi.fn(() => 'price_test'),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    customers: { create: state.customerCreate, update: state.customerUpdate },
    checkout: { sessions: { create: state.checkoutCreate } },
  }),
  getPriceId: state.getPriceId,
}))
vi.mock('@/lib/config', () => ({ APP_URL: 'https://startingmonday.app' }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(async () => {
          if (table === 'users') {
            return { data: { email: 'user@example.com', stripe_customer_id: null } }
          }
          return { data: { full_name: 'Test User' } }
        }),
        update: vi.fn(() => chain),
      }
      return chain
    },
  }),
}))

import { POST } from './route'

describe('billing checkout route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.customerCreate.mockResolvedValue({ id: 'cus_1' })
    state.checkoutCreate.mockResolvedValue({ url: 'https://stripe.test/session' })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid plans', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'not-a-plan' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid plan' })
  })

  it('normalizes legacy monitor plan and returns checkout url', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'monitor', interval: 'annual' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(state.getPriceId).toHaveBeenCalledWith('passive', 'annual')
    await expect(res.json()).resolves.toMatchObject({ url: 'https://stripe.test/session' })
  })
})
