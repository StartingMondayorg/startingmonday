import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getUser: vi.fn(),
  getStaffMember: vi.fn(),
  contactSelect: vi.fn(),
  companySelect: vi.fn(),
  contactInsert: vi.fn(),
  contactUpdate: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))

import { POST } from './route'

describe('outreach status route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.app' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.contactSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })
    state.companySelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'company-1' } }),
    })
    state.contactInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'contact-1' } }) }) })
    state.contactUpdate.mockReturnValue({ eq: vi.fn().mockReturnThis() })
    state.createClient.mockResolvedValue({
      auth: { getUser: state.getUser },
      from(table: string) {
        if (table === 'contacts') return { select: state.contactSelect, insert: state.contactInsert, update: state.contactUpdate }
        if (table === 'companies') return { select: state.companySelect }
        return {}
      },
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/status', {
      method: 'POST',
      body: JSON.stringify({ email: 'ada@example.com', status: 'reached_out' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects invalid status values', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/status', {
      method: 'POST',
      body: JSON.stringify({ email: 'ada@example.com', status: 'invalid' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid status.' })
  })

  it('creates a contact update and records telemetry', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/status', {
      method: 'POST',
      body: JSON.stringify({ email: 'ada@example.com', fullName: 'Ada Lovelace', company: 'Acme', status: 'reached_out' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'pipeline_stage_changed', expect.objectContaining({ stage: 'reached_out', source: 'outreach_status_route' }))
    expect(state.captureServerEvent).toHaveBeenCalledTimes(1)
  })
})
