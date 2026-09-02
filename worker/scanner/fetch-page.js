import { logger } from '../lib/logger.js'
import { createLimiter } from '../lib/concurrency.js'

const BROWSERLESS_BASE = 'https://production-sfo.browserless.io'
const BROWSERLESS_CONTENT_URL = `${BROWSERLESS_BASE}/chromium/content`
const BROWSERLESS_FUNCTION_URL = `${BROWSERLESS_BASE}/function`

// Render mode (SMK-489 item 1). 'innertext' (default) asks the browser for
// document.body.innerText via the /function API: browser-computed visible text
// with real line breaks, independent of markup minification and respecting CSS
// visibility. 'content' is the legacy /chromium/content serialized-DOM path,
// kept as a config rollback that needs no redeploy (WS2-15 kill behavior).
// Both endpoints bill the same way: one browser session per call.
export function renderMode() {
  return process.env.BROWSERLESS_RENDER_MODE === 'content' ? 'content' : 'innertext'
}

// Statuses that mean the /function endpoint itself is unavailable or rejected
// our code, not that the target page failed. Only these trigger the one-shot
// fallback to /chromium/content; a page-level failure would fail there too and
// falling back on it would double unit spend for nothing.
const FUNCTION_UNAVAILABLE_STATUSES = new Set([400, 404, 405, 501])

// browserless.io caps how many browsers may be open at once -- 10 on the
// Prototyping annual plan, 2 on the free plan we were on until 2026-08-20.
// Exceeding it returns 429 immediately, which is what produced 148 of the 152
// rate-limit errors in the 35 days before the upgrade.
//
// Every render in the worker funnels through this one limiter: scan-job,
// executive-scan-job and the /trigger-scan endpoint, which has no limiter of
// its own. Bounding here rather than per job means the ceiling holds however
// the cron schedule is arranged, and however many callers are added later.
//
// Default is deliberately conservative: an unset variable must never be able to
// exceed the smallest plan we might be on.
// Unparseable or unset falls back to the conservative default; an explicit
// number is honoured but never allowed below 1, which would stall every render.
// `|| 3` would have been wrong here: it treats an explicit 0 as unset.
const configuredConcurrency = Number.parseInt(process.env.BROWSERLESS_MAX_CONCURRENCY ?? '', 10)
export const MAX_RENDER_CONCURRENCY = Math.max(
  1,
  Number.isNaN(configuredConcurrency) ? 3 : configuredConcurrency,
)
const renderLimit = createLimiter(MAX_RENDER_CONCURRENCY)

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
// Returns { content, kind, via, renderMs }.
//   kind: 'html' (needs extractText) or 'text' (browser-computed visible text,
//         needs only normalizeText). SMK-489: the render path returns 'text'
//         by default so line structure comes from the browser, not from
//         whitespace that happened to survive in the markup.
//   via:  'direct_fetch' or 'render'; callers record it so render spend is
//         measurable (SMK-476). Only 'render' costs a browserless.io unit --
//         treating every scan as a render is what made the usage counter
//         meaningless.
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
        return { content: html, kind: 'html', via: 'direct_fetch', renderMs: null }
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

  // renderMs is measured inside the limiter so it records browser time, not
  // time spent queued. A browserless.io unit is 30s of browser time, so queue
  // wait must not inflate it.
  let renderMs = null
  const rendered = await renderLimit(async () => {
    const startedAt = Date.now()
    try {
      return await renderViaBrowserless(url, apiKey)
    } finally {
      renderMs = Date.now() - startedAt
    }
  })
  return { content: rendered.content, kind: rendered.kind, via: 'render', renderMs }
}

// Runs inside the render limiter. Prefers browser-computed innerText; falls
// back to serialized DOM only when the /function endpoint itself is
// unavailable (never on a page-level failure).
async function renderViaBrowserless(url, apiKey) {
  if (renderMode() === 'innertext') {
    const res = await fetch(`${BROWSERLESS_FUNCTION_URL}?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: INNER_TEXT_FUNCTION,
        context: { url },
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (BLOCKED_STATUSES.has(res.status)) {
      throw new BlockedError(url, res.status)
    }

    if (res.ok) {
      return { content: await res.text(), kind: 'text' }
    }

    const body = await res.text()
    if (!FUNCTION_UNAVAILABLE_STATUSES.has(res.status)) {
      throw new Error(`browserless.io function ${res.status}: ${body.slice(0, 200)}`)
    }
    logger.warn('fetch-page: /function unavailable, falling back to /chromium/content', {
      url, status: res.status, body: body.slice(0, 200),
    })
  }

  const res = await fetch(`${BROWSERLESS_CONTENT_URL}?token=${apiKey}`, {
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

  return { content: await res.text(), kind: 'html' }
}

// ESM module the browserless.io /function API executes in its own runtime.
// Returns document.body.innerText: real line breaks at block boundaries,
// hidden elements excluded, independent of markup minification.
const INNER_TEXT_FUNCTION = `
export default async function ({ page, context }) {
  await page.goto(context.url, { waitUntil: 'networkidle2', timeout: 25000 });
  const text = await page.evaluate(() => document.body ? document.body.innerText : '');
  return { data: text, type: 'text/plain' };
}
`
