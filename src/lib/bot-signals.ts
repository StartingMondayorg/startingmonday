import { createHash } from 'crypto'
import { BENIGN_CRAWLER, SCRIPTED_USER_AGENT } from '@/lib/bot-user-agents'

// SMK-467: heuristic bot classification for public endpoint traffic.
//
// This module is deliberately pure and dependency-free. It is the piece we
// expect to tune most, and tuning is only safe when it is cheap to test.
// Nothing here blocks a request -- callers record the score and move on.

export type BotUaClass = 'browser' | 'known_bot' | 'scripted' | 'empty' | 'unknown'

export type BotSignalOutcome =
  | 'allowed'
  | 'rate_limited'
  | 'captcha_missing'
  | 'captcha_failed'
  | 'captcha_unavailable'

export type BotClassification = {
  uaClass: BotUaClass
  /** 0-100. 60 and above is treated as "suspected bot" by the dashboard and alerts. */
  score: number
  /** Names of the heuristics that matched, stored for explainability on the dashboard. */
  reasons: string[]
}

/** Score at or above which a request is counted as suspected-bot traffic. */
export const BOT_SCORE_THRESHOLD = 60

/**
 * Score at or above which we treat the request as near-certainly automated.
 * Used for the "a bot completed a signup" alert, where a false positive is
 * more costly because it would put captcha back on the roadmap without cause.
 */
export const BOT_SCORE_HIGH_CONFIDENCE = 80

function hashWithSalt(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}

function getSalt(): string {
  // Falls back to a constant so local dev and tests work without configuration.
  // In production BOT_SIGNAL_SALT must be set, otherwise the hashes are
  // reversible by anyone who knows the fallback.
  return process.env.BOT_SIGNAL_SALT?.trim() || 'bot-signal-dev-salt'
}

/**
 * Reduce an address to the network it belongs to, so a single actor rotating
 * through addresses in one subnet is still visible as one actor.
 * IPv4 -> /24, IPv6 -> /48.
 */
export function toNetworkPrefix(ip: string): string | null {
  const trimmed = ip.trim()
  if (!trimmed || trimmed === 'unknown') return null

  if (trimmed.includes(':')) {
    const groups = trimmed.split(':').filter(Boolean)
    if (groups.length < 3) return null
    return `${groups.slice(0, 3).join(':')}::/48`
  }

  const octets = trimmed.split('.')
  if (octets.length !== 4) return null
  if (octets.some((octet) => !/^\d{1,3}$/.test(octet))) return null
  return `${octets.slice(0, 3).join('.')}.0/24`
}

/** Salted hash of a client IP. Raw addresses are never persisted. */
export function hashIp(ip: string): string | null {
  if (!ip || ip === 'unknown') return null
  return hashWithSalt(ip, getSalt())
}

/** Salted hash of the IP's network prefix. */
export function hashIpPrefix(ip: string): string | null {
  const prefix = toNetworkPrefix(ip)
  if (!prefix) return null
  return hashWithSalt(prefix, getSalt())
}

type ClassifyInput = {
  /** Header lookup, case-insensitive. Pass `request.headers` directly. */
  headers: { get(name: string): string | null }
  method: string
}

/**
 * Classify a single request from its headers alone.
 *
 * Per-request signals only. Cross-request patterns (one subnet hammering an
 * auth route, one agent string across many networks) are computed by the alert
 * cron over the stored rows, because they cannot be seen from inside a single
 * request.
 */
export function classifyRequest(input: ClassifyInput): BotClassification {
  const { headers, method } = input
  const userAgent = headers.get('user-agent')?.trim() ?? ''
  const reasons: string[] = []
  let score = 0
  let uaClass: BotUaClass = 'unknown'

  if (!userAgent) {
    // Every real browser sends one. Its absence is the single strongest tell.
    reasons.push('missing_user_agent')
    score += 60
    uaClass = 'empty'
  } else if (BENIGN_CRAWLER.test(userAgent)) {
    // Recognised and unremarkable. Classified so it can be filtered out of the
    // dashboard rather than inflating the numbers that drive alerts.
    reasons.push('benign_crawler')
    uaClass = 'known_bot'
    score += 10
  } else if (SCRIPTED_USER_AGENT.test(userAgent)) {
    reasons.push('scripted_user_agent')
    uaClass = 'scripted'
    score += 50
  } else if (userAgent.length < 20) {
    // Real browser agent strings are long. A short one is usually hand-written.
    reasons.push('implausibly_short_user_agent')
    uaClass = 'scripted'
    score += 30
  } else {
    uaClass = 'browser'
  }

  const isStateChanging = method.toUpperCase() === 'POST'

  // Fetch metadata headers are sent by every current browser on a form submit
  // and are not trivially forged by someone who has not studied the target.
  // On routes only ever reached through our own UI, their absence is a strong
  // scripted-client signal -- stronger in practice than the agent string,
  // which is the first thing anyone fakes.
  if (isStateChanging && !headers.get('sec-fetch-site')) {
    reasons.push('missing_sec_fetch_site')
    score += 35
  }

  if (isStateChanging && !headers.get('sec-fetch-mode')) {
    reasons.push('missing_sec_fetch_mode')
    score += 10
  }

  if (!headers.get('accept-language')) {
    reasons.push('missing_accept_language')
    score += 20
  }

  if (isStateChanging && !headers.get('origin') && !headers.get('referer')) {
    reasons.push('missing_origin_and_referer')
    score += 25
  }

  // A recognised crawler that also trips the header heuristics is still just a
  // crawler. Cap it so search engines and uptime monitors cannot page us.
  if (uaClass === 'known_bot') {
    score = Math.min(score, 25)
  }

  return {
    uaClass,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}

export function isSuspectedBot(score: number): boolean {
  return score >= BOT_SCORE_THRESHOLD
}
