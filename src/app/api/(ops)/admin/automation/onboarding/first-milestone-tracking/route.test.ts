import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  latestBrief: vi.fn(),
  latestSignal: vi.fn(),
  latestAction: vi.fn(),
  upsertMilestone: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: state.requireStaffAutomationAccess }))

import { POST } from './route'

function buildSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'onboarding_brief_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({ maybeSingle: state.latestBrief })),
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'company_signals') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: state.latestSignal })),
              })),
            })),
          })),
        }
      }

      if (table === 'follow_ups') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: state.latestAction })),
              })),
            })),
          })),
        }
      }

      if (table === 'activation_milestones') {
        return {
          upsert: state.upsertMilestone,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/first-milestone-tracking/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.latestBrief.mockResolvedValue({ data: { created_at: '2026-01-01T00:00:00.000Z' } })
    state.latestSignal.mockResolvedValue({ data: { created_at: '2026-01-02T00:00:00.000Z' } })
    state.latestAction.mockResolvedValue({ data: { created_at: '2026-01-03T00:00:00.000Z' } })
    state.upsertMilestone.mockResolvedValue({ error: null })

    const supabase = buildSupabase()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase })
  })

  it('returns guard response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-milestone-tracking', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
    expect(state.requireStaffAutomationAccess).not.toHaveBeenCalled()
  })

  it('persists completed status when all first milestones exist', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-milestone-tracking', { method: 'POST' }))

    expect(state.upsertMilestone).toHaveBeenCalledTimes(1)
    const [payload] = state.upsertMilestone.mock.calls[0] as [Record<string, unknown>, { onConflict: string }]
    expect(payload.status).toBe('completed')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, status: 'completed' })
  })
})
