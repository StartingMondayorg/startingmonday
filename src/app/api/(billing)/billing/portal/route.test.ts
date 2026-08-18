import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  recoverCustomer: vi.fn(),
  portalCreate: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/stripe-customer', () => ({ getOrRecoverStripeCustomerId: state.recoverCustomer }))
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ billingPortal: { sessions: { create: state.portalCreate } } }),
}))

import { POST } from './route'

describe('billing portal route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.recoverCustomer.mockResolvedValue('cus_1')
    state.portalCreate.mockResolvedValue({ url: 'https://stripe.test/portal' })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/billing/portal', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when no stripe customer is available', async () => {
    state.recoverCustomer.mockResolvedValue(null)
    const req = new NextRequest('https://startingmonday.app/api/billing/portal', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns portal url when session is created', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/portal', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ url: 'https://stripe.test/portal' })
  })
})
