import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createAdminClient: vi.fn(),
  seatSingle: vi.fn(),
  userUpdate: vi.fn(),
  seatDelete: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))

import { DELETE } from './route'

describe('team seat route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'owner-1', response: new NextResponse() })
    state.seatSingle.mockResolvedValue({ data: { id: 'seat-1', owner_id: 'owner-1', member_user_id: 'member-1', status: 'accepted' }, error: null })
    state.userUpdate.mockResolvedValue({ error: null })
    state.seatDelete.mockResolvedValue({ error: null })
    state.createAdminClient.mockImplementation(() => ({
      from(table: string) {
        if (table === 'team_seats') {
          return {
            select: () => ({ eq: () => ({ single: state.seatSingle }) }),
            delete: () => ({ eq: state.seatDelete }),
          }
        }
        if (table === 'users') {
          return { update: () => ({ eq: state.userUpdate }) }
        }
        return {}
      },
    }))
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/team/seat/seat-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'seat-1' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when the seat is missing', async () => {
    state.seatSingle.mockResolvedValueOnce({ data: null, error: null })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/team/seat/seat-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'seat-1' }) })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Seat not found' })
  })

  it('forbids deleting a seat owned by someone else', async () => {
    state.seatSingle.mockResolvedValueOnce({ data: { id: 'seat-1', owner_id: 'other-owner', member_user_id: 'member-1', status: 'accepted' }, error: null })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/team/seat/seat-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'seat-1' }) })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('downgrades the member and deletes the seat', async () => {
    const response = await DELETE(new NextRequest('https://startingmonday.app/api/team/seat/seat-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'seat-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.userUpdate).toHaveBeenCalled()
    expect(state.seatDelete).toHaveBeenCalled()
  })
})
