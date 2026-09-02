#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'
import { loadSES, getTierThresholds, writeLatestReportFiles, postSlackText } from './lib/agent-report-kit.mjs'
import { filterRoutesBySelection, parseRouteSelection, selectionToArray } from './lib/route-selection.mjs'

function parseArgs(argv) {
  const args = {
    report: 'docs/status/trust-integrity.latest.json',
    ses: 'config/site-experience-standard.json',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--base-url') args.baseUrl = argv[i + 1]
    if (token === '--report') args.report = argv[i + 1]
    if (token === '--ses') args.ses = argv[i + 1]
  }
  args.routeSelection = parseRouteSelection(argv)
  return args
}

function nowIso() {
  return new Date().toISOString()
}

function severityRank(severity) {
  if (severity === 'P0') return 0
  if (severity === 'P1') return 1
  return 2
}

function pushFinding(findings, finding) {
  findings.push(finding)
}

function titleExpected(routeLabel, titlePatternTemplate = '{label} - Starting Monday') {
  return titlePatternTemplate
    .replace('{label}', routeLabel)
    .replace('<Route Label>', routeLabel)
}

function extractDashboardSignalCount(text) {
  const direct = text.match(/Signals\s+this\s+week:\s*(\d+)/i)
  if (direct) return Number.parseInt(direct[1], 10)

  // The feature-flagged simplified dashboard renders the count as a stat
  // tile: the number on its own line followed by "new signals this week".
  const statTile = text.match(/(\d+)\s*\n?\s*new\s+signals?\s+this\s+week/i)
  if (statTile) return Number.parseInt(statTile[1], 10)

  const fallback = text.match(/(\d+)\s+fresh\s+signal(?:s)?\s+and\s+\d+\s+overdue\s+follow-up/i)
  if (fallback) return Number.parseInt(fallback[1], 10)

  return null
}

function extractBriefingSignalCount(text) {
  const match = text.match(/(\d+)\s+market\s+move(?:s)?\s+this\s+week/i)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function extractSignalsIndexCount(text) {
  const match = text.match(/(\d+)\s+signal(?:s)?\s+detected/i)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function extractStaleRelativePhrases(text) {
  const pattern = /(?:it\s+)?has\s+been\s+\d+\s+days?\s+since[^.]*\.?/gi
  return [...new Set(Array.from(text.matchAll(pattern), (entry) => entry[0].trim()))]
}

async function evaluateRoute(page, routeConfig, titlePatternTemplate = '{label} - Starting Monday') {
  const startedAt = Date.now()
  const response = await page.goto(routeConfig.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const status = response?.status() ?? 0

  await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 })

  // Streamed routes (for example /dashboard/signals) keep their Suspense
  // loading fallback, including its own main landmark, in the DOM until the
  // stream settles. Measure the settled page like the server-rendered routes,
  // not the fallback skeleton.
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null)

  const title = await page.title()
  const mainCount = await page.locator('main').count()
  const bodyText = await page.locator('body').innerText()
  const staleRelativePhrases = extractStaleRelativePhrases(bodyText)

  return {
    route: routeConfig.path,
    label: routeConfig.label,
    status,
    loadMs: Date.now() - startedAt,
    title,
    expectedTitle: titleExpected(routeConfig.label, titlePatternTemplate),
    titlePass: title === titleExpected(routeConfig.label, titlePatternTemplate),
    mainCount,
    mainPass: mainCount === 1,
    staleRelativePhrases,
    staleRelativePass: staleRelativePhrases.length === 0,
    textProbe: bodyText,
  }
}

function buildMarkdown(report) {
  const lines = []
  lines.push('# Trust Integrity Agent Report')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Base URL: ${report.baseUrl}`)
  lines.push(`Pass: ${report.pass}`)
  lines.push('')

  lines.push('## Contract Results')
  lines.push('')
  lines.push(`- Signal parity contract: ${report.contracts.signalParity.pass ? 'pass' : 'fail'}`)
  lines.push(`- Title contract: ${report.contracts.title.pass ? 'pass' : 'fail'}`)
  lines.push(`- Landmark contract: ${report.contracts.landmark.pass ? 'pass' : 'fail'}`)
  lines.push(`- Relative-time trust contract: ${report.contracts.relativeTime.pass ? 'pass' : 'fail'}`)
  lines.push('')

  lines.push('## Route Evidence')
  lines.push('')
  for (const route of report.routes) {
    lines.push(`- ${route.route}: status=${route.status}, title="${route.title}", expected="${route.expectedTitle}", mainCount=${route.mainCount}, staleRelativePhrases=${route.staleRelativePhrases.length}`)
  }
  lines.push('')

  lines.push('## Findings')
  lines.push('')
  if (report.findings.length === 0) {
    lines.push('- None')
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.contract}: ${finding.message}`)
      if (finding.route) lines.push(`  Route: ${finding.route}`)
      if (finding.evidence) lines.push(`  Evidence: ${finding.evidence}`)
    }
  }
  lines.push('')

  return `${lines.join('\n')}\n`
}

async function postSlackReport({ webhookUrl, channelLabel, report }) {
  if (!webhookUrl) return

  const p0 = report.findings.filter((finding) => finding.severity === 'P0').length
  const p1 = report.findings.filter((finding) => finding.severity === 'P1').length
  const headline = report.pass
    ? '*Trust integrity agent passed*'
    : `*Trust integrity agent detected issues (P0=${p0}, P1=${p1})*`

  const contractLines = [
    `- Signal parity: ${report.contracts.signalParity.pass ? 'pass' : 'fail'}`,
    `- Title pattern: ${report.contracts.title.pass ? 'pass' : 'fail'}`,
    `- Landmark count: ${report.contracts.landmark.pass ? 'pass' : 'fail'}`,
    `- Relative-time trust: ${report.contracts.relativeTime.pass ? 'pass' : 'fail'}`,
  ]

  const routeLines = report.routes.map((route) => {
    return `- ${route.route}: status=${route.status}, title=${route.titlePass ? 'ok' : 'mismatch'}, main=${route.mainCount}, stalePhrase=${route.staleRelativePhrases.length}`
  })

  const findingLines = report.findings.length === 0
    ? ['- None']
    : report.findings.slice(0, 12).map((finding) => `- [${finding.severity}] ${finding.contract}: ${finding.message}`)
  const executiveSummary = report.pass
    ? 'All trust contracts passed for dashboard parity, titles, landmarks, and relative-time checks.'
    : `Trust contract violations detected (${report.findings.length} finding(s)); remediate before certifying dashboard trust posture.`

  const text = [
    headline,
    `Channel: ${channelLabel}`,
    `Base URL: ${report.baseUrl}`,
    '',
    '*Executive summary*',
    `- ${executiveSummary}`,
    '',
    '*Contract status*',
    ...contractLines,
    '',
    '*Route evidence*',
    ...routeLines,
    '',
    '*Findings*',
    ...findingLines,
  ].join('\n')

  await postSlackText({ webhookUrl, text })
}

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const root = process.cwd()
  const reportJsonPath = path.join(root, args.report)
  const reportMdPath = reportJsonPath.replace(/\.json$/i, '.md')

  const baseUrl = (args.baseUrl || process.env.PLAYWRIGHT_BASE_URL || 'https://startingmonday.app').replace(/\/$/, '')
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  const slackWebhook = process.env.SLACK_UI_DELIVERY_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || ''
  const slackChannelLabel = process.env.SLACK_UI_DELIVERY_CHANNEL || 'reliability---service'

  if (!email || !password) {
    throw new Error('Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD')
  }

  const sesPath = path.join(root, args.ses)
  if (!fs.existsSync(sesPath)) throw new Error(`Missing SES file: ${sesPath}`)

  const ses = loadSES(sesPath)
  const dashboardContracts = getTierThresholds(ses, 'dashboard', 'trustContracts') ?? {}
  const titlePattern = dashboardContracts.titlePattern ?? '{label} - Starting Monday'
  const stalePhrasesAllowed = dashboardContracts.staleRelativeTimePhrasesAllowed ?? false
  const routeSelection = args.routeSelection

  const routesToCheck = filterRoutesBySelection([
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/briefing', label: 'Daily Briefing' },
    { path: '/dashboard/signals', label: 'Signals' },
    { path: '/dashboard/calendar', label: 'Calendar' },
    { path: '/dashboard/contacts', label: 'Contacts' },
  ], routeSelection)

  if (routeSelection && routesToCheck.length === 0) {
    throw new Error(`No dashboard routes matched selection: ${selectionToArray(routeSelection).join(', ')}`)
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ baseURL: baseUrl })

  try {
    await page.goto('/login', { waitUntil: 'load', timeout: 30000 })
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /^Sign in$/i }).click()
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { timeout: 20000 })

    const routes = []
    for (const routeConfig of routesToCheck) {
      routes.push(await evaluateRoute(page, routeConfig, titlePattern))
    }

    const findings = []

    for (const route of routes) {
      if (route.status >= 400 || route.status === 0) {
        pushFinding(findings, {
          severity: 'P1',
          contract: 'availability',
          route: route.route,
          message: `Route returned HTTP ${route.status}`,
          evidence: `status=${route.status}`,
        })
      }

      if (!route.titlePass) {
        pushFinding(findings, {
          severity: 'P1',
          contract: 'title',
          route: route.route,
          message: `Title mismatch. expected="${route.expectedTitle}" actual="${route.title}"`,
          evidence: `title=${route.title}`,
        })
      }

      if (!route.mainPass) {
        pushFinding(findings, {
          severity: 'P1',
          contract: 'landmark',
          route: route.route,
          message: `Expected exactly one main landmark, found ${route.mainCount}`,
          evidence: `mainCount=${route.mainCount}`,
        })
      }

      if (!stalePhrasesAllowed && !route.staleRelativePass) {
        pushFinding(findings, {
          severity: 'P1',
          contract: 'relative-time',
          route: route.route,
          message: `Detected stale relative-time copy (${route.staleRelativePhrases.length} phrase(s))`,
          evidence: route.staleRelativePhrases.join(' | '),
        })
      }
    }

    const dashboardRoute = routes.find((route) => route.route === '/dashboard')
    const briefingRoute = routes.find((route) => route.route === '/dashboard/briefing')
    const signalsRoute = routes.find((route) => route.route === '/dashboard/signals')
    const parityRoutesInScope = ['/dashboard', '/dashboard/briefing', '/dashboard/signals']
      .filter((route) => routes.some((row) => row.route === route))

    const dashboardCount = dashboardRoute ? extractDashboardSignalCount(dashboardRoute.textProbe) : null
    const briefingCount = briefingRoute ? extractBriefingSignalCount(briefingRoute.textProbe) : null
    const signalsCount = signalsRoute ? extractSignalsIndexCount(signalsRoute.textProbe) : null

    if (parityRoutesInScope.length === 3) {
      if (dashboardCount === null || briefingCount === null || signalsCount === null) {
        pushFinding(findings, {
          severity: 'P1',
          contract: 'signal-parity',
          route: '/dashboard + /dashboard/briefing + /dashboard/signals',
          message: 'Could not extract one or more signal counts for parity comparison',
          evidence: `dashboard=${dashboardCount ?? 'n/a'}, briefing=${briefingCount ?? 'n/a'}, signals=${signalsCount ?? 'n/a'}`,
        })
      } else if (dashboardCount !== briefingCount || briefingCount !== signalsCount) {
        pushFinding(findings, {
          severity: 'P0',
          contract: 'signal-parity',
          route: '/dashboard + /dashboard/briefing + /dashboard/signals',
          message: 'Signal count mismatch across dashboard surfaces',
          evidence: `dashboard=${dashboardCount}, briefing=${briefingCount}, signals=${signalsCount}`,
        })
      }
    }

    findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity))

    const contracts = {
      signalParity: {
        pass: parityRoutesInScope.length === 3 ? !findings.some((finding) => finding.contract === 'signal-parity') : true,
        skipped: parityRoutesInScope.length !== 3,
        scope: parityRoutesInScope,
        counts: {
          dashboard: dashboardCount,
          briefing: briefingCount,
          signals: signalsCount,
        },
      },
      title: { pass: !findings.some((finding) => finding.contract === 'title') },
      landmark: { pass: !findings.some((finding) => finding.contract === 'landmark') },
      relativeTime: { pass: !findings.some((finding) => finding.contract === 'relative-time') },
    }

    const report = {
      generatedAt: nowIso(),
      baseUrl,
      sesVersion: ses.version,
      sesReviewBy: ses.reviewBy,
      trustContracts: dashboardContracts,
      contracts,
      routes: routes.map((route) => ({
        route: route.route,
        label: route.label,
        status: route.status,
        loadMs: route.loadMs,
        title: route.title,
        expectedTitle: route.expectedTitle,
        titlePass: route.titlePass,
        mainCount: route.mainCount,
        mainPass: route.mainPass,
        staleRelativePhrases: route.staleRelativePhrases,
      })),
      findings,
      pass: findings.length === 0,
      routeSelection: selectionToArray(routeSelection),
    }

    writeLatestReportFiles({
      jsonPath: reportJsonPath,
      markdownPath: reportMdPath,
      report,
      markdown: buildMarkdown(report),
    })

    await postSlackReport({
      webhookUrl: slackWebhook,
      channelLabel: slackChannelLabel,
      report,
    })

    if (!report.pass) {
      console.error('Trust integrity contract violations detected:')
      for (const finding of findings) {
        console.error(`- [${finding.severity}] ${finding.contract}: ${finding.message}`)
      }
      process.exitCode = 1
      return
    }

    console.log(`Trust integrity checks passed across ${routes.length} dashboard routes.`)
  } finally {
    await browser.close()
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
