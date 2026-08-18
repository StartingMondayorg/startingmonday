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

describe('q4 cadence automation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.exportInsert = null
    state.obsInsert = null

    state.requireAutomationAccess.mockResolvedValue({
      ok: true,
      userId: 'user_1',
      supabase: { from: state.from },
    })

    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: { weekEnding: '2026-06-19' },
    })

    state.from.mockImplementation((table: string) => {
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

  it('creates cadence export and observability run', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/reporting/q4-cadence-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekEnding: '2026-06-19' }),
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      sprintKey: 'sprint_6_q4_operating_cadence',
      runId: 'obs_1',
      exportRunId: 'export_1',
      status: 'ok',
    })

    expect(state.exportInsert).toMatchObject({
      user_id: 'user_1',
      sprint_key: 'sprint_6_q4_operating_cadence',
    })

    expect(state.obsInsert).toMatchObject({
      user_id: 'user_1',
      job_name: 'emi-q4-cadence-automation',
      status: 'ok',
    })
  })
})
