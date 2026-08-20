#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { loadSES } from './lib/agent-report-kit.mjs'

const ROOT = process.cwd()
const sesPath = path.join(ROOT, 'config', 'site-experience-standard.json')
const ses = loadSES(sesPath)
const argv = process.argv.slice(2)
const args = new Set(argv)
const stagedOnly = args.has('--staged')
const reportOnly = args.has('--report-only')

// Extract visual discipline thresholds from SES
const visualDiscipline = ses?.visualDiscipline ?? {}
const MAX_FONT_FAMILIES = visualDiscipline.maxDistinctFontFamilies ?? 2
const MAX_ACCENT_COLORS = visualDiscipline.maxAccentColorFamilies ?? 2
const MOTION_CONFIG = visualDiscipline.motion ?? { maxConcurrentAnimations: 6, maxDurationMs: 450, layoutShiftingAnimationAllowed: false }

const enforceTierArg = argv.find((arg) => arg.startsWith('--enforce-tier='))
const enforceTier = (enforceTierArg?.split('=')[1] || process.env.LUXURY_UX_ENFORCE_TIER || 'public-premium').trim()
const reportJsonArg = argv.find((arg) => arg.startsWith('--report-json='))
const reportMdArg = argv.find((arg) => arg.startsWith('--report-md='))
const topArg = argv.find((arg) => arg.startsWith('--top='))
const topCount = Number(topArg?.split('=')[1] || '20')

const PAGE_FILE_RE = /^src\/app\/.*\/page\.tsx$/
const TINY_TEXT_RE = /text-\[(10|11|12)px\]/g
const BODY_TEXT_RE = /text-\[(13|14|15|16|17|18)px\]/g
const UPPERCASE_MICRO_RE = /uppercase\s+tracking/g
const LINK_RE = /<(TrackLink|Link)\b[\s\S]*?>([\s\S]*?)<\/(TrackLink|Link)>/g

const ENFORCE_LEVELS = {
  'public-premium': 1,
  'public-all': 2,
  'all-pages': 3,
}

const PREMIUM_PUBLIC_PATTERNS = [
  /^src\/app\/page\.tsx$/,
  /^src\/app\/pricing\/page\.tsx$/,
  /^src\/app\/demo\/page\.tsx$/,
  /^src\/app\/for-[^/]+\/page\.tsx$/,
  /^src\/app\/for-executives\/page\.tsx$/,
  /^src\/app\/for-coaches\/page\.tsx$/,
  /^src\/app\/for-search-firms\/page\.tsx$/,
  /^src\/app\/executives\/page\.tsx$/,
  /^src\/app\/executives\/active\/page\.tsx$/,
  /^src\/app\/executives\/passive\/page\.tsx$/,
  /^src\/app\/executives\/personas\/page\.tsx$/,
  /^src\/app\/executives\/personas\/\[slug\]\/page\.tsx$/,
  /^src\/app\/career-tools\/page\.tsx$/,
  /^src\/app\/about\/page\.tsx$/,
]

function classifyRouteTier(relativePath) {
  if (relativePath.startsWith('src/app/(dashboard)/') || relativePath.includes('/dashboard/')) return 3
  if (PREMIUM_PUBLIC_PATTERNS.some((pattern) => pattern.test(relativePath))) return 1
  return 2
}

function tierLabel(tier) {
  if (tier === 1) return 'public-premium'
  if (tier === 2) return 'public-nonpremium'
  return 'internal-dashboard'
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function writeFile(relativePath, content) {
  const fullPath = path.join(ROOT, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function listTargetFiles() {
  if (!stagedOnly) {
    return walk(path.join(ROOT, 'src', 'app'))
      .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'))
      .filter((relativePath) => PAGE_FILE_RE.test(relativePath))
  }

  const output = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((relativePath) => PAGE_FILE_RE.test(relativePath))
    .filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)))
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    files.push(fullPath)
  }
  return files
}

function normalizeText(raw) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function checkFile(relativePath) {
  const content = read(relativePath)
  const tinyCount = (content.match(TINY_TEXT_RE) || []).length
  const bodyCount = (content.match(BODY_TEXT_RE) || []).length
  const uppercaseMicroCount = (content.match(UPPERCASE_MICRO_RE) || []).length

  const labels = new Map()
  let match
  while ((match = LINK_RE.exec(content)) !== null) {
    const label = normalizeText(match[2])
    if (!label) continue
    labels.set(label, (labels.get(label) || 0) + 1)
  }

  const repeatedCtas = [...labels.entries()]
    .filter(([, count]) => count > 2)
    .map(([label, count]) => `${label} (${count}x)`)

  const issues = []

  // Gate 1: avoid pages drifting into tiny-text heavy support copy.
  if (tinyCount > bodyCount + 4) {
    issues.push(`tiny-text-heavy: tiny=${tinyCount}, body=${bodyCount}`)
  }

  // Gate 2: avoid repeated CTA labels creating choice overload.
  if (repeatedCtas.length > 0) {
    issues.push(`repeated-cta-labels: ${repeatedCtas.join(', ')}`)
  }

  // Gate 3: reserve uppercase micro labels for occasional metadata usage.
  if (uppercaseMicroCount > 8) {
    issues.push(`excess-uppercase-micro-labels: ${uppercaseMicroCount}`)
  }

  // Gate 4: keep editorial comparison structure in place on comparison pages.
  if (content.includes('id="competitive-comparison"')) {
    if (!content.includes('Key takeaway:')) {
      issues.push('missing-key-takeaway-above-comparison-table')
    }
    if (!content.includes('Show full comparison (additional dimensions)')) {
      issues.push('missing-comparison-disclosure-control')
    }
  }

  const tier = classifyRouteTier(relativePath)

  return {
    relativePath,
    tier,
    tierName: tierLabel(tier),
    tinyCount,
    bodyCount,
    uppercaseMicroCount,
    repeatedCtas,
    issues,
    issueCount: issues.length,
  }
}

function summarizeByTier(results) {
  const summary = {
    'public-premium': { pages: 0, failingPages: 0, issues: 0 },
    'public-nonpremium': { pages: 0, failingPages: 0, issues: 0 },
    'internal-dashboard': { pages: 0, failingPages: 0, issues: 0 },
  }

  for (const result of results) {
    summary[result.tierName].pages += 1
    summary[result.tierName].issues += result.issueCount
    if (result.issueCount > 0) summary[result.tierName].failingPages += 1
  }

  return summary
}

function toTopOffenders(results, count) {
  return results
    .filter((result) => result.issueCount > 0)
    .sort((a, b) => {
      if (b.issueCount !== a.issueCount) return b.issueCount - a.issueCount
      return a.relativePath.localeCompare(b.relativePath)
    })
    .slice(0, count)
}

function toMarkdownReport({ enforceTier, enforceLevel, totalPages, totalIssues, failedPages, enforcedFailures, monitorOnlyFailures, tierSummary, topOffenders }) {
  const lines = []
  lines.push('# Luxury UX Static Report')
  lines.push('')
  lines.push(`- enforce tier: ${enforceTier}`)
  lines.push(`- enforce level: ${enforceLevel}`)
  lines.push(`- total pages scanned: ${totalPages}`)
  lines.push(`- pages with issues: ${failedPages}`)
  lines.push(`- total issues: ${totalIssues}`)
  lines.push(`- blocking pages at this tier: ${enforcedFailures.length}`)
  lines.push(`- monitor-only pages: ${monitorOnlyFailures.length}`)
  lines.push('')
  lines.push('## Tier Summary')
  lines.push('')
  lines.push('| Tier | Pages | Failing Pages | Issues |')
  lines.push('| --- | ---: | ---: | ---: |')
  for (const tierName of ['public-premium', 'public-nonpremium', 'internal-dashboard']) {
    const tier = tierSummary[tierName]
    lines.push(`| ${tierName} | ${tier.pages} | ${tier.failingPages} | ${tier.issues} |`)
  }
  lines.push('')
  lines.push(`## Top ${topOffenders.length} Worst Pages`)
  lines.push('')
  lines.push('| Page | Tier | Issue Count | Issues |')
  lines.push('| --- | --- | ---: | --- |')
  for (const offender of topOffenders) {
    lines.push(`| ${offender.relativePath} | ${offender.tierName} | ${offender.issueCount} | ${offender.issues.join('<br/>')} |`)
  }

  return `${lines.join('\n')}\n`
}

if (!ENFORCE_LEVELS[enforceTier]) {
  console.error(`luxury ux static gate: invalid --enforce-tier value "${enforceTier}"`)
  console.error('valid values: public-premium | public-all | all-pages')
  process.exit(1)
}

const files = listTargetFiles()
if (files.length === 0) {
  console.log('luxury ux static gate: no eligible page.tsx files to check')
  process.exit(0)
}

const results = files.map(checkFile)
const enforceLevel = ENFORCE_LEVELS[enforceTier]
const failed = results.filter((result) => result.issues.length > 0)
const enforcedFailures = failed.filter((result) => result.tier <= enforceLevel)
const monitorOnlyFailures = failed.filter((result) => result.tier > enforceLevel)
const tierSummary = summarizeByTier(results)
const topOffenders = toTopOffenders(results, Number.isFinite(topCount) && topCount > 0 ? topCount : 20)
const totalIssues = results.reduce((sum, result) => sum + result.issueCount, 0)

const reportPayload = {
  generatedAt: new Date().toISOString(),
  enforceTier,
  enforceLevel,
  stagedOnly,
  reportOnly,
  totalPages: results.length,
  failedPages: failed.length,
  totalIssues,
  blockingPages: enforcedFailures.length,
  monitorOnlyPages: monitorOnlyFailures.length,
  tierSummary,
  topOffenders,
  results,
}

if (reportJsonArg) {
  const reportPath = reportJsonArg.split('=')[1]
  writeFile(reportPath, `${JSON.stringify(reportPayload, null, 2)}\n`)
  console.log(`luxury ux static gate wrote JSON report: ${reportPath}`)
}

if (reportMdArg) {
  const reportPath = reportMdArg.split('=')[1]
  const md = toMarkdownReport({
    enforceTier,
    enforceLevel,
    totalPages: results.length,
    totalIssues,
    failedPages: failed.length,
    enforcedFailures,
    monitorOnlyFailures,
    tierSummary,
    topOffenders,
  })
  writeFile(reportPath, md)
  console.log(`luxury ux static gate wrote markdown report: ${reportPath}`)
}

if (!reportOnly && enforcedFailures.length > 0) {
  console.error(`luxury ux static gate failed (enforce-tier=${enforceTier}):`)
  for (const result of enforcedFailures) {
    console.error(`- ${result.relativePath}`)
    console.error(`  - tier: ${result.tierName}`)
    for (const issue of result.issues) {
      console.error(`  - ${issue}`)
    }
  }

  if (monitorOnlyFailures.length > 0) {
    console.error('monitor-only findings (not blocking at current tier):')
    for (const result of monitorOnlyFailures) {
      console.error(`- ${result.relativePath}`)
      console.error(`  - tier: ${result.tierName}`)
      for (const issue of result.issues) {
        console.error(`  - ${issue}`)
      }
    }
  }

  process.exit(1)
}

console.log(`luxury ux static gate passed for ${results.length} page(s) (enforce-tier=${enforceTier})`)

if (monitorOnlyFailures.length > 0) {
  console.log(`luxury ux static gate monitor-only findings: ${monitorOnlyFailures.length} page(s)`)
  for (const result of monitorOnlyFailures) {
    console.log(`- ${result.relativePath} [${result.tierName}]`)
  }
}