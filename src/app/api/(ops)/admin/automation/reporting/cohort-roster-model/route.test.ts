import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  asLooseSupabaseClient: vi.fn(),
  buildCohortModel: vi.fn(),
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  asLooseSupabaseClient: state.asLooseSupabaseClient,
}))

vi.mock('@/lib/outplacement-cohort-model', () => ({
  OUTPLACEMENT_MILESTONES: ['activated', 'prep_complete'],
  buildCohortModel: state.buildCohortModel,
}))

import { GET } from './route'

describe('src/app/api/admin/automation/reporting/cohort-roster-model/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase: { key: 'raw' } })
    state.buildCohortModel.mockReturnValue([
      { partnerId: 'partner-1', rosterSize: 3 },
      { partnerId: 'partner-2', rosterSize: 2 },
    ])

    state.asLooseSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'partners') {
          return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'partner-1', name: 'P1' }, { id: 'partner-2', name: 'P2' }] }) })) }
        }
        if (table === 'referral_attributions') {
          return { select: vi.fn(() => ({ gte: vi.fn().mockResolvedValue({ data: [] }) })) }
        }
        if (table === 'partner_program_settings') {
          return { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [] }) })) }
        }
        if (table === 'user_events' || table === 'briefs' || table === 'outreach_logs' || table === 'follow_ups') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                gte: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [] }),
                })),
              })),
            })),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })
  })

  it('returns auth response when automation access fails', async () => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    state.requireAutomationAccess.mockResolvedValue({ ok: false, response: denied })

    const res = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/cohort-roster-model'))
    expect(res.status).toBe(403)
  })

  it('returns cohort model totals and compatibility contract', async () => {
    const res = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/cohort-roster-model?window_days=180'))

    expect(state.buildCohortModel).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      ticket: 'PB-Q2-001',
      data_model: {
        totals: {
          cohort_count: 2,
          partner_count: 2,
          roster_users: 5,
        },
      },
      compatibility: {
        contract_status: 'pass',
      },
    })
  })
})
