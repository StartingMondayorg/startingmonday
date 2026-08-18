import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  insertedRun: null as Record<string, unknown> | null,
  upsertRows: null as Array<Record<string, unknown>> | null,
  claimRows: [
    {
      claim_key: 'claim_alpha',
      claim_text: 'Claim Alpha',
      status: 'active',
      metric_definition: 'example claim metric',
      denominator: 12,
      timeframe: 'trailing 30 days',
      confidence_label: 'high',
      source_artifact_path: 'docs/claim-alpha.md',
      audit_status: 'compliant',
      audit_notes: 'passed',
      audited_at: '2026-06-18T00:00:00.000Z',
      published_at: '2026-06-18T00:00:00.000Z',
      updated_at: '2026-06-18T00:00:00.000Z',
    },
  ],
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: (client: unknown) => client,
}))

import { GET, POST } from './route'

describe('tier1 claim compliance audit route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.insertedRun = null
    state.upsertRows = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: {
        claims: [
          {
            claimKey: 'claim_alpha',
            claimText: 'Claim Alpha',
            status: 'active',
            metricDefinition: 'example claim metric',
            denominator: 12,
            timeframe: 'trailing 30 days',
            confidenceLabel: 'high',
            sourceArtifactPath: 'docs/claim-alpha.md',
            auditStatus: 'compliant',
            auditNotes: 'passed',
            auditedAt: '2026-06-18T00:00:00.000Z',
            publishedAt: '2026-06-18T00:00:00.000Z',
          },
        ],
      },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'tier1_claims') {
        const listChain = {
          select: vi.fn(() => listChain),
          order: vi.fn(() => listChain),
          limit: vi.fn(async () => ({ data: state.claimRows, error: null })),
        }

        return {
          upsert: vi.fn((rows: Array<Record<string, unknown>>) => {
            state.upsertRows = rows
            return {
              select: vi.fn(async () => ({ data: state.claimRows, error: null })),
            }
          }),
          select: listChain.select,
          order: listChain.order,
          limit: listChain.limit,
        }
      }

      if (table === 'scheduled_job_observability_runs') {
        const chain = {
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.insertedRun = payload
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

  it('audits claims and records observability run', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/tier1-claim-compliance-audit', {
      method: 'POST',
      body: JSON.stringify({ claims: [] }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_1',
      jobName: 'tier1-claim-compliance-audit',
      status: 'ok',
      summary: {
        total: 1,
        active: 1,
        compliant: 1,
        nonCompliant: 0,
        pending: 0,
      },
    })

    expect(state.upsertRows).toMatchObject([
      {
        claim_key: 'claim_alpha',
        status: 'active',
        audit_status: 'compliant',
      },
    ])

    expect(state.insertedRun).toMatchObject({
      user_id: 'user_1',
      job_name: 'tier1-claim-compliance-audit',
      status: 'ok',
    })
  })

  it('lists audited claims via GET', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/tier1-claim-compliance-audit', {
      method: 'GET',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      summary: {
        total: 1,
        active: 1,
        compliant: 1,
        nonCompliant: 0,
        pending: 0,
      },
      claims: [
        {
          claim_key: 'claim_alpha',
          audit_status: 'compliant',
        },
      ],
    })
  })
})
