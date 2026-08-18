import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  appCreateClient: vi.fn(),
  opsCreateClient: vi.fn(),
  getStripe: vi.fn(),
  usersSingle: vi.fn(),
  bundleMaybeSingle: vi.fn(),
  promotionCodesList: vi.fn(),
  checkoutCreate: vi.fn(),
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

describe('micro product bundle checkout route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.usersSingle.mockResolvedValue({ data: { email: 'coach@example.com', stripe_customer_id: 'cus_123' } })
    state.bundleMaybeSingle.mockResolvedValue({ data: { id: 'bundle-1', slug: 'resume-plus', name: 'Resume Plus', audience: 'executives', bundle_status: 'active', stripe_price_id: 'price_bundle', stripe_coupon_id: 'COUPON10' } })
    state.promotionCodesList.mockResolvedValue({ data: [{ id: 'promo_123' }] })
    state.checkoutCreate.mockResolvedValue({ url: 'https://stripe.example.com/bundle' })
    state.appCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({ single: state.usersSingle }),
            }),
            update: vi.fn(),
          }
        }
        return {
          select: () => ({
            eq: () => ({ maybeSingle: state.bundleMaybeSingle }),
          }),
        }
      },
    })
    state.opsCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: state.bundleMaybeSingle }),
        }),
      }),
    })
    state.getStripe.mockReturnValue({
      promotionCodes: { list: state.promotionCodesList },
      checkout: { sessions: { create: state.checkoutCreate } },
      customers: { create: vi.fn() },
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product-bundle', {
      method: 'POST',
      body: JSON.stringify({ bundleSlug: 'resume-plus' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects missing bundle slugs', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product-bundle', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing bundle slug' })
  })

  it('returns an error for invalid discount codes', async () => {
    state.promotionCodesList.mockResolvedValue({ data: [] })

    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product-bundle', {
      method: 'POST',
      body: JSON.stringify({ bundleSlug: 'resume-plus', discountCode: 'bad-code' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid or inactive discount code' })
  })

  it('creates a checkout session with the bundle coupon when no discount code is provided', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/billing/checkout/micro-product-bundle', {
      method: 'POST',
      body: JSON.stringify({ bundleSlug: 'resume-plus' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: 'https://stripe.example.com/bundle' })
    expect(state.checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_123',
      mode: 'payment',
      discounts: [{ coupon: 'COUPON10' }],
      line_items: [{ price: 'price_bundle', quantity: 1 }],
    }))
  })
})
