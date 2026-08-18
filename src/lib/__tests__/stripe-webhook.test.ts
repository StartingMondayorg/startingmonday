import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type Stripe from 'stripe'

// ── Hoisted state (available inside vi.mock factories) ─────────────────────
const state = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  sendEmail: vi.fn(),
  processedInsertError: null as null | { code: string; message: string },
  usersUpdateError: null as null | { message: string },
  usersUpdateData: null as null | { email: string },
}))

// ── Module mocks ───────────────────────────────────────────────────────────
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent: state.constructEvent } }),
}))

vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/config', () => ({ APP_URL: 'https://startingmonday.app' }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const resolveWith =
        table === 'processed_stripe_events'
          ? { error: state.processedInsertError }
          : { error: state.usersUpdateError, data: state.usersUpdateData }

      const c = {
        insert: vi.fn().mockResolvedValue(resolveWith),
        upsert: vi.fn().mockResolvedValue(resolveWith),
        update: vi.fn(),
        eq: vi.fn(),
        not: vi.fn(),
        select: vi.fn(),
        single: vi.fn().mockResolvedValue(resolveWith),
        // Make chain thenable so `await chain.eq(...)` works without .single()
        then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
          Promise.resolve(resolveWith).then(res, rej),
        catch: (rej: (e: unknown) => unknown) => Promise.resolve(resolveWith).catch(rej),
      }
      c.update.mockReturnValue(c)
      c.upsert.mockReturnValue(c)
      c.eq.mockReturnValue(c)
      c.not.mockReturnValue(c)
      c.select.mockReturnValue(c)
      return c
    },
  }),
}))

import { POST } from '@/app/api/(ops)/webhooks/stripe/route'

// ── Helpers ────────────────────────────────────────────────────────────────
function makeRequest(body = '{}', sig: string | null = 'valid-sig') {
  const headers: Record<string, string> = {}
  if (sig !== null) headers['stripe-signature'] = sig
  return new NextRequest('https://startingmonday.app/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers,
  })
}

function makeEvent(
  type: string,
  object: object,
  id = 'evt_test_001',
): Stripe.Event {
  return {
    id,
    type: type as Stripe.Event['type'],
    data: { object: object as Stripe.Event['data']['object'] },
    object: 'event',
    api_version: '2023-10-16',
    created: 1700000000,
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as Stripe.Event
}

// ── Tests ──────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.resetAllMocks()
  state.processedInsertError = null
  state.usersUpdateError = null
  state.usersUpdateData = null
  state.sendEmail.mockResolvedValue(undefined)
})

describe('POST /api/webhooks/stripe', () => {
  describe('signature verification', () => {
    it('returns 400 when stripe-signature header is absent', async () => {
      const res = await POST(makeRequest('{}', null))
      expect(res.status).toBe(400)
      expect((await res.json()).error).toMatch(/signature/i)
    })

    it('returns 400 when constructEvent throws (bad signature)', async () => {
      state.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature')
      })
      const res = await POST(makeRequest())
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('Invalid signature')
    })
  })

  describe('idempotency', () => {
    it('returns 200 without re-processing a duplicate event (unique violation)', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('customer.deleted', { id: 'cus_abc' }),
      )
      state.processedInsertError = { code: '23505', message: 'duplicate key value' }

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
    })

    it('returns 500 on unexpected insert error so Stripe retries', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('customer.deleted', { id: 'cus_abc' }),
      )
      state.processedInsertError = { code: '42P01', message: 'relation does not exist' }

      const res = await POST(makeRequest())
      expect(res.status).toBe(500)
    })
  })

  describe('checkout.session.completed', () => {
    it('returns 200 and processes valid checkout', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          metadata: { userId: 'user-1', plan: 'active' },
          customer: 'cus_123',
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
    })

    it('skips DB update and returns 200 when plan is not in VALID_PLANS', async () => {
      // Sentinel: if the update runs, the error will surface as 500
      state.usersUpdateError = { message: 'SHOULD NOT REACH DB' }
      state.constructEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          metadata: { userId: 'user-1', plan: 'unlimited_platinum_hacker' },
          customer: 'cus_123',
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('skips DB update and returns 200 when userId is missing', async () => {
      state.usersUpdateError = { message: 'SHOULD NOT REACH DB' }
      state.constructEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          metadata: { plan: 'active' },
          customer: 'cus_123',
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('returns 500 when DB update fails', async () => {
      state.usersUpdateError = { message: 'connection timeout' }
      state.constructEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          metadata: { userId: 'user-1', plan: 'executive' },
          customer: 'cus_123',
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(500)
    })

    it('accepts all tiers in VALID_PLANS', async () => {
      for (const plan of ['free', 'passive', 'active', 'executive', 'campaign']) {
        vi.resetAllMocks()
        state.sendEmail.mockResolvedValue(undefined)
        state.constructEvent.mockReturnValue(
          makeEvent('checkout.session.completed', {
            metadata: { userId: 'user-1', plan },
            customer: 'cus_xyz',
          }),
        )
        const res = await POST(makeRequest())
        expect(res.status).toBe(200)
      }
    })
  })

  describe('customer.subscription.updated', () => {
    function makeSubEvent(overrides: object) {
      return makeEvent('customer.subscription.updated', {
        status: 'active',
        metadata: { userId: 'user-1', plan: 'active' },
        pause_collection: null,
        current_period_end: 1800000000,
        trial_end: null,
        ...overrides,
      })
    }

    it('returns 200 for active subscription update', async () => {
      state.constructEvent.mockReturnValue(makeSubEvent({}))
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('does not crash when plan metadata is outside VALID_PLANS (defaults to free)', async () => {
      state.constructEvent.mockReturnValue(makeSubEvent({ metadata: { userId: 'user-1', plan: 'bogus' } }))
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('sets tier to free when Stripe status is canceled', async () => {
      state.constructEvent.mockReturnValue(makeSubEvent({ status: 'canceled' }))
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('skips update and returns 200 when userId is absent from metadata', async () => {
      state.usersUpdateError = { message: 'SHOULD NOT REACH DB' }
      state.constructEvent.mockReturnValue(makeSubEvent({ metadata: {} }))
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('returns 500 on DB update failure', async () => {
      state.usersUpdateError = { message: 'write conflict' }
      state.constructEvent.mockReturnValue(makeSubEvent({}))
      const res = await POST(makeRequest())
      expect(res.status).toBe(500)
    })
  })

  describe('customer.subscription.deleted', () => {
    it('returns 200 and downgrades user to free on deletion', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', {
          metadata: { userId: 'user-2' },
          current_period_end: 1800000000,
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })

    it('skips update and returns 200 when userId is absent', async () => {
      state.usersUpdateError = { message: 'SHOULD NOT REACH DB' }
      state.constructEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', {
          metadata: {},
          current_period_end: 1800000000,
        }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })
  })

  describe('invoice.payment_failed', () => {
    it('marks account past_due and sends failure email to the user', async () => {
      state.usersUpdateData = { email: 'jane@example.com' }
      state.constructEvent.mockReturnValue(
        makeEvent('invoice.payment_failed', { customer: 'cus_abc' }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(state.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: expect.stringContaining('payment failed'),
        }),
      )
    })

    it('skips email when no email is on file for the customer', async () => {
      state.usersUpdateData = null
      state.constructEvent.mockReturnValue(
        makeEvent('invoice.payment_failed', { customer: 'cus_no_email' }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(state.sendEmail).not.toHaveBeenCalled()
    })

    it('skips update and returns 200 when customer is null on the invoice', async () => {
      state.usersUpdateError = { message: 'SHOULD NOT REACH DB' }
      state.constructEvent.mockReturnValue(
        makeEvent('invoice.payment_failed', { customer: null }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
    })
  })

  describe('customer.deleted', () => {
    it('clears stripe_customer_id and sets account inactive', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('customer.deleted', { id: 'cus_gone' }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
    })
  })

  describe('unhandled event type', () => {
    it('returns 200 received:true for unknown event types', async () => {
      state.constructEvent.mockReturnValue(
        makeEvent('payment_intent.created', { id: 'pi_abc' }),
      )
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect((await res.json()).received).toBe(true)
    })
  })
})
