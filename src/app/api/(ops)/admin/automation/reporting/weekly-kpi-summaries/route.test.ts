/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  upsertedSnapshots: null as Array<Record<string, unknown>> | null,
  summaryInsert: null as Record<string, unknown> | null,
  tier1Calls: 0,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
}))

import { POST } from './route'

function countChain(result: { count: number | null; error?: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    not: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    then: (resolve: (value: unknown) => unknown) => resolve({ count: result.count, error: result.error ?? null }),
  }
  return chain
}

type FunnelFixture = { denominator: number; numerator: number }

function mockBackend(options: {
  adoption?: FunnelFixture | Error
  assessment?: FunnelFixture | Error
  day7?: { activated: number; returned: number } | Error
  tier1?: { active: number; compliant: number }
} = {}) {
  const adoption = options.adoption ?? { denominator: 25, numerator: 20 }
  const assessment = options.assessment ?? { denominator: 30, numerator: 12 }
  const day7 = options.day7 ?? { activated: 24, returned: 6 }
  const tier1 = options.tier1 ?? { active: 16, compliant: 16 }

  state.rpc.mockImplementation(async (fnName: string, args: Record<string, unknown>) => {
    if (fnName === 'emi_kpi_event_funnel') {
      const fixture = args.p_denominator_events === null ? adoption : assessment
      if (fixture instanceof Error) return { data: null, error: fixture }
      return { data: [fixture], error: null }
    }
    if (fnName === 'emi_kpi_day7_cohort') {
      if (day7 instanceof Error) return { data: null, error: day7 }
      return { data: [day7], error: null }
    }
    throw new Error(`Unexpected rpc: ${fnName}`)
  })

  state.from.mockImplementation((table: string) => {
    if (table === 'contacts') return countChain({ count: 4 })
    if (table === 'follow_ups') return countChain({ count: 2 })
    if (table === 'company_signals') return countChain({ count: 7 })

    if (table === 'tier1_claims') {
      state.tier1Calls += 1
      return state.tier1Calls === 1
        ? countChain({ count: tier1.active })
        : countChain({ count: tier1.compliant })
    }

    if (table === 'emi_kpi_snapshots') {
      return {
        upsert: vi.fn(async (rows: Array<Record<string, unknown>>) => {
          state.upsertedSnapshots = rows
          return { error: null }
        }),
      }
    }

    if (table === 'weekly_kpi_summary_runs') {
      const chain: any = {
        insert: vi.fn((payload: Record<string, unknown>) => {
          state.summaryInsert = payload
          return chain
        }),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: { id: 'run_1' }, error: null })),
      }
      return chain
    }

    throw new Error(`Unexpected table: ${table}`)
  })
}

function postRequest(referenceDate = '2026-07-22T12:00:00.000Z') {
  return POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/weekly-kpi-summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceDate }),
  }))
}

function snapshotByName(name: string): Record<string, unknown> {
  const row = (state.upsertedSnapshots ?? []).find((entry) => entry.metric_name === name)
  if (!row) throw new Error(`Snapshot missing: ${name}`)
  return row
}

describe('weekly kpi summaries route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.upsertedSnapshots = null
    state.summaryInsert = null
    state.tier1Calls = 0

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from, rpc: state.rpc },
    })

    mockBackend()
  })

  it('computes all metrics from server-side aggregates and snapshots exactly the four automated metrics', async () => {
    const response = await postRequest()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.weekStart).toBe('2026-07-20')
    expect(body.weekEnd).toBe('2026-07-26')

    const names = (state.upsertedSnapshots ?? []).map((row) => row.metric_name).sort()
    expect(names).toEqual([
      'assessment_completion_percent',
      'day7_return_percent',
      'emi_language_adoption_percent',
      'tier1_claim_compliance_percent',
    ])

    expect(snapshotByName('emi_language_adoption_percent')).toMatchObject({ metric_value: 80, metric_status: 'ok' })
    expect(snapshotByName('assessment_completion_percent')).toMatchObject({ metric_value: 40, metric_status: 'ok' })
    expect(snapshotByName('day7_return_percent')).toMatchObject({ metric_value: 25, metric_status: 'ok' })
    expect(snapshotByName('tier1_claim_compliance_percent')).toMatchObject({ metric_value: 100, metric_status: 'ok' })

    // Removed from automation per SMK-445 decision: tracked manually.
    expect(state.summaryInsert).not.toBeNull()
    const payload = (state.summaryInsert as any).summary_payload
    expect(payload).not.toHaveProperty('proof_assets_published_count')
    expect(payload).not.toHaveProperty('b2b_pilot_conversion_percent')
  })

  it('scores day-7 return against the fixed cohort week one week earlier', async () => {
    await postRequest('2026-07-22T12:00:00.000Z')

    const cohortCall = state.rpc.mock.calls.find(([fnName]) => fnName === 'emi_kpi_day7_cohort')
    expect(cohortCall).toBeDefined()
    expect(cohortCall?.[1]).toEqual({
      p_cohort_start: '2026-07-13T00:00:00.000Z',
      p_cohort_end: '2026-07-19T23:59:59.999Z',
    })

    const notes = String(snapshotByName('day7_return_percent').source_notes)
    expect(notes).toContain('cohort_start=2026-07-13')
    expect(notes).toContain('cohort_end=2026-07-19')
  })

  it('marks ratios under the sample floor as insufficient_data while keeping the computed value', async () => {
    mockBackend({ assessment: { denominator: 5, numerator: 5 } })

    await postRequest()

    expect(snapshotByName('assessment_completion_percent')).toMatchObject({
      metric_value: 100,
      metric_status: 'insufficient_data',
    })
    expect(String(snapshotByName('assessment_completion_percent').source_notes)).toContain('floor=20')
  })

  it('marks a zero denominator as no_data with a null value', async () => {
    mockBackend({ day7: { activated: 0, returned: 0 } })

    await postRequest()

    expect(snapshotByName('day7_return_percent')).toMatchObject({
      metric_value: null,
      metric_status: 'no_data',
    })
  })

  it('can never record a ratio above 100 percent', async () => {
    // The historical defect recorded 200.00 from baseline_users=2, adoption_users=4.
    mockBackend({ adoption: { denominator: 21, numerator: 42 } })

    await postRequest()

    expect(snapshotByName('emi_language_adoption_percent')).toMatchObject({
      metric_value: 100,
      metric_status: 'ok',
    })
  })

  it('records query_error when an aggregate RPC fails', async () => {
    mockBackend({ adoption: new Error('rpc unavailable') })

    await postRequest()

    expect(snapshotByName('emi_language_adoption_percent')).toMatchObject({
      metric_value: null,
      metric_status: 'query_error',
    })
    // Other metrics still compute.
    expect(snapshotByName('day7_return_percent')).toMatchObject({ metric_status: 'ok' })
  })
})
