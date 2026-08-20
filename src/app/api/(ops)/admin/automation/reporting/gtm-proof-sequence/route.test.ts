import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  trendInsert: null as Record<string, unknown> | null,
  obsInsert: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

describe('gtm proof sequence route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.trendInsert = null
    state.obsInsert = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: { trailingDays: 30, referenceDate: '2026-06-18' },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'proof_assets') {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { asset_key: 'proof_alpha', title: 'Proof Alpha', status: 'published', confidence_label: 'high', published_at: '2026-06-18T00:00:00.000Z' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'b2b_prospects') {
        const chain = {
          select: vi.fn(() => chain),
          is: vi.fn(() => chain),
          in: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { id: 'p1', stage: 'proposal_sent', archived_at: null },
              { id: 'p2', stage: 'demo_scheduled', archived_at: null },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'trend_report_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.trendInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'trend_1' }, error: null })),
        }
        return chain
      }

      if (table === 'scheduled_job_observability_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.obsInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'obs_1' }, error: null })),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('builds proof sequence assignments and logs run artifacts', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/gtm-proof-sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trailingDays: 30, referenceDate: '2026-06-18' }),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      ticket: 'DEV-EMI-407',
      trendRunId: 'trend_1',
      runId: 'obs_1',
      status: 'ok',
      summary: {
        publishedAssetCount: 1,
        prospectCount: 2,
        assignmentsCount: 2,
      },
    })

    expect(state.trendInsert).toMatchObject({ user_id: 'user_1' })
    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-gtm-proof-sequence',
      status: 'ok',
    })
  })
})
