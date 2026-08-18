import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  exportInsert: null as Record<string, unknown> | null,
  obsInsert: null as Record<string, unknown> | null,
  alertInsert: null as Record<string, unknown>[] | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

describe('top10 objection kpi dashboard route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.exportInsert = null
    state.obsInsert = null
    state.alertInsert = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: { referenceDate: '2026-06-19T00:00:00.000Z' },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'emi_kpi_snapshots') {
        const chain = {
          select: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                metric_name: 'assessment_completion_percent',
                metric_value: 63,
                metric_status: 'ok',
                week_end: '2026-06-15',
                generated_at: '2026-06-19T00:00:00.000Z',
              },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'automation_alerts') {
        return {
          insert: vi.fn((payload: Record<string, unknown>[]) => {
            state.alertInsert = payload
            return Promise.resolve({ data: null, error: null })
          }),
        }
      }

      if (table === 'emi_sprint_export_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.exportInsert = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'export_501' }, error: null })),
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
          single: vi.fn(async () => ({ data: { id: 'obs_501' }, error: null })),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('creates objection KPI export, observability run, and owner alerts', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/top10-objection-kpi-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      sprintKey: 'sprint_6_top10_objection_kpi_dashboard',
      exportRunId: 'export_501',
      runId: 'obs_501',
      status: 'late',
    })

    expect(state.exportInsert).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_6_top10_objection_kpi_dashboard',
    })

    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-top10-objection-kpi-dashboard',
      status: 'late',
    })

    expect(state.alertInsert).toBeTruthy()
    expect(state.alertInsert?.length).toBeGreaterThan(0)
  })
})