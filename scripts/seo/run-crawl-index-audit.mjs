#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_BASE_URL = 'https://startingmonday.app'
const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_OUTPUT_DIR = 'tmp/seo'

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    sitemapUrl: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxUrls: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    if (arg === '--base-url' && next) {
      args.baseUrl = next
      i += 1
      continue
    }
    if (arg === '--sitemap-url' && next) {
      args.sitemapUrl = next
      i += 1
      continue
    }
    if (arg === '--output-dir' && next) {
      args.outputDir = next
      i += 1
      continue
    }
    if (arg === '--timeout-ms' && next) {
      args.timeoutMs = Number(next)
      i += 1
      continue
    }
    if (arg === '--max-urls' && next) {
      args.maxUrls = Number(next)
      i += 1
      continue
    }
  }

  if (!args.sitemapUrl) {
    args.sitemapUrl = `${args.baseUrl.replace(/\/$/, '')}/sitemap.xml`
  }

  return args
}

function stripCdata(value) {
  return value.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
}

function parseSitemapLocs(xml) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gsi)]
  return matches
    .map((match) => stripCdata(match[1]).trim())
    .filter(Boolean)
}

function csvEscape(value) {
  const raw = String(value ?? '')
  if (/[,"\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function toCsv(rows) {
  const headers = ['url', 'status', 'redirectLocation', 'contentType', 'contentLength', 'xRobotsTag', 'canonical', 'finalUrl', 'error']
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push([
      row.url,
      row.status,
      row.redirectLocation,
      row.contentType,
      row.contentLength,
      row.xRobotsTag,
      row.canonical,
      row.finalUrl,
      row.error,
    ].map(csvEscape).join(','))
  }
  return `${lines.join('\n')}\n`
}

function normalizeUrl(value) {
  try {
    const url = new URL(value)
    url.hash = ''
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString()
  } catch {
    return value
  }
}

function summarize(rows) {
  const byStatus = {}
  let redirectCount = 0
  let errorCount = 0
  let noindexCount = 0
  let missingCanonicalCount = 0
  let canonicalMismatchCount = 0

  for (const row of rows) {
    const key = String(row.status)
    byStatus[key] = (byStatus[key] || 0) + 1
    if (row.status >= 300 && row.status < 400) redirectCount += 1
    if (row.error) errorCount += 1
    if (/\bnoindex\b/i.test(row.xRobotsTag)) noindexCount += 1
    if (row.status >= 200 && row.status < 300 && row.contentType.includes('text/html')) {
      if (!row.canonical) missingCanonicalCount += 1
      else if (normalizeUrl(row.canonical) !== normalizeUrl(row.url)) canonicalMismatchCount += 1
    }
  }

  return {
    totalUrls: rows.length,
    byStatus,
    redirectCount,
    errorCount,
    noindexCount,
    missingCanonicalCount,
    canonicalMismatchCount,
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function checkUrl(url, timeoutMs) {
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', redirect: 'manual' }, timeoutMs)
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length') || ''
    const xRobotsTag = response.headers.get('x-robots-tag') || ''
    const redirectLocation = response.headers.get('location') || ''

    let canonical = ''
    if (contentType.includes('text/html') && response.status >= 200 && response.status < 300) {
      const html = await response.text()
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
      canonical = canonicalMatch?.[1] || ''
    }

    return {
      url,
      status: response.status,
      redirectLocation,
      contentType,
      contentLength,
      xRobotsTag,
      canonical,
      finalUrl: response.url,
      error: '',
    }
  } catch (error) {
    return {
      url,
      status: 0,
      redirectLocation: '',
      contentType: '',
      contentLength: '',
      xRobotsTag: '',
      canonical: '',
      finalUrl: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  const args = parseArgs(process.argv)

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error('--timeout-ms must be a positive number')
  }

  if (args.maxUrls !== null && (!Number.isFinite(args.maxUrls) || args.maxUrls <= 0)) {
    throw new Error('--max-urls must be a positive number when provided')
  }

  console.log(`SEO crawl audit: fetching sitemap ${args.sitemapUrl}`)
  const sitemapResponse = await fetchWithTimeout(args.sitemapUrl, { method: 'GET' }, args.timeoutMs)
  if (!sitemapResponse.ok) {
    throw new Error(`Failed to fetch sitemap (${sitemapResponse.status}) at ${args.sitemapUrl}`)
  }

  const xml = await sitemapResponse.text()
  let urls = parseSitemapLocs(xml)

  if (args.maxUrls !== null) {
    urls = urls.slice(0, args.maxUrls)
  }

  if (urls.length === 0) {
    throw new Error('No URLs found in sitemap')
  }

  console.log(`SEO crawl audit: checking ${urls.length} URL(s)`) 

  const rows = []
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i]
    const row = await checkUrl(url, args.timeoutMs)
    rows.push(row)

    if ((i + 1) % 25 === 0 || i === urls.length - 1) {
      console.log(`  Progress: ${i + 1}/${urls.length}`)
    }
  }

  const summary = summarize(rows)
  mkdirSync(args.outputDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const jsonPath = join(args.outputDir, `crawl-index-audit-${timestamp}.json`)
  const csvPath = join(args.outputDir, `crawl-index-audit-${timestamp}.csv`)
  const latestJsonPath = join(args.outputDir, 'crawl-index-audit.latest.json')
  const latestCsvPath = join(args.outputDir, 'crawl-index-audit.latest.csv')

  const payload = {
    generatedAt: new Date().toISOString(),
    sitemapUrl: args.sitemapUrl,
    baseUrl: args.baseUrl,
    timeoutMs: args.timeoutMs,
    totalUrls: rows.length,
    summary,
    rows,
  }

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
  writeFileSync(latestJsonPath, JSON.stringify(payload, null, 2))
  writeFileSync(csvPath, toCsv(rows))
  writeFileSync(latestCsvPath, toCsv(rows))

  console.log('SEO crawl audit complete')
  console.log(`  JSON:   ${jsonPath}`)
  console.log(`  CSV:    ${csvPath}`)
  console.log(`  Latest: ${latestJsonPath}`)
  console.log(`  Latest: ${latestCsvPath}`)
  console.log(`  Status summary: ${JSON.stringify(summary.byStatus)}`)

  const blockingIssues = summary.redirectCount
    + summary.errorCount
    + summary.noindexCount
    + summary.missingCanonicalCount
    + summary.canonicalMismatchCount
  if (blockingIssues > 0) {
    throw new Error(`Sitemap indexability gate failed: ${JSON.stringify({
      redirects: summary.redirectCount,
      errors: summary.errorCount,
      noindex: summary.noindexCount,
      missingCanonical: summary.missingCanonicalCount,
      canonicalMismatch: summary.canonicalMismatchCount,
    })}`)
  }
}

main().catch((error) => {
  console.error(`SEO crawl audit failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
