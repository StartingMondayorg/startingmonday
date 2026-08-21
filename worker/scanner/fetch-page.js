import { logger } from '../lib/logger.js'

const BROWSERLESS_URL = 'https://production-sfo.browserless.io/chromium/content'

// Block private/internal addresses to prevent SSRF attacks.
function isAllowedUrl(urlStr) {
  try {
    const url = new URL(urlStr)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const h = url.hostname.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
    if (/^10\./.test(h)) return false
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false
    if (/^192\.168\./.test(h)) return false
    if (h === '169.254.169.254') return false // cloud metadata endpoints
    return true
  } catch {
    return false
  }
}

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const BROWSER_HEADERS = {
  'User-Agent': CHROME_UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
}

// Career boards on these hosts render listings client-side (JS SPAs). A plain fetch
// returns an app shell with no job text, so always route them through browserless.io.
const SPA_HOSTS = [
  'bamboohr.com', 'lever.co', 'myworkdayjobs.com', 'ashbyhq.com', 'rippling.com',
  'smartrecruiters.com', 'workforcenow.adp.com', 'saashr.com', 'icims.com',
  'ultipro.com', 'jobvite.com', 'applytojob.com', 'workable.com',
]

// Minimum visible (non-markup) text for a plain-fetch page to be trusted as rendered.
const MIN_VISIBLE_TEXT = 800

export function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase() } catch { return '' }
}

export function isSpaHost(url) {
  const h = hostOf(url)
  return SPA_HOSTS.some((s) => h === s || h.endsWith(`.${s}`))
}

// Strip scripts/styles/tags/entities and return the length of the residual visible text.
// Raw HTML length is misleading for SPAs: their shell ships large inline scripts but
// almost no rendered text, so length alone reads as "substantial" while it is empty.
export function visibleTextLength(html) {
  if (typeof html !== 'string') return 0
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length
}

// Sites that actively block bots — 403 from these means don't bother retrying.
const BLOCKED_STATUSES = new Set([401, 403, 451])

export class BlockedError extends Error {
  constructor(url, status) {
    super(`Site blocked access (HTTP ${status}) — ${url}`)
    this.blocked = true
    this.status = status
  }
}

// Fetch a career page. Strategy:
// 1. Plain fetch with browser-like headers — fast, free, works on many static pages.
//    If it 403s, the site is actively blocking bots — no point trying browserless.io.
//    If it returns substantial content, use it and skip the browserless.io credit.
// 2. browserless.io (JS-rendered) — for SPA career pages or when plain fetch returns sparse HTML.
//
// Returns { html, via, renderMs }. `via` is 'direct_fetch' or 'render'; callers
// record it so render spend is measurable (SMK-476). Only 'render' costs a
// browserless.io unit — treating every scan as a render is what made the usage
// counter meaningless.
export async function fetchPage(url) {
  if (!isAllowedUrl(url)) {
    throw new Error(`fetchPage: blocked URL — ${url}`)
  }

  const apiKey = process.env.BROWSERLESS_API_KEY

  // Step 1: plain fetch
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })

    if (BLOCKED_STATUSES.has(res.status)) {
      throw new BlockedError(url, res.status)
    }

    if (res.ok) {
      const html = await res.text()
      // Trust the plain-fetch HTML only when it is NOT a known JS-SPA host and it
      // carries enough *visible* text. A large shell with no rendered jobs must still
      // escalate to browserless.io (raw length alone would wrongly accept it).
      if (!isSpaHost(url) && visibleTextLength(html) >= MIN_VISIBLE_TEXT) {
        logger.info('fetch-page: plain fetch used', { url, htmlLength: html.length })
        return { html, via: 'direct_fetch', renderMs: null }
      }
      logger.info('fetch-page: shell/SPA detected, escalating to browserless', {
        url, host: hostOf(url), htmlLength: html.length, visibleText: visibleTextLength(html),
      })
    }
    // Got 2xx but a JS shell / sparse content — fall through to browserless.io.
  } catch (err) {
    if (err.blocked) throw err  // BlockedError: propagate immediately, skip browserless.io
    // Other error (timeout, ENOTFOUND, etc.) — try browserless.io
    logger.warn('fetch-page: plain fetch failed, trying browserless', { url, error: err.message })
  }

  // Step 2: browserless.io
  if (!apiKey) {
    logger.warn('fetch-page: browserless key missing', { url })
    throw new Error('No BROWSERLESS_API_KEY configured')
  }

  const startedAt = Date.now()
  const html = await fetchViaBrowserless(url, apiKey)
  return { html, via: 'render', renderMs: Date.now() - startedAt }
}

async function fetchViaBrowserless(url, apiKey) {
  const res = await fetch(`${BROWSERLESS_URL}?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout: 25000 },
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (BLOCKED_STATUSES.has(res.status)) {
    throw new BlockedError(url, res.status)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`browserless.io ${res.status}: ${body.slice(0, 200)}`)
  }

  return res.text()
}
