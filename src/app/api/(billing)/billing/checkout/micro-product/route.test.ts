import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  appCreateClient: vi.fn(),
  opsCreateClient: vi.fn(),
  getStripe: vi.fn(),
  usersSingle: vi.fn(),
  productMaybeSingle: vi.fn(),
  pricesLimit: vi.fn(),
  profileSingle: vi.fn(),
  update: vi.fn(),
  checkoutCreate: vi.fn(),
  customersCreate: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.appCreateClient,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: state.opsCreateClient,
}))

vi.mock('@/lib/stripe', () => ({
  getStripe: state.getStripe,
}))

vi.mock('@/lib/config', () => ({
  APP_URL: 'https://startingmonday.app',
}))

import { POST } from './route'

describe('micro product checkout route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.usersSingle.mockResolvedValue({ data: { email: 'coach@example.com', stripe_customer_id: 'cus_123' } })
    state.productMaybeSingle.mockResolvedValue({ data: { id: 'product-1', slug: 'resume-review', name: 'Resume Review', product_status: 'active' } })
    state.pricesLimit.mockResolvedValue({ data: [{ stripe_price_id: 'price_123', interval: 'one_time', is_active: true }] })
    state.profileSingle.mockResolvedValue({ data: { full_name: 'Coach Example' } })
    state.update.mockResolvedValue({ error: null })
    state.checkoutCreate.mockResolvedValue({ url: 'https://stripe.example.com/checkout' })
    state.customersCreate.mockResolvedValue({ id: 'cus_123' })
    state.appCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({ single: state.usersSingle }),
            }),
            update: state.update,
          }
        }
        return {
          select: () => ({
            eq: () => ({ single: state.profileSingle }),
          }),
          update: state.update,
        }
      },
    })
    state.opsCreateClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'micro_products') {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: state.productMaybeSingle }),
            }),
          }
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({ limit: state.pricesLimit }),
              }),
            }),
          }),
        }
      },
    })
    state.getStripe.mockReturnValue({
      customers: { create: state.customersCreate },
      checkout: { sessions: { create: state.checkoutCreate } },
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product', {
      method: 'POST',
      body: JSON.stringify({ slug: 'resume-review' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects missing slugs', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing micro-product slug' })
  })

  it('returns a checkout url for an active product', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product', {
      method: 'POST',
      body: JSON.stringify({ slug: 'resume-review' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: 'https://stripe.example.com/checkout' })
    expect(state.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_123',
      mode: 'payment',
      line_items: [{ price: 'price_123', quantity: 1 }],
    }))
  })
})
