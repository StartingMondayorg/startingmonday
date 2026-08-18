import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  constructEvent: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent: state.constructEvent } }),
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => ({ data: { id: 'msg_1' } })) }))
vi.mock('@/lib/config', () => ({ APP_URL: 'https://startingmonday.app' }))
vi.mock('@/lib/owner-email', () => ({ getOwnerEmail: () => 'owner@example.com' }))
vi.mock('@/lib/stripe-status', () => ({ mapStripeStatus: () => 'active' }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null, data: null }) }),
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), not: () => ({}) }) }),
    }),
  }),
}))

import { POST } from './route'

describe('stripe webhook route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 400 when signature header is missing', async () => {
    const req = new NextRequest('https://startingmonday.app/api/webhooks/stripe', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    state.constructEvent.mockImplementation(() => {
      throw new Error('bad signature')
    })
    const req = new NextRequest('https://startingmonday.app/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'sig' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
