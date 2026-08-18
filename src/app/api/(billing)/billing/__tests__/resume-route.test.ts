import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/require-auth')
vi.mock('@/lib/stripe')
vi.mock('@/lib/stripe-customer')
vi.mock('@/lib/events')

import { POST } from '../resume/route'
import { requireAuth } from '@/lib/require-auth'
import { getStripe } from '@/lib/stripe'
import { getOrRecoverStripeCustomerId } from '@/lib/stripe-customer'
import { logEvent } from '@/lib/events'

const mockRequireAuth = vi.mocked(requireAuth)
const mockGetStripe = vi.mocked(getStripe)
const mockGetOrRecoverStripeCustomerId = vi.mocked(getOrRecoverStripeCustomerId)
const mockLogEvent = vi.mocked(logEvent)

function request() {
  return new NextRequest('https://startingmonday.app/api/billing/resume', {
    method: 'POST',
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
  mockGetOrRecoverStripeCustomerId.mockResolvedValue('cus_123')
  mockLogEvent.mockResolvedValue()
})

describe('POST /api/billing/resume', () => {
  it('returns auth response when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })
    const res = await POST(request())
    expect(res.status).toBe(401)
  })

  it('returns 404 when no billing account exists', async () => {
    mockGetOrRecoverStripeCustomerId.mockResolvedValue(null)
    const res = await POST(request())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('No billing account found')
  })

  it('returns 404 when no subscription exists', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] })
    const update = vi.fn()
    mockGetStripe.mockReturnValue({ subscriptions: { list, update } } as unknown as ReturnType<typeof getStripe>)

    const res = await POST(request())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('No subscription found')
    expect(update).not.toHaveBeenCalled()
  })

  it('clears pause_collection on success', async () => {
    const list = vi.fn().mockResolvedValue({ data: [{ id: 'sub_1' }] })
    const update = vi.fn().mockResolvedValue({})
    mockGetStripe.mockReturnValue({ subscriptions: { list, update } } as unknown as ReturnType<typeof getStripe>)

    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith('sub_1', { pause_collection: null })
    expect(mockLogEvent).toHaveBeenCalledWith('user-1', 'search_resumed', {})
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 500 on stripe update failure', async () => {
    const list = vi.fn().mockResolvedValue({ data: [{ id: 'sub_1' }] })
    const update = vi.fn().mockRejectedValue(new Error('stripe down'))
    mockGetStripe.mockReturnValue({ subscriptions: { list, update } } as unknown as ReturnType<typeof getStripe>)

    const res = await POST(request())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('stripe down')
  })
})
