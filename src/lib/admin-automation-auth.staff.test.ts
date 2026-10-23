import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: state.getUser } })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: state.eq }) }),
  }),
}))

import { requireStaffAutomationAccess } from './admin-automation-auth'

const ADMIN_ROW = {
  id: 'staff-1',
  email: 'admin@example.com',
  role: 'admin',
  permissions: {},
  created_at: '2026-01-01T00:00:00.000Z',
  created_by: null,
}

function request() {
  return new NextRequest('https://startingmonday.app/api/admin/automation', { method: 'POST' })
}

function signedInAs(emailConfirmedAt: string | undefined) {
  state.getUser.mockResolvedValue({
    data: {
      user: { id: 'user-1', aud: 'authenticated', email: 'admin@example.com', email_confirmed_at: emailConfirmedAt },
    },
    error: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('AUTOMATION_SERVICE_TOKEN', '')
  state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1', response: new NextResponse() })
  state.eq.mockReturnValue({ maybeSingle: state.maybeSingle })
  state.maybeSingle.mockResolvedValue({ data: ADMIN_ROW })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('requireStaffAutomationAccess staff branch', () => {
  it('grants access to a staff admin with a confirmed email', async () => {
    signedInAs('2026-01-01T00:00:00.000Z')

    const result = await requireStaffAutomationAccess(request())

    expect(result.ok).toBe(true)
    expect(state.eq).toHaveBeenCalledWith('email', 'admin@example.com')
  })

  it('denies a user whose email matches a staff row but is not confirmed', async () => {
    signedInAs(undefined)

    const result = await requireStaffAutomationAccess(request())

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
    expect(state.eq).not.toHaveBeenCalled()
  })

  it('denies an unconfirmed user in development without the DEV_STAFF_BYPASS opt-in', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    signedInAs(undefined)

    const result = await requireStaffAutomationAccess(request())

    expect(result.ok).toBe(false)
  })
})
