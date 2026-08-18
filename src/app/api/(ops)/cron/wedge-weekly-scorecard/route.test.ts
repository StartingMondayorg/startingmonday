import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  insertedRuns: [] as Array<Record<string, unknown>>,
  insertedAlerts: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/cron-auth', () => ({
  validateCronRequest: state.validateCronRequest,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      insert: async (payload: Record<string, unknown>) => {
        if (table === 'wedge_funnel_scorecard_cron_runs') {
          state.insertedRuns.push(payload)
        }
        if (table === 'automation_alerts') {
          state.insertedAlerts.push(payload)
        }
        return { error: null }
      },
    }),
  }),
}))

import { GET } from './route'

describe('wedge weekly scorecard cron route', () => {
  const originalFetch = global.fetch
  const originalAutomationToken = process.env.AUTOMATION_SERVICE_TOKEN
  const originalAutomationUserId = process.env.AUTOMATION_SERVICE_USER_ID

  beforeEach(() => {
    vi.resetAllMocks()
    state.insertedRuns = []
    state.insertedAlerts = []
    state.validateCronRequest.mockReturnValue(true)
    process.env.AUTOMATION_SERVICE_TOKEN = 'automation-token'
    process.env.AUTOMATION_SERVICE_USER_ID = 'automation-user'
  })

  it('persists weekly scorecard through POST and returns cadence summary', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, persisted: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          decision: { summary: 'iterate' },
          snapshot_history: [{ week_start: '2026-06-23' }],
        }),
      })

    global.fetch = fetchMock as unknown as typeof fetch

    const req = new NextRequest('https://startingmonday.app/api/cron/wedge-weekly-scorecard?lookbackDays=30')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const payload = await res.json() as Record<string, unknown>
    expect(payload.ok).toBe(true)
    expect((payload.cadence as Record<string, unknown>).decision_summary).toBe('iterate')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(state.insertedRuns).toHaveLength(1)
    expect(state.insertedRuns[0]?.success).toBe(true)
    expect(state.insertedRuns[0]?.error_code).toBeNull()
  })

  it('returns 500 and logs failed run when automation token is missing', async () => {
    process.env.AUTOMATION_SERVICE_TOKEN = ''

    const req = new NextRequest('https://startingmonday.app/api/cron/wedge-weekly-scorecard')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const payload = await res.json() as Record<string, unknown>
    expect(String(payload.error)).toContain('AUTOMATION_SERVICE_TOKEN')
    expect(state.insertedRuns).toHaveLength(1)
    expect(state.insertedRuns[0]?.success).toBe(false)
    expect(state.insertedRuns[0]?.error_code).toBe('missing_automation_service_token')
    expect(state.insertedAlerts).toHaveLength(1)
    expect(state.insertedAlerts[0]?.alert_code).toBe('wedge_weekly_scorecard_cron_failure')
    expect((state.insertedAlerts[0]?.details as Record<string, unknown>)?.error_code).toBe('missing_automation_service_token')
  })

  it('returns upstream status and logs persist failure error code when snapshot write fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'bad gateway', phase: 'persist' }),
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const req = new NextRequest('https://startingmonday.app/api/cron/wedge-weekly-scorecard?lookbackDays=30')
    const res = await GET(req)

    expect(res.status).toBe(502)
    const payload = await res.json() as Record<string, unknown>
    expect(String(payload.error)).toContain('Failed to persist wedge weekly snapshot')
    expect(state.insertedRuns).toHaveLength(1)
    expect(state.insertedRuns[0]?.success).toBe(false)
    expect(state.insertedRuns[0]?.error_code).toBe('persist_snapshot_failed')
    expect(state.insertedAlerts).toHaveLength(1)
    expect(state.insertedAlerts[0]?.alert_code).toBe('wedge_weekly_scorecard_cron_failure')
    expect((state.insertedAlerts[0]?.details as Record<string, unknown>)?.error_code).toBe('persist_snapshot_failed')
  })

  it('returns upstream status and logs readback failure error code when scorecard GET fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, persisted: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'service unavailable', phase: 'readback' }),
      })

    global.fetch = fetchMock as unknown as typeof fetch

    const req = new NextRequest('https://startingmonday.app/api/cron/wedge-weekly-scorecard?lookbackDays=30')
    const res = await GET(req)

    expect(res.status).toBe(503)
    const payload = await res.json() as Record<string, unknown>
    expect(String(payload.error)).toContain('Snapshot persisted, but scorecard readback failed')
    expect(state.insertedRuns).toHaveLength(1)
    expect(state.insertedRuns[0]?.success).toBe(false)
    expect(state.insertedRuns[0]?.error_code).toBe('scorecard_readback_failed')
    expect(state.insertedAlerts).toHaveLength(1)
    expect(state.insertedAlerts[0]?.alert_code).toBe('wedge_weekly_scorecard_cron_failure')
    expect((state.insertedAlerts[0]?.details as Record<string, unknown>)?.error_code).toBe('scorecard_readback_failed')
  })

  it('returns 403 when cron auth fails', async () => {
    state.validateCronRequest.mockReturnValue(false)

    const req = new NextRequest('https://startingmonday.app/api/cron/wedge-weekly-scorecard')
    const res = await GET(req)

    expect(res.status).toBe(403)
    expect(state.insertedRuns).toHaveLength(0)
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.AUTOMATION_SERVICE_TOKEN = originalAutomationToken
    process.env.AUTOMATION_SERVICE_USER_ID = originalAutomationUserId
  })
})
