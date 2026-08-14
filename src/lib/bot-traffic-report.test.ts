import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type BotTrafficSnapshot,
  evaluateBotTrafficAlerts,
  median,
  summarisePrefixes,
} from '@/lib/bot-traffic-report'

function snapshotOf(overrides: Partial<BotTrafficSnapshot> = {}): BotTrafficSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    totalRequests24h: 500,
    botRequests24h: 10,
    rateLimited24h: 2,
    botShare24h: 0.02,
    distinctPrefixes24h: 40,
    botRequests1h: 1,
    signupRateLimited1h: 0,
    botAllowedOnSignup1h: 0,
    baselineHourlyMedian: 2,
    hourly: [],
    topPrefixes: [],
    recentRejections: [],
    ...overrides,
  }
}

describe('evaluateBotTrafficAlerts', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('stays silent on ordinary traffic', () => {
    expect(evaluateBotTrafficAlerts(snapshotOf())).toEqual([])
  })

  it('fires high severity when a bot request reaches the signup handler', () => {
    const alerts = evaluateBotTrafficAlerts(snapshotOf({ botAllowedOnSignup1h: 3 }))

    expect(alerts).toHaveLength(1)
    expect(alerts[0].code).toBe('bot_signup_passed_guard')
    expect(alerts[0].severity).toBe('high')
  })

  it('does not fire a volume spike on small absolute numbers', () => {
    // 5x a baseline of 2 is 10, but the absolute floor of 50 must also be met.
    // Without the floor, 3 -> 15 requests would page someone.
    const alerts = evaluateBotTrafficAlerts(snapshotOf({ baselineHourlyMedian: 2, botRequests1h: 15 }))

    expect(alerts.map((alert) => alert.code)).not.toContain('bot_volume_spike')
  })

  it('fires a volume spike once both the floor and the multiple are exceeded', () => {
    const alerts = evaluateBotTrafficAlerts(snapshotOf({ baselineHourlyMedian: 2, botRequests1h: 120 }))

    expect(alerts.map((alert) => alert.code)).toContain('bot_volume_spike')
  })

  it('scales the spike threshold with the baseline as traffic grows', () => {
    // A busy but normal site: 200/hour baseline means 120 is unremarkable.
    const alerts = evaluateBotTrafficAlerts(snapshotOf({ baselineHourlyMedian: 200, botRequests1h: 120 }))

    expect(alerts.map((alert) => alert.code)).not.toContain('bot_volume_spike')
  })

  it('flags a single network concentrating requests', () => {
    const alerts = evaluateBotTrafficAlerts(snapshotOf({
      topPrefixes: [{
        ipPrefixHash: 'abc123',
        requests: 250,
        botRequests: 240,
        routes: ['/api/auth/verify-and-signup'],
        userAgent: 'curl/8.4.0',
        country: 'US',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      }],
    }))

    expect(alerts.map((alert) => alert.code)).toContain('bot_prefix_concentration')
  })

  it('requires both share and absolute volume for the trend alert', () => {
    const highShareLowVolume = evaluateBotTrafficAlerts(snapshotOf({
      totalRequests24h: 40,
      botRequests24h: 30,
      botShare24h: 0.75,
    }))
    expect(highShareLowVolume.map((alert) => alert.code)).not.toContain('bot_share_trend')

    const highShareHighVolume = evaluateBotTrafficAlerts(snapshotOf({
      totalRequests24h: 1000,
      botRequests24h: 400,
      botShare24h: 0.4,
    }))
    expect(highShareHighVolume.map((alert) => alert.code)).toContain('bot_share_trend')
  })

  it('reports signup rate limit pressure at low severity', () => {
    const alerts = evaluateBotTrafficAlerts(snapshotOf({ signupRateLimited1h: 25 }))

    const alert = alerts.find((entry) => entry.code === 'signup_rate_limit_pressure')
    expect(alert?.severity).toBe('low')
  })

  it('honours threshold overrides from the environment', () => {
    vi.stubEnv('BOT_ALERT_HOURLY_FLOOR', '5')
    vi.stubEnv('BOT_ALERT_BASELINE_MULTIPLE', '2')

    const alerts = evaluateBotTrafficAlerts(snapshotOf({ baselineHourlyMedian: 1, botRequests1h: 12 }))

    expect(alerts.map((alert) => alert.code)).toContain('bot_volume_spike')
  })
})

describe('median', () => {
  it('handles empty, odd and even collections', () => {
    expect(median([])).toBe(0)
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('summarisePrefixes', () => {
  const base = {
    rate_limit_key: 'signup',
    outcome: 'allowed',
    ua_class: 'scripted',
    country: 'US',
  }

  it('groups by network and ranks by bot volume', () => {
    const summaries = summarisePrefixes([
      { ...base, occurred_at: '2026-08-14T10:00:00Z', route: '/api/a', ip_prefix_hash: 'quiet', user_agent: 'ua', bot_score: 0 },
      { ...base, occurred_at: '2026-08-14T10:01:00Z', route: '/api/a', ip_prefix_hash: 'noisy', user_agent: 'curl', bot_score: 90 },
      { ...base, occurred_at: '2026-08-14T10:02:00Z', route: '/api/b', ip_prefix_hash: 'noisy', user_agent: 'curl', bot_score: 90 },
    ])

    expect(summaries[0].ipPrefixHash).toBe('noisy')
    expect(summaries[0].requests).toBe(2)
    expect(summaries[0].botRequests).toBe(2)
    expect(summaries[0].routes).toEqual(['/api/a', '/api/b'])
    expect(summaries[0].firstSeen).toBe('2026-08-14T10:01:00Z')
    expect(summaries[0].lastSeen).toBe('2026-08-14T10:02:00Z')
  })

  it('skips rows with no network hash', () => {
    const summaries = summarisePrefixes([
      { ...base, occurred_at: '2026-08-14T10:00:00Z', route: '/api/a', ip_prefix_hash: null, user_agent: 'ua', bot_score: 90 },
    ])

    expect(summaries).toEqual([])
  })
})
