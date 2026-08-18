import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  latestMbr: vi.fn(),
  latestTrend: vi.fn(),
  latestExceptions: vi.fn(),
  insertPrepRun: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: state.requireStaffAutomationAccess }))

import { POST } from './route'

function buildSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'monthly_business_review_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: state.latestMbr })),
              })),
            })),
          })),
        }
      }
      if (table === 'trend_report_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: state.latestTrend })),
              })),
            })),
          })),
        }
      }
      if (table === 'exception_list_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ maybeSingle: state.latestExceptions })),
              })),
            })),
          })),
        }
      }
      if (table === 'council_review_prep_runs') {
        return {
          insert: state.insertPrepRun,
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/reporting/council-review-prep/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.latestMbr.mockResolvedValue({ data: { month_key: '2026-06' } })
    state.latestTrend.mockResolvedValue({ data: { trend_payload: { score: 88 } } })
    state.latestExceptions.mockResolvedValue({ data: { exception_payload: { open: 2 } } })
    state.insertPrepRun.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'prep-1' } }),
      })),
    })

    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase: buildSupabase() })
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/council-review-prep', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('creates prep payload and persists council prep run', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/council-review-prep', { method: 'POST' }))

    expect(state.insertPrepRun).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      runId: 'prep-1',
      prepPayload: {
        discussion_prompts: [
          'What are the top growth constraints this period?',
          'Where did automation reduce cycle time the most?',
          'Which risk areas need owner-level decisions next month?',
        ],
      },
    })
  })
})
