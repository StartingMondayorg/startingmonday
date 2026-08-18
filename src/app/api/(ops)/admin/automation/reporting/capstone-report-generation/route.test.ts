import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  exportInsert: null as Record<string, unknown> | null,
  obsInsert: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

describe('capstone report generation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.exportInsert = null
    state.obsInsert = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({ ok: true, body: {} })

    state.from.mockImplementation((table: string) => {
      if (table === 'emi_kpi_snapshots') {
        const chain = {
          select: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { metric_name: 'emi_language_adoption_percent', metric_value: 88, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
              { metric_name: 'assessment_completion_percent', metric_value: 42, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
              { metric_name: 'day7_return_percent', metric_value: 58, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
              { metric_name: 'proof_assets_published_count', metric_value: 3, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
              { metric_name: 'b2b_pilot_conversion_percent', metric_value: 29, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
              { metric_name: 'tier1_claim_compliance_percent', metric_value: 100, metric_status: 'ok', week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'emi_sprint_export_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.exportInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'export_1' }, error: null })),
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

  it('generates capstone payload and logs observability run', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/capstone-report-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      sprintKey: 'sprint_6_capstone_report',
      exportRunId: 'export_1',
      runId: 'obs_1',
      status: 'ok',
      payload: {
        ready_metric_count: 6,
        required_metric_count: 6,
      },
    })

    expect(state.exportInsert).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_6_capstone_report',
    })

    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-capstone-report-generation',
      status: 'ok',
    })
  })
})
