import * as cheerio from 'cheerio'
import { safeFetch } from '../lib/safe-fetch.js'

// Common press room path patterns in order of likelihood
const PRESS_PATHS = [
  '/newsroom',
  '/press',
  '/press-releases',
  '/news',
  '/media',
  '/media-center',
  '/about/newsroom',
  '/company/news',
  '/company/press',
  '/investors/press-releases',
]

// URL patterns that indicate a press release link (not nav, not blog)
const PRESS_LINK_RE = /\/(press|newsroom|news|releases?|media|announcements?)\//i

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Returns up to 6 press release "articles" in the same shape as fetchCompanyNews.
// Uses plain fetch only — no Browserless credits for press room discovery.
export async function findPressRoomArticles(companyUrl) {
  const base = extractBase(companyUrl)
  if (!base) return []

  for (const path of PRESS_PATHS) {
    try {
      const url = `${base}${path}`
      // company_url is user-supplied: resolve, pin and re-check every
      // redirect (P1-5).
      const res = await safeFetch(url, {
        headers: BROWSER_HEADERS,
        timeoutMs: 8000,
        maxBytes: 5 * 1024 * 1024,
      })

      if (!res.ok || res.status === 404) continue

      const html = await res.text()
      if (html.length < 500) continue

      const links = extractPressLinks(html, base, url)
      if (links.length >= 2) {
        const { logger } = await import('../lib/logger.js')
        logger.info('fetch-press-room: found press room', { base, path, count: links.length })
        return links.slice(0, 6)
      }
    } catch {
      continue
    }
  }

  return []
}

function extractPressLinks(html, base, pageUrl) {
  const $ = cheerio.load(html)
  const seen = new Set()
  const links = []
  const pageBase = new URL(pageUrl)

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    const title = $(el).text().replace(/\s+/g, ' ').trim()

    if (!href || !title || title.length < 15 || title.length > 250) return

    let fullUrl
    try {
      fullUrl = href.startsWith('http')
        ? href
        : new URL(href, pageBase.origin).toString()
    } catch {
      return
    }

    // Must be same domain
    try {
      if (new URL(fullUrl).hostname !== pageBase.hostname) return
    } catch {
      return
    }

    if (seen.has(fullUrl)) return
    seen.add(fullUrl)

    // Must look like a press release URL
    if (!PRESS_LINK_RE.test(fullUrl)) return

    // Skip the index pages themselves
    const pathname = new URL(fullUrl).pathname
    if (PRESS_PATHS.some(p => pathname === p || pathname === p + '/')) return

    links.push({ title, link: fullUrl, pubDate: null, description: '' })
  })

  return links
}

function extractBase(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return `${u.protocol}//${u.hostname}`
  } catch {
    return ''
  }
}
