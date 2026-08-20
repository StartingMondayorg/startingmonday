import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  insertedRow: null as Record<string, unknown> | null,
  observabilityRow: null as Record<string, unknown> | null,
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { POST } from './route'

describe('sprint 5 exit metrics reporting route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.insertedRow = null
    state.observabilityRow = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: {
        freshnessSlaHours: 24,
        referenceDate: '2026-05-25',
        trailingDays: 30,
      },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'tier1_claims') {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { status: 'active', audit_status: 'compliant', metric_definition: 'm1', denominator: 12, timeframe: '30d', confidence_label: 'high' },
              { status: 'active', audit_status: 'compliant', metric_definition: 'm2', denominator: 12, timeframe: '30d', confidence_label: 'medium' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'scheduled_job_observability_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.observabilityRow = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'obs_1' }, error: null })),
          eq: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { status: 'ok', details: { freshness_hours: 8 }, created_at: '2026-05-25T10:00:00.000Z' },
              { status: 'ok', details: { freshness_hours: 10 }, created_at: '2026-05-24T10:00:00.000Z' },
              { status: 'late', details: { freshness_hours: 30 }, created_at: '2026-05-23T10:00:00.000Z' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'social_posts') {
        const chain = {
          select: vi.fn(() => chain),
          in: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { pillar: 'market_intel', is_posted: true, posted_at: '2026-05-20T10:00:00.000Z', like_count: 30, comment_count: 8, impression_count: 100, engagement_synced_at: '2026-05-20T12:00:00.000Z' },
              { pillar: 'user_story', is_posted: true, posted_at: '2026-05-21T10:00:00.000Z', like_count: 20, comment_count: 18, impression_count: 100, engagement_synced_at: '2026-05-21T12:00:00.000Z' },
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
              { id: 'p1', stage: 'closed_won' },
              { id: 'p2', stage: 'proposal_sent' },
              { id: 'p3', stage: 'closed_lost' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'b2b_materials') {
        const chain = {
          select: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              { prospect_id: 'p1', created_at: '2026-05-20T09:00:00.000Z' },
              { prospect_id: 'p2', created_at: '2026-05-19T09:00:00.000Z' },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'emi_sprint_export_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.insertedRow = payload
            return chain
          }),
          select: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: { id: 'run_1' }, error: null })),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('computes and persists sprint 5 export metrics from runtime sources', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/sprint-5-exit-metrics', {
      method: 'POST',
      body: JSON.stringify({ referenceDate: '2026-05-25', trailingDays: 30, freshnessSlaHours: 24 }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_1',
      observabilityRunId: 'obs_1',
      sprintKey: 'sprint_5_benchmark_and_proof_system',
      exportPayload: {
        values: {
          tier1_claim_compliance_percent: 100,
          benchmark_freshness_sla_attainment_percent: 66.67,
          proof_asset_engagement_rate_percent: 38,
          proposal_acceptance_after_proof_exposure_percent: 50,
        },
      },
    })

    expect(state.insertedRow).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_5_benchmark_and_proof_system',
    })

    expect(state.observabilityRow).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-sprint-5-exit-metrics-export',
      status: 'ok',
    })

    expect((state.insertedRow as { export_payload: { metrics: Array<{ metric_name: string; metric_status: string }> } }).export_payload.metrics).toEqual([
      expect.objectContaining({ metric_name: 'tier1_claim_compliance_percent', metric_status: 'ok' }),
      expect.objectContaining({ metric_name: 'benchmark_freshness_sla_attainment_percent', metric_status: 'ok' }),
      expect.objectContaining({ metric_name: 'proof_asset_engagement_rate_percent', metric_status: 'ok' }),
      expect.objectContaining({ metric_name: 'proposal_acceptance_after_proof_exposure_percent', metric_status: 'ok' }),
    ])
  })
})