import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getCustomerId: vi.fn(),
  listSubscriptions: vi.fn(),
  updateSubscription: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/stripe-customer', () => ({ getOrRecoverStripeCustomerId: state.getCustomerId }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    subscriptions: {
      list: state.listSubscriptions,
      update: state.updateSubscription,
    },
  }),
}))

import { POST } from './route'

describe('billing resume route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u1' })
    state.getCustomerId.mockResolvedValue('cus_1')
    state.listSubscriptions.mockResolvedValue({ data: [{ id: 'sub_1' }] })
    state.updateSubscription.mockResolvedValue({ id: 'sub_1' })
    state.logEvent.mockResolvedValue(undefined)
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/billing/resume', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 without an active subscription', async () => {
    state.listSubscriptions.mockResolvedValue({ data: [] })
    const req = new NextRequest('https://startingmonday.app/api/billing/resume', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('clears pause_collection and logs resume event', async () => {
    const req = new NextRequest('https://startingmonday.app/api/billing/resume', { method: 'POST', body: '{}' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(state.updateSubscription).toHaveBeenCalledWith('sub_1', { pause_collection: null })
    expect(state.logEvent).toHaveBeenCalledWith('u1', 'search_resumed', {})
    await expect(res.json()).resolves.toMatchObject({ ok: true })
  })
})
