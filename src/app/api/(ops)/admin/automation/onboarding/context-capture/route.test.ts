import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  maybeSingleProfile: vi.fn(),
  limitCompanies: vi.fn(),
  limitContacts: vi.fn(),
  insertSnapshot: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: state.requireStaffAutomationAccess }))

import { POST } from './route'

function buildSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: state.maybeSingleProfile,
            })),
          })),
        }
      }

      if (table === 'companies') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: state.limitCompanies,
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: state.limitContacts,
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'onboarding_context_snapshots') {
        return {
          insert: state.insertSnapshot,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/context-capture/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.maybeSingleProfile.mockResolvedValue({ data: { full_name: 'Alex' } })
    state.limitCompanies.mockResolvedValue({ data: [{ id: 'c1' }, { id: 'c2' }] })
    state.limitContacts.mockResolvedValue({ data: [{ id: 'k1' }] })
    state.insertSnapshot.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'snap-1' }, error: null }),
      })),
    })

    const supabase = buildSupabase()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase })
  })

  it('returns the requireAuth response when auth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/context-capture', {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
    expect(state.requireStaffAutomationAccess).not.toHaveBeenCalled()
  })

  it('captures profile, company, and contact context into a snapshot', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/context-capture', {
      method: 'POST',
      body: JSON.stringify({ source: 'intake_screen' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      snapshotId: 'snap-1',
      companyCount: 2,
      contactCount: 1,
    })
  })

  it('returns 500 when snapshot insert fails', async () => {
    state.insertSnapshot.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      })),
    })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/context-capture', {
      method: 'POST',
      body: JSON.stringify({ source: 'intake_screen' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'Failed to capture context' })
  })
})
