import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  from: vi.fn(),
  insertedRun: null as Record<string, unknown> | null,
  upsertRows: null as Array<Record<string, unknown>> | null,
  proofRows: [
    {
      asset_key: 'proof_asset_alpha',
      title: 'Proof Asset Alpha',
      status: 'published',
      metric_definition: 'example metric',
      denominator: 42,
      timeframe: 'trailing 30 days',
      confidence_label: 'high',
      source_artifact_path: 'docs/proof-alpha.md',
      query_owner: 'Data',
      extraction_date: '2026-06-18',
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

describe('proof asset publisher route', () => {
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
        assets: [
          {
            assetKey: 'proof_asset_alpha',
            title: 'Proof Asset Alpha',
            status: 'published',
            metricDefinition: 'example metric',
            denominator: 42,
            timeframe: 'trailing 30 days',
            confidenceLabel: 'high',
            sourceArtifactPath: 'docs/proof-alpha.md',
            queryOwner: 'Data',
            extractionDate: '2026-06-18',
            publishedAt: '2026-06-18T00:00:00.000Z',
          },
        ],
      },
    })

    state.from.mockImplementation((table: string) => {
      if (table === 'proof_assets') {
        const listChain = {
          select: vi.fn(() => listChain),
          order: vi.fn(() => listChain),
          limit: vi.fn(async () => ({ data: state.proofRows, error: null })),
        }

        return {
          upsert: vi.fn((rows: Array<Record<string, unknown>>) => {
            state.upsertRows = rows
            return {
              select: vi.fn(async () => ({ data: state.proofRows, error: null })),
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

  it('publishes proof assets and records observability run', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/proof-asset-publisher', {
      method: 'POST',
      body: JSON.stringify({ assets: [] }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      runId: 'run_1',
      jobName: 'proof-asset-publisher-workflow',
      status: 'ok',
      summary: {
        total: 1,
        published: 1,
        drafts: 0,
        archived: 0,
      },
    })

    expect(state.upsertRows).toMatchObject([
      {
        asset_key: 'proof_asset_alpha',
        status: 'published',
        published_at: '2026-06-18T00:00:00.000Z',
      },
    ])

    expect(state.insertedRun).toMatchObject({
      user_id: 'user_1',
      job_name: 'proof-asset-publisher-workflow',
      status: 'ok',
    })
  })

  it('lists proof assets via GET', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/proof-asset-publisher', {
      method: 'GET',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      summary: {
        total: 1,
        published: 1,
        drafts: 0,
        archived: 0,
      },
      assets: [
        {
          asset_key: 'proof_asset_alpha',
          status: 'published',
        },
      ],
    })
  })
})
