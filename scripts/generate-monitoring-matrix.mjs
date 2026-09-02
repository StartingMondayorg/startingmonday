#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const appDir = path.join(root, 'src', 'app')
const testsDir = path.join(root, 'tests', 'e2e')
const overridePath = path.join(root, 'config', 'monitoring-coverage.overrides.json')
const outJsonPath = path.join(root, 'docs', 'status', 'monitoring-coverage-matrix.latest.json')
const outMdPath = path.join(root, 'docs', 'status', 'monitoring-coverage-matrix.latest.md')

function walk(dir, predicate, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, predicate, acc)
      continue
    }
    if (predicate(full)) acc.push(full)
  }
  return acc
}

function normalizeRouteFromPage(filePath) {
  const rel = path.relative(appDir, filePath).replace(/\\/g, '/')
  const noSuffix = rel.replace(/\/page\.tsx$/, '')
  const segments = noSuffix
    .split('/')
    .filter(Boolean)
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
  const joined = '/' + segments.join('/')
  return joined === '/' ? '/' : joined.replace(/\/+/g, '/')
}

function normalizeApiFromRoute(filePath) {
  const rel = path.relative(path.join(appDir, 'api'), filePath).replace(/\\/g, '/')
  // Route groups like (account)/(ai) organize files but never appear in the
  // URL; keeping them generated /api/(account)/... contract checks that all
  // 404ed against production.
  const segments = rel
    .replace(/\/route\.ts$/, '')
    .split('/')
    .filter(Boolean)
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
  return `/api/${segments.join('/')}`
}

function parseMethods(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
    .filter((m) => new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(text))
  return methods.length ? methods : ['GET']
}

function classifyRouteAuth(route) {
  return route.startsWith('/dashboard') || route.startsWith('/settings') ? 'authenticated' : 'public'
}

function classifyRouteTier(route, authClass) {
  const tier0 = new Set([
    '/',
    '/login',
    '/signup',
    '/pricing',
    '/onboarding',
    '/dashboard',
    '/dashboard/briefing',
    '/dashboard/outreach',
    '/dashboard/signals',
    '/settings/billing',
  ])

  if (tier0.has(route)) return 'tier0'
  if (authClass === 'authenticated') return 'tier1'
  if (route.startsWith('/blog') || route.startsWith('/terms') || route.startsWith('/privacy') || route.startsWith('/security')) return 'tier3'
  return 'tier2'
}

function classifyActionTier(apiPath) {
  const tier0 = [
    '/api/health',
    '/api/readiness',
    '/api/auth/verify-and-signin',
    '/api/auth/verify-and-signup',
    '/api/auth/verify-and-oauth',
    '/api/billing/checkout',
    '/api/billing/portal',
    '/api/outreach/send',
    '/api/outreach/status',
    '/api/signals/classify',
  ]
  if (tier0.includes(apiPath)) return 'tier0'
  if (apiPath.startsWith('/api/admin') || apiPath.startsWith('/api/cron')) return 'tier2'
  return 'tier1'
}

function compilePatterns(raw = []) {
  return raw.map((p) => new RegExp(p))
}

function stripDynamic(route) {
  return route.replace(/\[[^/]+\]/g, '')
}

function loadTestCorpus() {
  if (!fs.existsSync(testsDir)) return ''
  const files = walk(testsDir, (p) => p.endsWith('.ts') || p.endsWith('.tsx'))
  return files.map((p) => fs.readFileSync(p, 'utf8')).join('\n')
}

function routeCovered(route, corpus, forceCoveredRoutes) {
  if (forceCoveredRoutes.includes(route)) return true
  if (corpus.includes(`'${route}'`) || corpus.includes(`\"${route}\"`)) return true

  const base = stripDynamic(route)
  if (base.length > 1 && (corpus.includes(`'${base}`) || corpus.includes(`\"${base}`))) return true
  return false
}

function actionCovered(apiPath, corpus, forceCoveredActions) {
  if (forceCoveredActions.includes(apiPath)) return true
  if (corpus.includes(`'${apiPath}'`) || corpus.includes(`\"${apiPath}\"`)) return true

  const base = stripDynamic(apiPath)
  if (base.length > 4 && (corpus.includes(`'${base}`) || corpus.includes(`\"${base}`))) return true
  return false
}

function summarizeCoverage(items) {
  const total = items.length
  const covered = items.filter((i) => i.covered).length
  return {
    total,
    covered,
    uncovered: total - covered,
    coveragePct: total === 0 ? 100 : Number(((covered / total) * 100).toFixed(1)),
  }
}

function toMarkdown(matrix) {
  const lines = []
  lines.push('# Monitoring Coverage Matrix')
  lines.push('')
  lines.push(`Generated: ${matrix.generatedAt}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Routes covered: ${matrix.summary.routes.covered}/${matrix.summary.routes.total} (${matrix.summary.routes.coveragePct}%)`)
  lines.push(`- Actions covered: ${matrix.summary.actions.covered}/${matrix.summary.actions.total} (${matrix.summary.actions.coveragePct}%)`)
  lines.push('')

  lines.push('## Route Coverage by Tier')
  lines.push('')
  lines.push('| Tier | Covered | Total | Coverage |')
  lines.push('|---|---:|---:|---:|')
  for (const [tier, stats] of Object.entries(matrix.summary.routesByTier)) {
    lines.push(`| ${tier} | ${stats.covered} | ${stats.total} | ${stats.coveragePct}% |`)
  }
  lines.push('')

  lines.push('## Action Coverage by Tier')
  lines.push('')
  lines.push('| Tier | Covered | Total | Coverage |')
  lines.push('|---|---:|---:|---:|')
  for (const [tier, stats] of Object.entries(matrix.summary.actionsByTier)) {
    lines.push(`| ${tier} | ${stats.covered} | ${stats.total} | ${stats.coveragePct}% |`)
  }
  lines.push('')

  const uncoveredTier0Routes = matrix.routes.filter((r) => r.tier === 'tier0' && !r.covered)
  const uncoveredTier0Actions = matrix.actions.filter((a) => a.tier === 'tier0' && !a.covered)

  lines.push('## Uncovered Tier-0 Routes')
  lines.push('')
  if (!uncoveredTier0Routes.length) {
    lines.push('- None')
  } else {
    for (const item of uncoveredTier0Routes) lines.push(`- ${item.route}`)
  }
  lines.push('')

  lines.push('## Uncovered Tier-0 Actions')
  lines.push('')
  if (!uncoveredTier0Actions.length) {
    lines.push('- None')
  } else {
    for (const item of uncoveredTier0Actions) lines.push(`- ${item.path} (${item.methods.join(',')})`)
  }
  lines.push('')

  return lines.join('\n') + '\n'
}

const overrides = fs.existsSync(overridePath)
  ? JSON.parse(fs.readFileSync(overridePath, 'utf8'))
  : {
      excludedRoutePatterns: [],
      routeExamples: {},
      forceCoveredRoutes: [],
      forceCoveredActions: [],
    }

const excludedRoutePatterns = compilePatterns(overrides.excludedRoutePatterns)
const corpus = loadTestCorpus()

const pageFiles = walk(appDir, (p) => /[\\/]page\.tsx$/.test(p))
const routeSet = new Set(pageFiles.map(normalizeRouteFromPage))

const routes = [...routeSet]
  .filter((route) => !excludedRoutePatterns.some((re) => re.test(route)))
  .sort()
  .map((route) => {
    const authClass = classifyRouteAuth(route)
    const tier = classifyRouteTier(route, authClass)
    const covered = routeCovered(route, corpus, overrides.forceCoveredRoutes ?? [])
    return {
      route,
      authClass,
      tier,
      covered,
      hasDynamicSegment: /\[[^/]+\]/.test(route),
      concreteExample: overrides.routeExamples?.[route] ?? null,
    }
  })

const apiDir = path.join(appDir, 'api')
const actionFiles = fs.existsSync(apiDir)
  ? walk(apiDir, (p) => /[\\/]route\.ts$/.test(p))
  : []

const actions = actionFiles
  .map((filePath) => {
    const pathName = normalizeApiFromRoute(filePath)
    const methods = parseMethods(filePath)
    const tier = classifyActionTier(pathName)
    const covered = actionCovered(pathName, corpus, overrides.forceCoveredActions ?? [])
    return {
      path: pathName,
      methods,
      tier,
      covered,
      hasDynamicSegment: /\[[^/]+\]/.test(pathName),
    }
  })
  .sort((a, b) => a.path.localeCompare(b.path))

const routesByTier = ['tier0', 'tier1', 'tier2', 'tier3'].reduce((acc, tier) => {
  acc[tier] = summarizeCoverage(routes.filter((r) => r.tier === tier))
  return acc
}, {})

const actionsByTier = ['tier0', 'tier1', 'tier2', 'tier3'].reduce((acc, tier) => {
  acc[tier] = summarizeCoverage(actions.filter((a) => a.tier === tier))
  return acc
}, {})

const matrix = {
  generatedAt: new Date().toISOString(),
  source: {
    pagesScanned: pageFiles.length,
    actionsScanned: actionFiles.length,
    testFilesScanned: fs.existsSync(testsDir) ? walk(testsDir, (p) => p.endsWith('.ts') || p.endsWith('.tsx')).length : 0,
  },
  summary: {
    routes: summarizeCoverage(routes),
    actions: summarizeCoverage(actions),
    routesByTier,
    actionsByTier,
  },
  routes,
  actions,
}

fs.mkdirSync(path.dirname(outJsonPath), { recursive: true })
fs.writeFileSync(outJsonPath, JSON.stringify(matrix, null, 2) + '\n')
fs.writeFileSync(outMdPath, toMarkdown(matrix))

console.log(`Wrote ${path.relative(root, outJsonPath)}`)
console.log(`Wrote ${path.relative(root, outMdPath)}`)
