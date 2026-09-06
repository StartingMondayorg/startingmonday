import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  exportInsert: null as Record<string, unknown> | null,
  obsInsert: null as Record<string, unknown> | null,
  snapshotRows: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

function snapshot(metricName: string, metricValue: number | null, metricStatus = 'ok') {
  return { metric_name: metricName, metric_value: metricValue, metric_status: metricStatus, week_end: '2026-06-15', generated_at: '2026-06-15T01:00:00.000Z' }
}

describe('success criteria audit automation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.exportInsert = null
    state.obsInsert = null
    state.snapshotRows = [
      snapshot('emi_language_adoption_percent', 88),
      snapshot('assessment_completion_percent', 42),
      snapshot('day7_return_percent', 58),
    ]

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
            data: state.snapshotRows,
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

  function postRequest() {
    return POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/success-criteria-audit-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }))
  }

  it('scores the three automated criteria in advisory mode and logs the run', async () => {
    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      sprintKey: 'sprint_6_success_criteria_audit',
      exportRunId: 'export_1',
      runId: 'obs_1',
      status: 'ok',
      payload: {
        gate_mode: 'advisory',
        pass_count: 3,
        scored_count: 3,
        total_count: 3,
      },
    })

    expect(state.exportInsert).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_6_success_criteria_audit',
    })

    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-success-criteria-audit-automation',
      status: 'ok',
    })
  })

  it('no longer gates on the manually tracked seed-data metrics', async () => {
    const response = await postRequest()
    const body = await response.json()

    const metricNames = body.payload.criteria_results.map((row: { metric_name: string }) => row.metric_name)
    expect(metricNames).toEqual([
      'emi_language_adoption_percent',
      'assessment_completion_percent',
      'day7_return_percent',
    ])
  })

  it('excludes insufficient_data and missing metrics from scoring instead of failing them', async () => {
    state.snapshotRows = [
      snapshot('emi_language_adoption_percent', 100, 'insufficient_data'),
      snapshot('assessment_completion_percent', 42),
    ]

    const response = await postRequest()
    const body = await response.json()

    expect(body.status).toBe('ok')
    expect(body.payload).toMatchObject({ pass_count: 1, scored_count: 1, total_count: 3 })

    const byName = Object.fromEntries(body.payload.criteria_results.map((row: { metric_name: string }) => [row.metric_name, row]))
    expect(byName.emi_language_adoption_percent).toMatchObject({ scored: false, pass: null, not_scored_reason: 'insufficient_data' })
    expect(byName.assessment_completion_percent).toMatchObject({ scored: true, pass: true })
    expect(byName.day7_return_percent).toMatchObject({ scored: false, pass: null, not_scored_reason: 'missing' })
  })

  it('stays advisory even when every scored criterion misses its target', async () => {
    state.snapshotRows = [
      snapshot('emi_language_adoption_percent', 10),
      snapshot('assessment_completion_percent', 5),
      snapshot('day7_return_percent', 8),
    ]

    const response = await postRequest()
    const body = await response.json()

    expect(body.ok).toBe(true)
    expect(body.status).toBe('ok')
    expect(body.payload).toMatchObject({ pass_count: 0, scored_count: 3 })
    expect(state.obsInsert).toMatchObject({ status: 'ok' })
  })
})
