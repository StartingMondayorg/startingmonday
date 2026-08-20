import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sendSlackMessage } = vi.hoisted(() => ({ sendSlackMessage: vi.fn() }))

vi.mock('@/lib/slack', () => ({ sendSlackMessage }))

import { buildAlertMessage, deliverBotAlert, getSlackTargets } from '@/lib/bot-detection/bot-alert-slack'
import type { BotTrafficAlert, BotTrafficSnapshot } from '@/lib/bot-detection/bot-traffic-report'

const snapshot: BotTrafficSnapshot = {
  generatedAt: '2026-08-14T10:00:00.000Z',
  totalRequests24h: 1000,
  botRequests24h: 400,
  rateLimited24h: 30,
  botShare24h: 0.4,
  distinctPrefixes24h: 12,
  botRequests1h: 220,
  signupRateLimited1h: 5,
  botAllowedOnSignup1h: 2,
  baselineHourlyMedian: 3,
  hourly: [],
  topPrefixes: [],
  recentRejections: [],
}

const alerts: BotTrafficAlert[] = [
  { code: 'bot_signup_passed_guard', severity: 'high', message: '2 bot requests reached signup', detail: 'The rate limiter did not turn these away.' },
]

describe('getSlackTargets', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is empty when unset', () => {
    expect(getSlackTargets()).toEqual([])
  })

  it('splits and trims a comma-separated list', () => {
    vi.stubEnv('BOT_ALERT_SLACK_TARGETS', ' U123 , D456 ,, C789 ')

    expect(getSlackTargets()).toEqual(['U123', 'D456', 'C789'])
  })
})

describe('buildAlertMessage', () => {
  it('leads with the alert and includes the dashboard link', () => {
    const text = buildAlertMessage(alerts, snapshot, 'https://startingmonday.app/dashboard/admin/operations/bot-traffic')

    expect(text).toContain('Bot traffic alert')
    expect(text).toContain('2 bot requests reached signup')
    expect(text).toContain('The rate limiter did not turn these away.')
    expect(text).toContain('https://startingmonday.app/dashboard/admin/operations/bot-traffic')
  })

  it('reports the volume and the baseline it is measured against', () => {
    const text = buildAlertMessage(alerts, snapshot, 'https://example.test')

    expect(text).toContain('220 suspected-bot requests')
    expect(text).toContain('400 of 1000 requests')
    expect(text).toContain('40%')
    expect(text).toContain('12 networks')
    expect(text).toContain('Baseline: 3')
  })

  it('says plainly that this is not an incident page', () => {
    const text = buildAlertMessage(alerts, snapshot, 'https://example.test')

    expect(text).toContain('Turnstile is intentionally paused')
  })
})

describe('deliverBotAlert', () => {
  beforeEach(() => {
    sendSlackMessage.mockReset()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  afterEach(() => vi.unstubAllEnvs())

  it('falls back to the shared channel when no targets are configured', async () => {
    sendSlackMessage.mockResolvedValue({ ok: true })

    const result = await deliverBotAlert('hello')

    expect(sendSlackMessage).toHaveBeenCalledWith({ text: 'hello' })
    expect(result).toEqual({ delivered: 1, errors: [] })
  })

  it('reports the fallback error rather than claiming delivery', async () => {
    sendSlackMessage.mockResolvedValue({ ok: false, error: 'Slack not configured' })

    const result = await deliverBotAlert('hello')

    expect(result.delivered).toBe(0)
    expect(result.errors).toEqual(['Slack not configured'])
  })

  it('fans out to each configured target', async () => {
    vi.stubEnv('BOT_ALERT_SLACK_TARGETS', 'U123,D456')
    vi.stubEnv('SLACK_BOT_TOKEN', 'xoxb-test')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    const result = await deliverBotAlert('hello')

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ delivered: 2, errors: [] })
    expect(sendSlackMessage).not.toHaveBeenCalled()
  })

  it('keeps delivering to the remaining targets when one fails', async () => {
    vi.stubEnv('BOT_ALERT_SLACK_TARGETS', 'U123,D456')
    vi.stubEnv('SLACK_BOT_TOKEN', 'xoxb-test')
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false, error: 'channel_not_found' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)

    const result = await deliverBotAlert('hello')

    expect(result.delivered).toBe(1)
    expect(result.errors[0]).toContain('U123')
  })

  it('records an error when no Slack token is configured', async () => {
    vi.stubEnv('BOT_ALERT_SLACK_TARGETS', 'U123')

    const result = await deliverBotAlert('hello')

    expect(result.delivered).toBe(0)
    expect(result.errors[0]).toContain('token not configured')
  })

  it('does not throw when the Slack call rejects', async () => {
    vi.stubEnv('BOT_ALERT_SLACK_TARGETS', 'U123')
    vi.stubEnv('SLACK_BOT_TOKEN', 'xoxb-test')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const result = await deliverBotAlert('hello')

    expect(result.delivered).toBe(0)
    expect(result.errors[0]).toContain('network down')
  })
})
