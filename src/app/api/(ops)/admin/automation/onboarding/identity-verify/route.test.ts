import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  listSubmissions: vi.fn(),
  insertVerificationCheck: vi.fn(),
  updateSubmission: vi.fn(),
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
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: state.listSubmissions,
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: state.updateSubmission,
            })),
          })),
        }
      }

      if (table === 'identity_verification_checks') {
        return {
          insert: state.insertVerificationCheck,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/identity-verify/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.listSubmissions.mockResolvedValue({
      data: [
        {
          id: 'sub-verified',
          payload: {
            full_name: 'Taylor Smith',
            email: 'taylor@acme.com',
            linkedin_url: 'https://www.linkedin.com/in/taylor-smith',
          },
        },
        {
          id: 'sub-review',
          payload: { full_name: 'Bo' },
        },
      ],
    })
    state.insertVerificationCheck.mockResolvedValue({ error: null })
    state.updateSubmission.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns requireAuth response when auth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/identity-verify', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when no staff member is found for caller', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/identity-verify', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('scores submissions and returns verified/review counts', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/identity-verify', {
      method: 'POST',
      body: JSON.stringify({ limit: 10 }),
    }))

    expect(state.insertVerificationCheck).toHaveBeenCalledTimes(2)
    expect(state.updateSubmission).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      processed: 2,
      verified: 1,
      needsReview: 1,
    })
  })
})
