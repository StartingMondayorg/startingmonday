import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  asLooseSupabaseClient: vi.fn(),
  listTrendRuns: vi.fn(),
  insertTrendRun: vi.fn(),
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  asLooseSupabaseClient: state.asLooseSupabaseClient,
}))

import { GET } from './route'

describe('src/app/api/admin/automation/reporting/arpu-conversion-dashboard/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase: { key: 'raw' } })
    state.listTrendRuns.mockResolvedValue({
      data: [
        {
          id: 'r1',
          created_at: '2026-01-01T00:00:00.000Z',
          trend_payload: {
            ticket: 'PB-Q2-010',
            partner_id: 'p1',
            lane: 'launch',
            billing_payload: { amount_usd: 1000, included_seats: 10 },
          },
        },
        {
          id: 'r2',
          created_at: '2026-01-02T00:00:00.000Z',
          trend_payload: {
            ticket: 'PB-Q2-011',
            partner_id: 'p1',
            phase: 'scheduled',
          },
        },
        {
          id: 'r3',
          created_at: '2026-01-03T00:00:00.000Z',
          trend_payload: {
            ticket: 'PB-Q2-011',
            partner_id: 'p1',
            phase: 'completed',
          },
        },
      ],
    })
    state.insertTrendRun.mockResolvedValue({ error: null })
    state.asLooseSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'trend_report_runs') {
          return {
            select: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: state.listTrendRuns,
                })),
              })),
            })),
            insert: state.insertTrendRun,
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })
  })

  it('returns auth response when automation access fails', async () => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    state.requireAutomationAccess.mockResolvedValue({ ok: false, response: denied })

    const res = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/arpu-conversion-dashboard'))
    expect(res.status).toBe(403)
  })

  it('returns ARPU and conversion summary and persists the report run', async () => {
    const res = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/arpu-conversion-dashboard?lookback_days=90'))

    expect(state.insertTrendRun).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ticket).toBe('PB-Q2-012')
    expect(body.arpu_by_segment[0]).toMatchObject({ segment: 'launch', arpu_usd: 100, partner_count: 1 })
    expect(body.pilot_to_contract_conversion).toMatchObject({
      pilot_count: 1,
      contract_count: 1,
      conversion_rate_pct: 100,
    })
  })
})
