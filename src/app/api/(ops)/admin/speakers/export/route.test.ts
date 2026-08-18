import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getStaffMember: vi.fn(),
  withAuthCookies: vi.fn((response: Response) => response),
  select: vi.fn(),
  not: vi.fn(),
  order: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
  withAuthCookies: state.withAuthCookies,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/staff', () => ({
  getStaffMember: state.getStaffMember,
}))

import { GET } from './route'

describe('admin speakers export route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'coach@example.com' } } }),
      },
    })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.not.mockReturnThis()
    state.order.mockReturnThis()
  })

  it('returns the auth response when the user is not authenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers/export'))

    expect(response.status).toBe(401)
    expect(state.createClient).not.toHaveBeenCalled()
  })

  it('returns a CSV export for staff users', async () => {
    const rows = [
      {
        full_name: 'Ada Lovelace',
        first_name: 'Ada',
        last_name: 'Lovelace',
        title: 'Founder',
        company: 'Analytical Engines',
        linkedin_url: 'https://www.linkedin.com/in/ada',
        sector: 'education',
        outreach_status: 'new',
        priority: 1,
        outreach_notes: 'Priority lead',
        conference_appearances: [
          { conference_name: 'Future of Work', conference_year: 2025 },
          { conference_name: 'Career Summit', conference_year: 2024 },
        ],
      },
    ]

    state.createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          not: () => ({
            order: () => ({
              order: async () => ({ data: rows, error: null }),
            }),
          }),
        }),
      }),
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers/export'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(response.headers.get('content-disposition')).toMatch(/speakers-export-\d{4}-\d{2}-\d{2}\.csv/)

    const csv = await response.text()
    expect(csv).toContain('First Name')
    expect(csv).toContain('Ada')
    expect(csv).toContain('Analytical Engines')
    expect(csv).toContain('Future of Work 2025; Career Summit 2024')
  })

  it('returns 403 when the user is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/speakers/export'))

    expect(response.status).toBe(403)
  })
})
