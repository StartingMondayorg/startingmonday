import { BOT_SCORE_HIGH_CONFIDENCE, BOT_SCORE_THRESHOLD } from '@/lib/bot-signals'

// SMK-467: one source of truth for bot traffic numbers.
//
// The dashboard and the alert cron both read through here on purpose. A metric
// that disagrees with the alert that fired on it is worse than no metric.

export type HourlyBucket = {
  bucket: string
  totalRequests: number
  botRequests: number
  rateLimited: number
}

export type PrefixSummary = {
  ipPrefixHash: string
  requests: number
  botRequests: number
  routes: string[]
  userAgent: string | null
  country: string | null
  firstSeen: string
  lastSeen: string
}

export type BotTrafficSnapshot = {
  generatedAt: string
  /** Rolling 24h totals. */
  totalRequests24h: number
  botRequests24h: number
  rateLimited24h: number
  botShare24h: number
  distinctPrefixes24h: number
  /** Rolling 1h totals, used by the alert thresholds. */
  botRequests1h: number
  signupRateLimited1h: number
  /**
   * High-confidence bot requests on the signup route that the guard let
   * through in the last hour. Not proof an account was created -- the guard
   * runs before the handler -- but it is the closest signal we have and the
   * one that would justify revisiting captcha.
   */
  botAllowedOnSignup1h: number
  /** Median suspected-bot requests per hour over the trailing 7 days. */
  baselineHourlyMedian: number
  hourly: HourlyBucket[]
  topPrefixes: PrefixSummary[]
  recentRejections: Array<{
    occurredAt: string
    route: string
    outcome: string
    userAgent: string | null
    botScore: number
    country: string | null
  }>
}

export type BotTrafficAlert = {
  code: string
  severity: 'high' | 'medium' | 'low'
  message: string
  detail: string
}

type EventRow = {
  occurred_at: string
  route: string
  rate_limit_key: string
  ip_prefix_hash: string | null
  outcome: string
  user_agent: string | null
  ua_class: string
  bot_score: number
  country: string | null
}

type RollupRow = {
  bucket: string
  total_requests: number | string
  bot_requests: number | string
  rate_limited: number | string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseClient = {
  from: (table: string) => any
  rpc: (fn: string, args?: Record<string, unknown>) => any
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const SIGNUP_RATE_LIMIT_KEY = 'signup'

function toNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? Number(parsed) : 0
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function summarisePrefixes(rows: EventRow[], limit = 10): PrefixSummary[] {
  const byPrefix = new Map<string, PrefixSummary>()

  for (const row of rows) {
    if (!row.ip_prefix_hash) continue
    const existing = byPrefix.get(row.ip_prefix_hash)

    if (!existing) {
      byPrefix.set(row.ip_prefix_hash, {
        ipPrefixHash: row.ip_prefix_hash,
        requests: 1,
        botRequests: row.bot_score >= BOT_SCORE_THRESHOLD ? 1 : 0,
        routes: [row.route],
        userAgent: row.user_agent,
        country: row.country,
        firstSeen: row.occurred_at,
        lastSeen: row.occurred_at,
      })
      continue
    }

    existing.requests += 1
    if (row.bot_score >= BOT_SCORE_THRESHOLD) existing.botRequests += 1
    if (!existing.routes.includes(row.route)) existing.routes.push(row.route)
    if (row.occurred_at < existing.firstSeen) existing.firstSeen = row.occurred_at
    if (row.occurred_at > existing.lastSeen) existing.lastSeen = row.occurred_at
  }

  return [...byPrefix.values()]
    .sort((a, b) => b.botRequests - a.botRequests || b.requests - a.requests)
    .slice(0, limit)
}

/**
 * Thresholds are baseline-relative with an absolute floor. A pure multiplier
 * fires when traffic goes from 3 to 15; a pure absolute number goes stale as
 * the product grows. Both conditions must hold.
 */
export function evaluateBotTrafficAlerts(snapshot: BotTrafficSnapshot): BotTrafficAlert[] {
  const alerts: BotTrafficAlert[] = []

  const spikeFloor = Number(process.env.BOT_ALERT_HOURLY_FLOOR ?? '50')
  const spikeMultiple = Number(process.env.BOT_ALERT_BASELINE_MULTIPLE ?? '5')
  const spikeThreshold = Math.max(spikeFloor, snapshot.baselineHourlyMedian * spikeMultiple)

  if (snapshot.botAllowedOnSignup1h > 0) {
    alerts.push({
      code: 'bot_signup_passed_guard',
      severity: 'high',
      message: `${snapshot.botAllowedOnSignup1h} high-confidence bot request(s) reached the signup handler in the last hour`,
      detail: 'The rate limiter did not turn these away. This is the condition that would justify revisiting captcha.',
    })
  }

  if (snapshot.botRequests1h > spikeThreshold) {
    alerts.push({
      code: 'bot_volume_spike',
      severity: 'high',
      message: `${snapshot.botRequests1h} suspected-bot requests in the last hour (threshold ${Math.round(spikeThreshold)})`,
      detail: `Trailing 7-day baseline is ${snapshot.baselineHourlyMedian} per hour.`,
    })
  }

  const concentrationThreshold = Number(process.env.BOT_ALERT_PREFIX_HOURLY ?? '100')
  const worstPrefix = snapshot.topPrefixes[0]
  if (worstPrefix && worstPrefix.requests > concentrationThreshold) {
    alerts.push({
      code: 'bot_prefix_concentration',
      severity: 'medium',
      message: `One network sent ${worstPrefix.requests} requests in the last hour`,
      detail: `Routes: ${worstPrefix.routes.join(', ')}. Usually a broken integration or a scanner rather than a campaign.`,
    })
  }

  if (snapshot.botShare24h > 0.25 && snapshot.botRequests24h > 200) {
    alerts.push({
      code: 'bot_share_trend',
      severity: 'medium',
      message: `Suspected-bot traffic is ${Math.round(snapshot.botShare24h * 100)}% of public requests over 24h`,
      detail: `${snapshot.botRequests24h} of ${snapshot.totalRequests24h} requests. Trend worth watching, not an incident.`,
    })
  }

  if (snapshot.signupRateLimited1h > 20) {
    alerts.push({
      code: 'signup_rate_limit_pressure',
      severity: 'low',
      message: `${snapshot.signupRateLimited1h} signup requests were rate limited in the last hour`,
      detail: 'The limiter is doing its job. Logged for the record.',
    })
  }

  return alerts
}

export async function getBotTrafficSnapshot(client: LooseClient): Promise<BotTrafficSnapshot> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [rollupResult, lastHourResult, dayResult, rejectionsResult] = await Promise.all([
    client.rpc('bot_signal_hourly_rollup', { p_hours: 168 }),
    client
      .from('bot_signal_events')
      .select('occurred_at, route, rate_limit_key, ip_prefix_hash, outcome, user_agent, ua_class, bot_score, country')
      .gte('occurred_at', oneHourAgo)
      .order('occurred_at', { ascending: false })
      .limit(5000),
    client
      .from('bot_signal_events')
      .select('ip_prefix_hash, bot_score, outcome')
      .gte('occurred_at', dayAgo)
      .limit(50000),
    client
      .from('bot_signal_events')
      .select('occurred_at, route, outcome, user_agent, bot_score, country')
      .neq('outcome', 'allowed')
      .order('occurred_at', { ascending: false })
      .limit(25),
  ])

  const rollupRows = (rollupResult?.data ?? []) as RollupRow[]
  const hourly: HourlyBucket[] = rollupRows.map((row) => ({
    bucket: row.bucket,
    totalRequests: toNumber(row.total_requests),
    botRequests: toNumber(row.bot_requests),
    rateLimited: toNumber(row.rate_limited),
  }))

  // Exclude the in-progress hour, which is always partial and would drag the
  // baseline down.
  const currentHour = new Date(now).setMinutes(0, 0, 0)
  const completedHours = hourly.filter((bucket) => new Date(bucket.bucket).getTime() < currentHour)
  const baselineHourlyMedian = median(completedHours.map((bucket) => bucket.botRequests))

  const lastHourRows = (lastHourResult?.data ?? []) as EventRow[]
  const dayRows = (dayResult?.data ?? []) as Array<Pick<EventRow, 'ip_prefix_hash' | 'bot_score' | 'outcome'>>

  const totalRequests24h = dayRows.length
  const botRequests24h = dayRows.filter((row) => row.bot_score >= BOT_SCORE_THRESHOLD).length
  const rateLimited24h = dayRows.filter((row) => row.outcome === 'rate_limited').length
  const distinctPrefixes24h = new Set(
    dayRows.map((row) => row.ip_prefix_hash).filter((value): value is string => Boolean(value)),
  ).size

  return {
    generatedAt: now.toISOString(),
    totalRequests24h,
    botRequests24h,
    rateLimited24h,
    botShare24h: totalRequests24h === 0 ? 0 : botRequests24h / totalRequests24h,
    distinctPrefixes24h,
    botRequests1h: lastHourRows.filter((row) => row.bot_score >= BOT_SCORE_THRESHOLD).length,
    signupRateLimited1h: lastHourRows.filter(
      (row) => row.outcome === 'rate_limited' && row.rate_limit_key === SIGNUP_RATE_LIMIT_KEY,
    ).length,
    botAllowedOnSignup1h: lastHourRows.filter(
      (row) =>
        row.rate_limit_key === SIGNUP_RATE_LIMIT_KEY
        && row.outcome === 'allowed'
        && row.bot_score >= BOT_SCORE_HIGH_CONFIDENCE,
    ).length,
    baselineHourlyMedian,
    hourly,
    topPrefixes: summarisePrefixes(lastHourRows),
    recentRejections: ((rejectionsResult?.data ?? []) as EventRow[]).map((row) => ({
      occurredAt: row.occurred_at,
      route: row.route,
      outcome: row.outcome,
      userAgent: row.user_agent,
      botScore: row.bot_score,
      country: row.country,
    })),
  }
}
