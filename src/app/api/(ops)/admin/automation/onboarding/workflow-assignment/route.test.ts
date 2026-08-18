import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  userProfile: vi.fn(),
  userRow: vi.fn(),
  companyCount: vi.fn(),
  contactCount: vi.fn(),
  insertAssignment: vi.fn(),
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
              maybeSingle: state.userProfile,
            })),
          })),
        }
      }
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: state.userRow,
            })),
          })),
        }
      }
      if (table === 'companies') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: state.companyCount,
            })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: state.contactCount,
            })),
          })),
        }
      }
      if (table === 'onboarding_workflow_assignments') {
        return {
          insert: state.insertAssignment,
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/workflow-assignment/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.userProfile.mockResolvedValue({ data: { role_family: 'technical_leadership' } })
    state.userRow.mockResolvedValue({ data: { subscription_tier: 'starter' } })
    state.companyCount.mockResolvedValue({ count: 3 })
    state.contactCount.mockResolvedValue({ count: 4 })
    state.insertAssignment.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'assignment-1' }, error: null }),
      })),
    })

    const supabase = buildSupabase()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase })
  })

  it('returns guard response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/workflow-assignment', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('assigns technical leadership workflow when profile indicates role family', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/workflow-assignment', { method: 'POST' }))

    expect(state.insertAssignment).toHaveBeenCalledTimes(1)
    const [assignment] = state.insertAssignment.mock.calls[0] as [Record<string, unknown>]
    expect(assignment.workflow_key).toBe('technical_leadership_transition')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      assignmentId: 'assignment-1',
      workflow: { key: 'technical_leadership_transition' },
    })
  })

  it('returns 500 when assignment insert fails', async () => {
    state.insertAssignment.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      })),
    })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/workflow-assignment', { method: 'POST' }))

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'Failed to assign workflow' })
  })
})
