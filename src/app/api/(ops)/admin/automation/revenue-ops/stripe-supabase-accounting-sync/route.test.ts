import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  getStripe: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: mocked.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: mocked.requireStaffAutomationAccess }))
vi.mock('@/lib/billing/stripe', () => ({ getStripe: mocked.getStripe }))

import { POST } from './route'

describe('stripe-supabase accounting sync route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1', response: new Response() })
    mocked.getStripe.mockReturnValue({ invoices: { list: vi.fn() } })
  })

  it('records a partial run and skips Stripe when the user has no customer id', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { stripe_customer_id: null, subscription_status: 'active', subscription_tier: 'pilot' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'revenue_sync_runs') return { insert }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    mocked.requireStaffAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      userEmail: 'staff@example.com',
      supabase,
    })

    const response = await POST(new NextRequest('https://example.com/api/stripe-sync'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: 'partial',
      reason: 'No Stripe customer id found',
    })
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      status: 'partial',
      details: { reason: 'no_stripe_customer' },
    })
    expect(mocked.getStripe).not.toHaveBeenCalled()
  })

  it('returns the authentication response before requesting staff access', async () => {
    const response = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mocked.requireAuth.mockResolvedValue({ ok: false, response })

    const result = await POST(new NextRequest('https://example.com/api/stripe-sync'))

    expect(result.status).toBe(401)
    expect(mocked.requireStaffAutomationAccess).not.toHaveBeenCalled()
  })
})
