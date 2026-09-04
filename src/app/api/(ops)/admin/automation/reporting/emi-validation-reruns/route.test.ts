import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  insertedRow: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

type SnapshotFixture = {
  metric_name: string
  metric_value: number | null
  metric_status: 'ok' | 'no_data' | 'query_error' | 'insufficient_data'
  week_start: string
  week_end: string
  generated_at: string
  source_table: string
  source_notes: string
}

function snapshot(
  metricName: string,
  metricValue: number | null,
  metricStatus: SnapshotFixture['metric_status'] = 'ok',
  weekEnd = '2026-05-25',
): SnapshotFixture {
  return {
    metric_name: metricName,
    metric_value: metricValue,
    metric_status: metricStatus,
    week_start: '2026-05-19',
    week_end: weekEnd,
    generated_at: `${weekEnd}T01:00:00.000Z`,
    source_table: 'user_events',
    source_notes: '',
  }
}

const HEALTHY_SNAPSHOTS: SnapshotFixture[] = [
  snapshot('emi_language_adoption_percent', 33.33),
  snapshot('assessment_completion_percent', 100),
  snapshot('day7_return_percent', 8.33),
  snapshot('tier1_claim_compliance_percent', 100),
]

function mockTables(rows: SnapshotFixture[], runId: string) {
  state.from.mockImplementation((table: string) => {
    if (table === 'emi_kpi_snapshots') {
      const chain = {
        select: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(async () => ({ data: rows, error: null })),
      }
      return chain
    }

    if (table === 'scheduled_job_observability_runs') {
      const chain = {
        insert: vi.fn((payload: Record<string, unknown>) => {
          state.insertedRow = payload
          return chain
        }),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: { id: runId }, error: null })),
      }
      return chain
    }

    throw new Error(`Unexpected table: ${table}`)
  })
}

function postRequest() {
  return POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/emi-validation-reruns', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  }))
}

describe('emi validation reruns reporting route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.insertedRow = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: {},
    })

    mockTables(HEALTHY_SNAPSHOTS, 'run_2')
  })

  it('returns ok when every tracked metric reported this week', async () => {
    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_2',
      jobName: 'emi-production-validation-rerun',
      status: 'ok',
      nullStreakCount: 0,
      staleMetrics: [],
    })

    expect(state.insertedRow).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-production-validation-rerun',
      status: 'ok',
    })
  })

  it('does not flag a metric that is null for only one week', async () => {
    mockTables([
      snapshot('emi_language_adoption_percent', 33.33),
      snapshot('assessment_completion_percent', null, 'no_data'),
      snapshot('day7_return_percent', 8.33),
      snapshot('tier1_claim_compliance_percent', 100),
    ], 'run_3')

    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_3',
      status: 'ok',
      nullStreakCount: 0,
      staleMetrics: [],
    })
  })

  it('flags a metric that has been null for two consecutive weeks', async () => {
    mockTables([
      ...HEALTHY_SNAPSHOTS.filter((row) => row.metric_name !== 'assessment_completion_percent'),
      snapshot('assessment_completion_percent', null, 'no_data', '2026-05-25'),
      snapshot('assessment_completion_percent', null, 'no_data', '2026-05-18'),
    ], 'run_4')

    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_4',
      status: 'failed',
      nullStreakCount: 1,
      staleMetrics: ['assessment_completion_percent'],
    })

    expect(state.insertedRow).toMatchObject({
      job_name: 'emi-production-validation-rerun',
      status: 'failed',
    })
  })

  it('treats insufficient_data with a value as measured, not stale', async () => {
    mockTables([
      ...HEALTHY_SNAPSHOTS.filter((row) => row.metric_name !== 'day7_return_percent'),
      snapshot('day7_return_percent', 100, 'insufficient_data', '2026-05-25'),
      snapshot('day7_return_percent', 50, 'insufficient_data', '2026-05-18'),
    ], 'run_7')

    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'ok',
      nullStreakCount: 0,
      staleMetrics: [],
    })
  })

  it('does not compare values against a hardcoded baseline', async () => {
    // A metric moving far from its historical value is not a failure on its own.
    // Value-level regression detection was retired in SMK-444.
    mockTables([
      snapshot('emi_language_adoption_percent', 99.9),
      snapshot('assessment_completion_percent', 12),
      snapshot('day7_return_percent', 91.4),
      snapshot('tier1_claim_compliance_percent', 3),
    ], 'run_5')

    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'ok',
      nullStreakCount: 0,
    })
  })

  it('flags a metric missing from the snapshot table entirely', async () => {
    mockTables(
      HEALTHY_SNAPSHOTS.filter((row) => row.metric_name !== 'day7_return_percent'),
      'run_6',
    )

    const response = await postRequest()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'failed',
      nullStreakCount: 1,
      staleMetrics: ['day7_return_percent'],
    })
  })
})
