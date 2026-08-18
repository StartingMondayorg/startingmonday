import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getStaffMember: vi.fn(),
  authGetUser: vi.fn(),
  query: vi.fn(),
  withAuthCookies: vi.fn((response: Response) => response),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
  withAuthCookies: state.withAuthCookies,
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { GET, POST } from './route'

describe('admin speakers route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.authGetUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.app' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.query.mockResolvedValue({ data: [{ id: 'speaker-1', full_name: 'Ada Lovelace', conference_appearances: [] }], error: null })
    state.createClient.mockResolvedValue({ auth: { getUser: state.authGetUser } })
    state.createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({ order: () => ({ order: () => ({ eq: vi.fn().mockReturnValue({ ilike: vi.fn().mockResolvedValue({ data: [{ id: 'speaker-1', full_name: 'Ada Lovelace', conference_appearances: [] }], error: null }) }) }) }) }),
      }),
    })
  })

  it('returns 401 when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers'))

    expect(response.status).toBe(401)
  })

  it('returns forbidden for non-staff users', async () => {
    state.getStaffMember.mockResolvedValueOnce(null)

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns speakers and rejects empty csv uploads', async () => {
    const getResponse = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers?status=active&q=Ada'))
    expect(getResponse.status).toBe(200)
    expect(await getResponse.json()).toEqual({ speakers: [{ id: 'speaker-1', full_name: 'Ada Lovelace', conference_appearances: [] }] })

    const postResponse = await POST(new NextRequest('https://startingmonday.app/api/admin/speakers', {
      method: 'POST',
      headers: { 'content-type': 'text/csv' },
      body: '',
    }))

    expect(postResponse.status).toBe(400)
    expect(await postResponse.json()).toEqual({ error: 'Empty CSV' })
  })
})
