import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  insertIntake: vi.fn(),
  insertFollowUp: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table === 'onboarding_intake_submissions') {
        return {
          insert: state.insertIntake,
        }
      }

      if (table === 'follow_ups') {
        return {
          insert: state.insertFollowUp,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/intake/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.insertIntake.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'intake-1' }, error: null }),
      })),
    })
    state.insertFollowUp.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/intake', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when caller is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/intake', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('returns 500 when intake submission insert fails', async () => {
    state.insertIntake.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      })),
    })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/intake', {
      method: 'POST',
      body: JSON.stringify({ source: 'web_form', payload: { firstName: 'Alex' } }),
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'Failed to store intake submission' })
    expect(state.insertFollowUp).not.toHaveBeenCalled()
  })

  it('creates intake submission and queues follow-up task', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/intake', {
      method: 'POST',
      body: JSON.stringify({ source: 'web_form', payload: { firstName: 'Alex' } }),
    })
    const res = await POST(req)

    expect(state.insertFollowUp).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, intakeId: 'intake-1' })
  })
})
