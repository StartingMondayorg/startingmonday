import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  seatMaybeSingle: vi.fn(),
  permissionMaybeSingle: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

function makeRouteClient() {
  return {
    from(table: string) {
      if (table === 'team_seats') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({ maybeSingle: state.seatMaybeSingle }),
              }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: state.permissionMaybeSingle }),
          }),
        }),
        upsert: state.upsert,
      }
    },
  }
}

import { DELETE, GET, PUT } from './route'

describe('client coach access route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'client-1', response: new NextResponse() })
    state.seatMaybeSingle.mockResolvedValue({ data: { id: 'seat-1' }, error: null })
    state.permissionMaybeSingle.mockResolvedValue({ data: { coach_id: 'coach-1', client_id: 'client-1', access_enabled: true, access_level: 'read_write', updated_at: '2026-01-01T00:00:00.000Z' }, error: null })
    state.upsert.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(makeRouteClient())
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(401)
  })

  it('returns 404 when the coach relationship is missing', async () => {
    state.seatMaybeSingle.mockResolvedValue({ data: null, error: null })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Coach relationship not found' })
  })

  it('returns coach access settings', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: {
        coach_id: 'coach-1',
        client_id: 'client-1',
        access_enabled: true,
        access_level: 'read_write',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    })
  })

  it('updates coach access settings', async () => {
    const response = await PUT(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1', {
      method: 'PUT',
      body: JSON.stringify({ coach_access_enabled: false, access_level: 'read_only' }),
    }), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({
      coach_id: 'coach-1',
      client_id: 'client-1',
      access_enabled: false,
      access_level: 'read_only',
    }), { onConflict: 'coach_id,client_id' })
  })

  it('revokes coach access', async () => {
    const response = await DELETE(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1', { method: 'DELETE' }), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(state.upsert).toHaveBeenCalledWith(expect.objectContaining({
      coach_id: 'coach-1',
      client_id: 'client-1',
      access_enabled: false,
      access_level: 'read_only',
    }), { onConflict: 'coach_id,client_id' })
  })
})
