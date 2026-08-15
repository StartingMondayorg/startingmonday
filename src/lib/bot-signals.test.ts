import { describe, expect, it } from 'vitest'
import {
  BOT_SCORE_HIGH_CONFIDENCE,
  BOT_SCORE_THRESHOLD,
  classifyRequest,
  hashIp,
  hashIpPrefix,
  isSuspectedBot,
  toNetworkPrefix,
} from '@/lib/bot-signals'

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function headersOf(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value]))
  return { get: (name: string) => map.get(name.toLowerCase()) ?? null }
}

/** A well-formed request from a real browser submitting our signup form. */
function realBrowserPost(overrides: Record<string, string> = {}) {
  return headersOf({
    'user-agent': CHROME_UA,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'accept-language': 'en-US,en;q=0.9',
    origin: 'https://startingmonday.app',
    ...overrides,
  })
}

describe('classifyRequest', () => {
  it('does not flag a normal browser form submit', () => {
    const result = classifyRequest({ headers: realBrowserPost(), method: 'POST' })

    expect(result.uaClass).toBe('browser')
    expect(result.reasons).toEqual([])
    expect(isSuspectedBot(result.score)).toBe(false)
  })

  it('does not flag a normal browser GET without fetch metadata', () => {
    const result = classifyRequest({
      headers: headersOf({ 'user-agent': CHROME_UA, 'accept-language': 'en-GB' }),
      method: 'GET',
    })

    expect(isSuspectedBot(result.score)).toBe(false)
  })

  it('flags a request with no user agent', () => {
    const result = classifyRequest({ headers: headersOf({}), method: 'POST' })

    expect(result.uaClass).toBe('empty')
    expect(result.reasons).toContain('missing_user_agent')
    expect(result.score).toBeGreaterThanOrEqual(BOT_SCORE_HIGH_CONFIDENCE)
  })

  it('flags self-identifying scripted agents', () => {
    for (const agent of ['curl/8.4.0', 'python-requests/2.31.0', 'Go-http-client/1.1', 'axios/1.6.0']) {
      const result = classifyRequest({
        headers: headersOf({ 'user-agent': agent }),
        method: 'POST',
      })

      expect(result.uaClass, agent).toBe('scripted')
      expect(isSuspectedBot(result.score), agent).toBe(true)
    }
  })

  it('flags headless browser agents', () => {
    const result = classifyRequest({
      headers: headersOf({ 'user-agent': `${CHROME_UA} HeadlessChrome/126.0.0.0` }),
      method: 'POST',
    })

    expect(result.uaClass).toBe('scripted')
    expect(isSuspectedBot(result.score)).toBe(true)
  })

  it('flags a forged browser agent that omits fetch metadata on POST', () => {
    // The realistic attack: copy a Chrome UA string, miss the headers a real
    // Chrome would have sent. This is the case the UA check alone would miss.
    const result = classifyRequest({
      headers: headersOf({ 'user-agent': CHROME_UA }),
      method: 'POST',
    })

    expect(result.uaClass).toBe('browser')
    expect(result.reasons).toContain('missing_sec_fetch_site')
    expect(result.reasons).toContain('missing_accept_language')
    expect(result.reasons).toContain('missing_origin_and_referer')
    expect(isSuspectedBot(result.score)).toBe(true)
  })

  it('keeps benign crawlers below the alert threshold', () => {
    for (const agent of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'UptimeRobot/2.0',
    ]) {
      const result = classifyRequest({ headers: headersOf({ 'user-agent': agent }), method: 'GET' })

      expect(result.uaClass, agent).toBe('known_bot')
      expect(isSuspectedBot(result.score), agent).toBe(false)
    }
  })

  it('keeps a benign crawler below threshold even on a bare POST', () => {
    // Guards the cap: search engines and uptime monitors must never page us.
    const result = classifyRequest({
      headers: headersOf({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }),
      method: 'POST',
    })

    expect(isSuspectedBot(result.score)).toBe(false)
  })

  it('clamps the score to 0-100', () => {
    const result = classifyRequest({ headers: headersOf({}), method: 'POST' })

    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('treats header lookups case-insensitively', () => {
    const result = classifyRequest({
      headers: headersOf({ 'USER-AGENT': CHROME_UA, 'SEC-FETCH-SITE': 'same-origin', 'ACCEPT-LANGUAGE': 'en', ORIGIN: 'https://startingmonday.app' }),
      method: 'POST',
    })

    expect(result.uaClass).toBe('browser')
    expect(isSuspectedBot(result.score)).toBe(false)
  })
})

describe('toNetworkPrefix', () => {
  it('reduces IPv4 to a /24', () => {
    expect(toNetworkPrefix('203.0.113.42')).toBe('203.0.113.0/24')
  })

  it('reduces IPv6 to a /48', () => {
    expect(toNetworkPrefix('2001:db8:abcd:1234::1')).toBe('2001:db8:abcd::/48')
  })

  it('returns null for unusable values', () => {
    expect(toNetworkPrefix('unknown')).toBeNull()
    expect(toNetworkPrefix('')).toBeNull()
    expect(toNetworkPrefix('not-an-ip')).toBeNull()
    expect(toNetworkPrefix('10.0.0')).toBeNull()
  })
})

describe('ip hashing', () => {
  it('never returns the raw address', () => {
    const hashed = hashIp('203.0.113.42')

    expect(hashed).not.toBeNull()
    expect(hashed).not.toContain('203.0.113.42')
    expect(hashed).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is stable for the same address and distinct across addresses', () => {
    expect(hashIp('203.0.113.42')).toBe(hashIp('203.0.113.42'))
    expect(hashIp('203.0.113.42')).not.toBe(hashIp('203.0.113.43'))
  })

  it('groups addresses in the same subnet under one prefix hash', () => {
    expect(hashIpPrefix('203.0.113.42')).toBe(hashIpPrefix('203.0.113.99'))
    expect(hashIpPrefix('203.0.113.42')).not.toBe(hashIpPrefix('198.51.100.42'))
  })

  it('returns null when the address is unknown', () => {
    expect(hashIp('unknown')).toBeNull()
    expect(hashIpPrefix('unknown')).toBeNull()
  })
})

describe('thresholds', () => {
  it('orders the two confidence bands', () => {
    expect(BOT_SCORE_THRESHOLD).toBeLessThan(BOT_SCORE_HIGH_CONFIDENCE)
  })
})
