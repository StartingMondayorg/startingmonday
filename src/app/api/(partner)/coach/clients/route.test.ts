import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getUserSubscription: vi.fn(),
  canAccessFeature: vi.fn(),
  seatsLimit: vi.fn(),
  profilesIn: vi.fn(),
  companiesIn: vi.fn(),
  followUpsLimit: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/subscription', () => ({
  getUserSubscription: state.getUserSubscription,
  canAccessFeature: state.canAccessFeature,
}))

function makeAdminClient() {
  return {
    from(table: string) {
      if (table === 'user_profiles') {
        return {
          select: () => ({ in: state.profilesIn }),
        }
      }
      if (table === 'companies') {
        return {
          select: () => ({
            in: () => ({
              is: () => state.companiesIn(),
            }),
          }),
        }
      }
      return {
        select: () => ({
          in: () => ({
            eq: () => ({
              order: () => state.followUpsLimit(),
            }),
          }),
        }),
      }
    },
  }
}

import { GET } from './route'

describe('coach clients route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'coach-1', response: new NextResponse() })
    state.getUserSubscription.mockResolvedValue({ tier: 'coach' })
    state.canAccessFeature.mockReturnValue(true)
    state.seatsLimit.mockResolvedValue({ data: [
      { id: 'seat-1', member_user_id: 'client-1', member_email: 'client@example.com', accepted_at: '2026-01-01T00:00:00.000Z' },
    ], error: null })
    state.profilesIn.mockResolvedValue({ data: [
      { user_id: 'client-1', full_name: 'Client One', momentum_score: 88, search_persona: 'executive', onboarding_completed_at: '2026-01-01T00:00:00.000Z' },
    ] })
    state.companiesIn.mockResolvedValue({ data: [
      { user_id: 'client-1', stage: 'interviewing' },
    ] })
    state.followUpsLimit.mockResolvedValue({ data: [
      { user_id: 'client-1', action: 'Follow up', due_date: '2026-01-02T00:00:00.000Z', next_action_owner: 'coach', next_action_due_date: '2026-01-03T00:00:00.000Z', next_action_status: 'pending', status: 'pending' },
    ] })
    state.createClient.mockResolvedValue({
      from(table: string) {
        if (table === 'team_seats') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => state.seatsLimit(),
              }),
            }),
          }
        }
        return makeAdminClient().from(table)
      },
    })
    state.createAdminClient.mockReturnValue(makeAdminClient())
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/clients'))

    expect(response.status).toBe(401)
  })

  it('returns upgrade required when the coach dashboard feature is unavailable', async () => {
    state.canAccessFeature.mockReturnValue(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/clients'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'upgrade_required' })
  })

  it('returns an empty list when there are no accepted seats', async () => {
    state.seatsLimit.mockResolvedValue({ data: [], error: null })

    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/clients'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns aggregated coach client data', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/clients'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      {
        seatId: 'seat-1',
        userId: 'client-1',
        email: 'client@example.com',
        name: 'Client One',
        momentumScore: 88,
        persona: 'executive',
        onboarded: true,
        activeCompanies: 1,
        overdueActions: 1,
        nextActionLabel: 'Follow up',
        nextActionOwner: 'coach',
        nextActionDueDate: '2026-01-03T00:00:00.000Z',
        nextActionStatus: 'pending',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  })
})
