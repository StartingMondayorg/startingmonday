import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BotTrafficSnapshot } from '@/lib/bot-detection/bot-traffic-report'

const {
  validateCronRequest,
  getBotTrafficSnapshot,
  evaluateBotTrafficAlerts,
  deliverBotAlert,
  insert,
  upsert,
  maybeSingle,
  rpc,
} = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  getBotTrafficSnapshot: vi.fn(),
  evaluateBotTrafficAlerts: vi.fn(),
  deliverBotAlert: vi.fn(),
  insert: vi.fn(),
  upsert: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc,
    from: vi.fn(() => ({
      insert,
      upsert,
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
    })),
  })),
}))

vi.mock('@/lib/bot-detection/bot-traffic-report', () => ({ getBotTrafficSnapshot, evaluateBotTrafficAlerts }))

vi.mock('@/lib/bot-detection/bot-alert-slack', () => ({
  deliverBotAlert,
  buildAlertMessage: vi.fn(() => 'alert message'),
}))

import { GET } from './route'

const snapshot = {
  generatedAt: '2026-08-14T10:00:00.000Z',
  totalRequests24h: 100,
  botRequests24h: 5,
  rateLimited24h: 1,
  botShare24h: 0.05,
  distinctPrefixes24h: 8,
  botRequests1h: 2,
  signupRateLimited1h: 0,
  botAllowedOnSignup1h: 0,
  baselineHourlyMedian: 2,
  hourly: [],
  topPrefixes: [],
  recentRejections: [],
} satisfies BotTrafficSnapshot

const highAlert = {
  code: 'bot_volume_spike',
  severity: 'high' as const,
  message: 'spike',
  detail: 'detail',
}

function request(query = '') {
  return new NextRequest(`https://startingmonday.app/api/cron/bot-traffic-alert${query}`)
}

describe('GET /api/cron/bot-traffic-alert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateCronRequest.mockReturnValue(true)
    getBotTrafficSnapshot.mockResolvedValue(snapshot)
    evaluateBotTrafficAlerts.mockReturnValue([])
    deliverBotAlert.mockResolvedValue({ delivered: 1, errors: [] })
    insert.mockResolvedValue({ error: null })
    upsert.mockResolvedValue({ error: null })
    maybeSingle.mockResolvedValue({ data: null })
    rpc.mockResolvedValue({ data: 0 })
  })

  it('rejects an unauthenticated call', async () => {
    validateCronRequest.mockReturnValue(false)

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(getBotTrafficSnapshot).not.toHaveBeenCalled()
  })

  it('returns 500 rather than throwing when the snapshot query fails', async () => {
    getBotTrafficSnapshot.mockRejectedValue(new Error('relation does not exist'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await GET(request())

    expect(response.status).toBe(500)
  })

  it('stays quiet and still prunes when nothing is firing', async () => {
    const response = await GET(request())
    const body = await response.json()

    expect(body.alerted).toBe(false)
    expect(deliverBotAlert).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('prune_bot_signal_events', expect.objectContaining({ p_retain_days: 30 }))
  })

  it('delivers a firing alert and records it for the cooldown', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])

    const response = await GET(request())
    const body = await response.json()

    expect(body.alerted).toBe(true)
    expect(body.codes).toEqual(['bot_volume_spike'])
    expect(deliverBotAlert).toHaveBeenCalledWith('alert message')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ alert_key: 'bot_traffic:bot_volume_spike' }),
      expect.objectContaining({ onConflict: 'alert_key' }),
    )
  })

  it('writes every alert to automation_alerts for the Operations Hub', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])

    await GET(request())

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      source_table: 'bot_traffic_runs',
      alert_code: 'bot_volume_spike',
      severity: 'high',
    }))
  })

  it('suppresses a repeat inside the cooldown window but still logs it', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])
    maybeSingle.mockResolvedValue({ data: { last_stale_alert_at: new Date().toISOString() } })

    const response = await GET(request())
    const body = await response.json()

    expect(body.alerted).toBe(false)
    expect(body.suppressed).toEqual(['bot_volume_spike'])
    expect(deliverBotAlert).not.toHaveBeenCalled()
    // The Operations Hub must still see it even when Slack does not.
    expect(insert).toHaveBeenCalled()
  })

  it('re-alerts once the cooldown has elapsed', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])
    const longAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    maybeSingle.mockResolvedValue({ data: { last_stale_alert_at: longAgo } })

    const response = await GET(request())

    expect((await response.json()).alerted).toBe(true)
    expect(deliverBotAlert).toHaveBeenCalled()
  })

  it('does not record a cooldown when delivery failed', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])
    deliverBotAlert.mockResolvedValue({ delivered: 0, errors: ['Slack not configured'] })

    const response = await GET(request())
    const body = await response.json()

    expect(body.alerted).toBe(false)
    expect(body.errors).toEqual(['Slack not configured'])
    // Otherwise a failed send would silence the next six hours of alerts.
    expect(upsert).not.toHaveBeenCalled()
  })

  it('previews without sending, writing or pruning in dry run', async () => {
    evaluateBotTrafficAlerts.mockReturnValue([highAlert])

    const response = await GET(request('?dry_run=1'))
    const body = await response.json()

    expect(body.wouldAlert).toEqual(['bot_volume_spike'])
    expect(body.message).toBe('alert message')
    expect(deliverBotAlert).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
})
