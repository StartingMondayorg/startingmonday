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

describe('benchmark pipeline run logs reporting route', () => {
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
      body: { freshnessSlaHours: 24 },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'proof_assets') {
        const chain = {
          select: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                asset_key: 'proof_1',
                status: 'published',
                metric_definition: 'pipeline coverage',
                denominator: 12,
                timeframe: '30d',
                confidence_label: 'high',
                extraction_date: '2020-01-01',
              },
            ],
            error: null,
          })),
        }
        return chain
      }

      if (table === 'tier1_claims') {
        const chain = {
          select: vi.fn(() => chain),
          limit: vi.fn(async () => ({
            data: [
              {
                claim_key: 'claim_1',
                status: 'active',
                metric_definition: 'claim definition',
                denominator: 5,
                timeframe: '30d',
                confidence_label: 'high',
                audit_status: 'compliant',
              },
            ],
            error: null,
          })),
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
          single: vi.fn(async () => ({ data: { id: 'run_1' }, error: null })),
        }
        return chain
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('returns late when benchmark freshness is older than SLA and records run details', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/benchmark-pipeline-run-logs', {
      method: 'POST',
      body: JSON.stringify({ freshnessSlaHours: 24 }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_1',
      jobName: 'emi-benchmark-pipeline',
      status: 'late',
      details: {
        published_proof_assets: 1,
        active_tier1_claims: 1,
        invalid_proof_asset_count: 0,
        invalid_claim_count: 0,
      },
    })

    expect(state.insertedRow).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-benchmark-pipeline',
      status: 'late',
    })
  })
})
