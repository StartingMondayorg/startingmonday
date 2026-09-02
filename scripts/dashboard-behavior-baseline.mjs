#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { postSlackText, writeLatestReportFiles } from './lib/agent-report-kit.mjs'

function parseArgs(argv) {
  const args = { report: 'docs/status/dashboard-behavior.latest.json' }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--base-url') args.baseUrl = argv[i + 1]
    if (token === '--report') args.report = argv[i + 1]
  }
  return args
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeRoute(href) {
  if (!href || !href.startsWith('/dashboard')) return null
  const noHash = href.split('#')[0]
  const noQuery = noHash.split('?')[0]
  return noQuery.replace(/\/$/, '') || '/dashboard'
}

async function waitForBriefingSettled(page) {
  const startedAt = Date.now()
  await Promise.race([
    page.locator('#tenet-find-roles').first().waitFor({ state: 'visible', timeout: 20000 }),
    page.locator('text=Fallback briefing from live data').first().waitFor({ state: 'visible', timeout: 20000 }),
    page.locator('text=Nothing urgent is pulling at the search today').first().waitFor({ state: 'visible', timeout: 20000 }),
  ])
  return Date.now() - startedAt
}

// The signals filter bar renders shadcn/Base UI Select components (PR #426),
// not native <select> elements, so `select[name=...] option` never matches.
// The trigger is a combobox named by its aria-label; opening it renders the
// options (including the leading "All ..." item, matching the old native
// option count) into a popup listbox.
async function countFilterOptions(page, triggerLabel) {
  const trigger = page.getByRole('combobox', { name: triggerLabel }).first()
  try {
    await trigger.waitFor({ state: 'visible', timeout: 10000 })
    await trigger.click()
    const options = page.getByRole('option')
    await options.first().waitFor({ state: 'visible', timeout: 5000 })
    const count = await options.count()
    await page.keyboard.press('Escape')
    await options.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => null)
    return count
  } catch {
    await page.keyboard.press('Escape').catch(() => null)
    return 0
  }
}

async function measureRoute(page, route) {
  const startedAt = Date.now()
  const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const loadMs = Date.now() - startedAt
  const status = response?.status() ?? 0

  const result = {
    route,
    status,
    loadMs,
    settledMs: null,
    signalsCompanyOptions: null,
    signalsTypeOptions: null,
    hasRunSignalsButton: null,
  }

  await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 })

  if (route === '/dashboard/briefing') {
    result.settledMs = await waitForBriefingSettled(page)
  }

  if (route === '/dashboard/signals') {
    const runButtonVisible = await page.getByRole('button', { name: /Run signal scan now/i }).first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false)

    result.signalsCompanyOptions = await countFilterOptions(page, 'Filter by company')
    result.signalsTypeOptions = await countFilterOptions(page, 'Filter by type')
    result.hasRunSignalsButton = runButtonVisible
  }

  return result
}

function evaluateAgainstBaseline(results, baseline) {
  const deviations = []

  for (const result of results) {
    const expected = baseline.routes[result.route]
    if (!expected) continue

    if (result.status >= 400 || result.status === 0) {
      deviations.push(`${result.route}: returned HTTP ${result.status}`)
    }

    if (typeof expected.maxLoadMs === 'number' && result.loadMs > expected.maxLoadMs) {
      const deltaPct = Math.round(((result.loadMs - expected.maxLoadMs) / expected.maxLoadMs) * 100)
      deviations.push(`${result.route}: load ${result.loadMs}ms exceeds baseline ${expected.maxLoadMs}ms (+${deltaPct}%)`)
    }

    if (typeof expected.maxSettleMs === 'number' && typeof result.settledMs === 'number' && result.settledMs > expected.maxSettleMs) {
      const deltaPct = Math.round(((result.settledMs - expected.maxSettleMs) / expected.maxSettleMs) * 100)
      deviations.push(`${result.route}: settle ${result.settledMs}ms exceeds baseline ${expected.maxSettleMs}ms (+${deltaPct}%)`)
    }

    if (typeof expected.minCompanyOptions === 'number' && typeof result.signalsCompanyOptions === 'number' && result.signalsCompanyOptions < expected.minCompanyOptions) {
      deviations.push(`${result.route}: company filter options ${result.signalsCompanyOptions} below minimum ${expected.minCompanyOptions}`)
    }

    if (typeof expected.minTypeOptions === 'number' && typeof result.signalsTypeOptions === 'number' && result.signalsTypeOptions < expected.minTypeOptions) {
      deviations.push(`${result.route}: type filter options ${result.signalsTypeOptions} below minimum ${expected.minTypeOptions}`)
    }

    if (result.route === '/dashboard/signals' && result.hasRunSignalsButton === false) {
      deviations.push('/dashboard/signals: Run signal scan now button not visible')
    }
  }

  return deviations
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# Dashboard Behavior Baseline Report')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Base URL: ${report.baseUrl}`)
  lines.push(`Pass: ${report.pass}`)
  lines.push(`Duration (ms): ${report.durationMs}`)
  lines.push('')
  lines.push('## Measurements')
  lines.push('')
  for (const result of report.results) {
    const settled = typeof result.settledMs === 'number' ? `, settle=${result.settledMs}ms` : ''
    const options = result.route === '/dashboard/signals'
      ? `, companyOptions=${result.signalsCompanyOptions}, typeOptions=${result.signalsTypeOptions}`
      : ''
    lines.push(`- ${result.route}: status=${result.status}, load=${result.loadMs}ms${settled}${options}`)
  }
  lines.push('')
  lines.push('## Variations')
  lines.push('')
  if (report.deviations.length === 0) {
    lines.push('- None')
  } else {
    for (const deviation of report.deviations) {
      lines.push(`- ${deviation}`)
    }
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

async function postSlackReport({ webhookUrl, channelLabel, baseUrl, report, deviations }) {
  if (!webhookUrl) return

  const topLine = deviations.length === 0
    ? 'Dashboard behavior baseline check passed'
    : `Dashboard behavior baseline detected ${deviations.length} variation(s)`

  const summaryLines = report.results.map((result) => {
    const settled = typeof result.settledMs === 'number' ? `, settle=${result.settledMs}ms` : ''
    const options = result.route === '/dashboard/signals'
      ? `, companyOptions=${result.signalsCompanyOptions}, typeOptions=${result.signalsTypeOptions}`
      : ''
    return `- ${result.route}: status=${result.status}, load=${result.loadMs}ms${settled}${options}`
  })

  const deviationLines = deviations.length
    ? deviations.map((deviation) => `- ${deviation}`).join('\n')
    : '- None'

  const text = [
    `*${topLine}*`,
    `Channel: ${channelLabel}`,
    `Base URL: ${baseUrl}`,
    '',
    '*Measurements*',
    ...summaryLines,
    '',
    '*Variations*',
    deviationLines,
  ].join('\n')

  await postSlackText({ webhookUrl, text })
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const root = process.cwd()
  const baselinePath = path.join(root, 'config', 'dashboard-behavior-baseline.json')
  const reportPath = path.join(root, args.report)
  const reportMdPath = reportPath.replace(/\.json$/i, '.md')

  const baseUrl = (args.baseUrl || process.env.PLAYWRIGHT_BASE_URL || 'https://startingmonday.app').replace(/\/$/, '')
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  const slackWebhook = process.env.SLACK_UI_DELIVERY_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || ''
  const slackChannelLabel = process.env.SLACK_UI_DELIVERY_CHANNEL || 'reliability---service'

  if (!email || !password) {
    throw new Error('Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD')
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ baseURL: baseUrl })

  const startedAt = Date.now()

  try {
    await page.goto('/login', { waitUntil: 'load', timeout: 30000 })
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /^Sign in$/i }).click()
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { timeout: 20000 })

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    const discoveredHrefs = await page.locator('a[href^="/dashboard"]').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href') ?? ''))
    const discoveredRoutes = [...new Set(discoveredHrefs.map((href) => href.split('?')[0]).map(normalizeRoute).filter(Boolean))]

    const targetRoutes = [...new Set([...(baseline.requiredRoutes ?? []), ...discoveredRoutes])]

    const results = []
    const routeErrors = []
    for (const route of targetRoutes) {
      try {
        const result = await measureRoute(page, route)
        results.push(result)
      } catch (error) {
        // A single broken route must not kill the run before the report is
        // written - record it as a deviation and keep crawling.
        routeErrors.push(`${route}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`)
      }
    }

    const missingRequiredRoutes = (baseline.requiredRoutes ?? []).filter((route) => !targetRoutes.includes(route))
    const deviations = [...routeErrors, ...evaluateAgainstBaseline(results, baseline)]
    for (const missingRoute of missingRequiredRoutes) {
      deviations.push(`required route missing from crawl: ${missingRoute}`)
    }

    const report = {
      generatedAt: nowIso(),
      baseUrl,
      durationMs: Date.now() - startedAt,
      routes: targetRoutes,
      results,
      deviations,
      pass: deviations.length === 0,
    }

    writeLatestReportFiles({
      jsonPath: reportPath,
      markdownPath: reportMdPath,
      report,
      markdown: buildMarkdown(report),
    })

    await postSlackReport({
      webhookUrl: slackWebhook,
      channelLabel: slackChannelLabel,
      baseUrl,
      report,
      deviations,
    })

    if (deviations.length > 0) {
      console.error('Dashboard behavior baseline deviations detected:')
      for (const deviation of deviations) console.error(`- ${deviation}`)
      process.exitCode = 1
      return
    }

    console.log(`Dashboard behavior baseline check passed (${results.length} route checks).`)
  } finally {
    await browser.close()
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
