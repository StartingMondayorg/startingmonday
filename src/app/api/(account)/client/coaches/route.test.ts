import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  teamSeatsSelect: vi.fn(),
  teamSeatsEqMember: vi.fn(),
  teamSeatsEqStatus: vi.fn(),
  permissionsSelect: vi.fn(),
  coachProfilesSelect: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { GET } from './route'

describe('client coaches route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'client-1', response: new NextResponse() })
    state.teamSeatsEqStatus.mockResolvedValue({ data: [
      {
        id: 'seat-1',
        owner_id: 'coach-1',
        member_email: 'coach@example.com',
        access_level: 'read_only',
        access_granted_at: '2026-01-01T00:00:00.000Z',
        last_accessed_at: null,
        status: 'accepted',
      },
    ], error: null })
    state.permissionsSelect.mockResolvedValue({ data: [
      { coach_id: 'coach-1', access_enabled: true, access_level: 'read_only', updated_at: '2026-01-02T00:00:00.000Z' },
    ] })
    state.coachProfilesSelect.mockResolvedValue({ data: [
      { coach_id: 'coach-1', display_name: 'Coach One' },
    ] })
    state.createClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'team_seats') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => state.teamSeatsEqStatus(),
              }),
            }),
          }
        }
        if (table === 'coach_client_permissions') {
          return {
            select: () => ({
              eq: () => ({
                in: () => state.permissionsSelect(),
              }),
            }),
          }
        }
        return {
          select: () => ({
            in: () => state.coachProfilesSelect(),
          }),
        }
      },
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coaches'))

    expect(response.status).toBe(401)
  })

  it('maps coaches and permissions into the client payload', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coaches'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'seat-1',
          coach_id: 'coach-1',
          member_email: 'Coach One',
          coach_name: 'Coach One',
          coach_access_enabled: true,
          access_level: 'read_only',
          access_granted_at: '2026-01-02T00:00:00.000Z',
          last_accessed_at: null,
          status: 'accepted',
        },
      ],
    })
  })

  it('returns a degraded payload when the seat query fails', async () => {
    state.teamSeatsEqStatus.mockResolvedValue({ data: [], error: { message: 'db down' } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coaches'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: [], degraded: true })
  })
})
