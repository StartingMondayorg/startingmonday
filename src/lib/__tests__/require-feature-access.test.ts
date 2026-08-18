import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/require-auth')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/billing/subscription')
vi.mock('@/lib/api-usage')

import { requireFeatureAccess } from '@/lib/require-feature-access'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { isRateLimited } from '@/lib/api-usage'

const mockRequireAuth = vi.mocked(requireAuth)
const mockCreateClient = vi.mocked(createClient)
const mockGetUserSubscription = vi.mocked(getUserSubscription)
const mockCanAccessFeature = vi.mocked(canAccessFeature)
const mockIsRateLimited = vi.mocked(isRateLimited)

const fakeSupabase = {} as Awaited<ReturnType<typeof createClient>>
const fakeRequest = new NextRequest('https://startingmonday.app/api/test')

beforeEach(() => {
  vi.resetAllMocks()
  mockCreateClient.mockResolvedValue(fakeSupabase)
  mockGetUserSubscription.mockResolvedValue({} as never)
  mockCanAccessFeature.mockReturnValue(true)
  mockIsRateLimited.mockResolvedValue(false)
})

describe('requireFeatureAccess', () => {
  it('returns 401 response when unauthenticated', async () => {
    const authResponse = { ok: false as const, response: new NextResponse(null, { status: 401 }) }
    mockRequireAuth.mockResolvedValue(authResponse)

    const result = await requireFeatureAccess(fakeRequest, 'ai_chat')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns 402 when feature is not accessible for the subscription tier', async () => {
    mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    mockCanAccessFeature.mockReturnValue(false)

    const result = await requireFeatureAccess(fakeRequest, 'ai_chat')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(402)
      const body = await result.response.json()
      expect(body.error).toBe('upgrade_required')
      expect(body.plan).toBe('active')
    }
  })

  it('returns 429 when user is rate limited', async () => {
    mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    mockCanAccessFeature.mockReturnValue(true)
    mockIsRateLimited.mockResolvedValue(true)

    const result = await requireFeatureAccess(fakeRequest, 'ai_chat')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(429)
      const body = await result.response.json()
      expect(body.error).toContain('token limit')
    }
  })

  it('returns ok with userId and supabase when all checks pass', async () => {
    mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-abc', response: new NextResponse() })
    mockCanAccessFeature.mockReturnValue(true)
    mockIsRateLimited.mockResolvedValue(false)

    const result = await requireFeatureAccess(fakeRequest, 'prep_brief')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.userId).toBe('user-abc')
      expect(result.supabase).toBe(fakeSupabase)
    }
  })

  it('checks the specified feature name against subscription', async () => {
    mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    mockCanAccessFeature.mockReturnValue(true)

    await requireFeatureAccess(fakeRequest, 'strategy_brief')

    expect(mockCanAccessFeature).toHaveBeenCalledWith(expect.anything(), 'strategy_brief')
  })
})
