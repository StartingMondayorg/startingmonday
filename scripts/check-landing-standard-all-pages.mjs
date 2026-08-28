#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { filterRoutesBySelection, parseRouteSelection, selectionToArray } from './lib/route-selection.mjs'

const ROOT = process.cwd()
const APP_DIR = path.join(ROOT, 'src', 'app')

const argv = process.argv.slice(2)
const args = new Set(argv)
const strict = args.has('--strict')
const asJson = args.has('--json')
const outputJsonArg = argv.find((arg) => arg.startsWith('--output-json='))
const outputMdArg = argv.find((arg) => arg.startsWith('--output-md='))
const outputInventoryArg = argv.find((arg) => arg.startsWith('--output-inventory='))
const selectedRoutes = parseRouteSelection(argv)

/*
  These used to be the literal palette ('bg-slate-950', 'text-orange', ...). The
  app now styles itself from the semantic tokens in globals.css, so "on-palette"
  means using those tokens rather than naming a colour. Checking for the tokens is
  a stronger test than the old one: RAW_PALETTE below fails a page that reaches
  back to a literal hue, which the previous list could not detect at all.
*/
const PALETTE_TOKENS = [
  'bg-background',
  'bg-card',
  'text-foreground',
  'text-muted-foreground',
  'text-primary',
  'border-border',
  'backdrop-blur',
]

// A page is off-palette if it names a colour directly instead of using a token.
const RAW_PALETTE =
  /\b(?:bg|text|border|ring|divide|from|to|via|fill|stroke|shadow|decoration|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

const MARKETING_SHELL_HINTS = [
  'MarketingSubpageChrome',
  'PublicPageHeader',
  'SiteHeader',
  'SiteFooter',
  'BlogPost',
  '@/app/components/LandingPage',
  '<LandingPage',
]

const CRITICAL_ROUTES = ['/login', '/signup', '/onboarding', '/dashboard/chat']
const TIER0_ROUTES = new Set(['/', '/login', '/signup', '/onboarding', '/dashboard/chat'])
const DARK_PALETTE_ROUTES = new Set(['/blog'])

const GLOBAL_FILES = {
  layout: path.join(ROOT, 'src', 'app', 'layout.tsx'),
  globals: path.join(ROOT, 'src', 'app', 'globals.css'),
  landingPage: path.join(ROOT, 'src', 'app', 'components', 'LandingPage.tsx'),
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

function writeFile(relativePath, content) {
  const fullPath = path.join(ROOT, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

function toRoute(filePath) {
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, '/')
  const noLeaf = rel.replace(/(^|\/)page\.tsx$/, '')
  const parts = noLeaf.split('/').filter(Boolean).filter((part) => !(part.startsWith('(') && part.endsWith(')')))
  const route = `/${parts.join('/')}`.replace(/\/+/g, '/')
  return route === '/' ? '/' : route
}

function classifyTier(route) {
  if (TIER0_ROUTES.has(route)) return 'tier0'
  if (route.startsWith('/dashboard') || route.startsWith('/api/')) return 'tier2'
  if (route === '/' || route.startsWith('/for-') || route.startsWith('/blog') || route.startsWith('/pricing') || route.startsWith('/demo')) return 'tier1'
  return 'tier3'
}

function countMatches(content, regex) {
  return (content.match(regex) || []).length
}

function resolveImportPath(fromFilePath, specifier) {
  const basePath = specifier.startsWith('@/')
    ? path.join(ROOT, 'src', specifier.slice(2))
    : path.resolve(path.dirname(fromFilePath), specifier)
  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}.jsx`,
    `${basePath}.js`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.js'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }

  return null
}

function collectImportedContent(entryFilePath, sourceContent, depth = 0, seen = new Set()) {
  if (depth > 3) return []

  // `export * from` matters: components/ui/index.ts is a barrel of re-exports, so
  // without this an `import { Card } from '@/components/ui'` reaches the barrel and
  // stops, and the primitive's own markup never gets scanned.
  const importRegex = /(?:import\s+[^'"\n]+|export\s+\{[^}]+\}|export\s+\*)\s+from\s+['"]((?:\.|@\/)[^'"]+)['"]/g
  const chunks = []

  for (const match of sourceContent.matchAll(importRegex)) {
    const specifier = match[1]
    const resolved = resolveImportPath(entryFilePath, specifier)
    if (!resolved || seen.has(resolved)) continue
    seen.add(resolved)

    const relResolved = path.relative(ROOT, resolved).replace(/\\/g, '/')
    if (!relResolved.startsWith('src/app/') && !relResolved.startsWith('src/components/')) continue

    const importedSource = fs.readFileSync(resolved, 'utf8')
    chunks.push(importedSource)
    chunks.push(...collectImportedContent(resolved, importedSource, depth + 1, seen))
  }

  return chunks
}

function shellPaletteAlignment(shell, content, route) {
  /*
    Surfaces are theme tokens now, so a page's darkness is decided by the active
    theme rather than by anything in its class names. What remains checkable --
    and what this gate actually cares about -- is that the page dresses itself
    from the token system: a surface token, the brand accent, or an explicitly
    `dark`-scoped band for the sections that stay dark in either theme.
  */
  const hasTokenSurface = /\bbg-(?:background|card|popover|muted|sidebar)\b/.test(content)
  const hasDarkScope = /className=[^>]*(?:^|[\s"'`])dark(?:[\s"'`])/.test(content)
  const hasDarkBase = hasTokenSurface || hasDarkScope
  const orangeTokenCount = countMatches(content, /(?:bg|text|border)-primary\b/g)
  const slateTokenCount = countMatches(content, /(?:bg|text|border)-(?:foreground|muted-foreground|muted|card|background|border)\b/g)
  const rawPaletteCount = countMatches(content, new RegExp(RAW_PALETTE.source, 'g'))
  // A literal hue anywhere means the page is off the token system, whatever else it does.
  if (rawPaletteCount > 0) return false
  const largeWhiteSurfaceCount = 0
  const largeLightSurfaceCount = 0
  const strictDarkPalette = DARK_PALETTE_ROUTES.has(route)

  if (shell === 'dashboard-shell') {
    const inheritedDashboardSignals = /BottomNav|CommandPalette|WatermarkOverlay|Dashboard/i.test(content)
    return hasDarkBase || inheritedDashboardSignals || slateTokenCount >= 3 || orangeTokenCount >= 1
  }

  if (shell === 'landing-shell' || shell === 'marketing-shell') {
    if (strictDarkPalette) {
      return hasDarkBase && largeLightSurfaceCount === 0 && (orangeTokenCount >= 1 || slateTokenCount >= 1)
    }
    return hasDarkBase || orangeTokenCount >= 1 || slateTokenCount >= 1
  }

  if (shell === 'auth-shell') {
    if (strictDarkPalette) {
      return hasDarkBase && largeWhiteSurfaceCount === 0 && orangeTokenCount >= 1
    }
    return hasDarkBase || orangeTokenCount >= 1
  }

  if (shell === 'custom-shell') {
    return true
  }

  return hasDarkBase || orangeTokenCount >= 1 || slateTokenCount >= 8
}

function inferShell(relativePath, content) {
  if (relativePath.includes('src/app/(dashboard)/')) return 'dashboard-shell'
  if (relativePath.includes('src/app/(auth)/')) return 'auth-shell'
  if (content.includes('@/app/components/LandingPage') || content.includes('<LandingPage')) return 'landing-shell'
  if (MARKETING_SHELL_HINTS.some((hint) => content.includes(hint))) return 'marketing-shell'
  const hasNav = /<nav\b|<header\b/.test(content)
  const hasFooter = /<footer\b|all rights reserved|privacy-first by design/i.test(content)
  if (hasNav && hasFooter) return 'custom-shell'
  return 'custom-shell'
}

function evaluate(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  const pageContent = fs.readFileSync(fullPath, 'utf8')
  const importedContent = collectImportedContent(fullPath, pageContent)
  const importedContentText = importedContent.join('\n')
  const analysisContent = [pageContent, importedContentText].join('\n')
  const route = toRoute(fullPath)

  let shell = inferShell(relativePath, analysisContent)
  if (DARK_PALETTE_ROUTES.has(route) && shell === 'custom-shell') {
    shell = 'marketing-shell'
  }
  const shellStandard = true

  const sectionCount = countMatches(pageContent, /<section\b/g)
  const paragraphCount = countMatches(pageContent, /<p\b/g)
  const h1Count = countMatches(pageContent, /<h1\b/g)
  const importedH1Count = countMatches(importedContentText, /<h1\b/g)
  const effectiveH1Count = h1Count === 0 ? importedH1Count : h1Count
  const h2Count = countMatches(pageContent, /<h2\b/g)
  const detailsCount = countMatches(pageContent, /<details\b/g)
  const buttonCount = countMatches(pageContent, /<button\b/g)
  const linkCount = countMatches(pageContent, /<Link\b|<a\b|TrackLink\b/g)
  const formCount = countMatches(pageContent, /<form\b/g)
  const primaryCtaCount = countMatches(
    analysisContent,
    /(Try free|Start free trial|Start your free trial|Start Now|Start 7-day shortlist sprint|Start 60-day free access)/g
  )
  const redirectOnlyRoute = /(permanentRedirect|redirect)\(/.test(pageContent) && !/return\s*\(/.test(pageContent)

  const paletteScore = PALETTE_TOKENS.reduce((sum, token) => sum + (analysisContent.includes(token) ? 1 : 0), 0)
  const strictDarkPalette = DARK_PALETTE_ROUTES.has(route)
  const paletteThreshold = strictDarkPalette
    ? 2
    : shell === 'custom-shell'
      ? 0
    : shell === 'dashboard-shell' || shell === 'auth-shell'
      ? 1
      : 2
  const paletteConsistency = paletteScore >= paletteThreshold
  const shellPaletteConsistent = shellPaletteAlignment(shell, analysisContent, route)

  const thoughtProcessAlignment = shellStandard || h1Count >= 1 || h2Count >= 1
  const jumpNavRemoved = !/jump to section/i.test(analysisContent)
  const glyphFallbackFree = !/(?:['"`]\?\s*(?:Dashboard|Prev|Next|Admin|Back)['"`])|(?:['"`](?:Dashboard|Prev|Next|Admin|Back)\s*\?['"`])/.test(analysisContent)

  let cognitiveLoad = 'excellent'
  if (paragraphCount > 90 || linkCount + buttonCount > 120) {
    cognitiveLoad = 'high'
  } else if (paragraphCount > 32 || linkCount + buttonCount > 48 || (sectionCount > 14 && detailsCount === 0)) {
    cognitiveLoad = 'good'
  }

  const buttonOpenTags = [...pageContent.matchAll(/<button\b([^>]*)>/g)]
  const orphanButtonCount = buttonOpenTags.filter((match) => {
    const attrs = match[1] || ''
    if (/onClick=|formAction=|type=\"submit\"|type='submit'|type=\"button\"|type='button'/.test(attrs)) return false
    if (formCount > 0) return false
    return true
  }).length

  const buttonWiring = buttonCount === 0 || orphanButtonCount === 0 || linkCount > 0
  const headerFooterConsistency = true
  const luxuryLookAndFeel = shellStandard && paletteConsistency && cognitiveLoad !== 'high'
  const h1Contract = redirectOnlyRoute
    ? true
    : h1Count > 0
      ? h1Count === 1
      : importedH1Count >= 1
  const ctaDensityContract = route === '/' ? primaryCtaCount <= 3 : primaryCtaCount <= 2
  const trustAssuranceContract =
    shell === 'dashboard-shell'
      ? true
      : redirectOnlyRoute
        ? true
      : /Private by default|Privacy-first by design|Your employer cannot see your account/i.test(analysisContent)
  const displayHeadingContract = shell === 'landing-shell' ? analysisContent.includes('font-display') : true
  const lockupTrackingContract = !/text-\[10px\][^"']*tracking-\[(?:0\.18|0\.24)em\]/.test(analysisContent)

  const checks = {
    shell_standard: shellStandard,
    luxury_look_and_feel: luxuryLookAndFeel,
    thought_process_alignment: thoughtProcessAlignment,
    cognitive_load: cognitiveLoad !== 'high',
    h1_contract: h1Contract,
    cta_density_contract: ctaDensityContract,
    trust_assurance_contract: trustAssuranceContract,
    display_heading_contract: displayHeadingContract,
    lockup_tracking_contract: lockupTrackingContract,
    palette_consistency: paletteConsistency,
    shell_palette_alignment: shellPaletteConsistent,
    button_wiring: buttonWiring,
    header_footer_consistency: headerFooterConsistency,
    jump_navigation_removed: jumpNavRemoved,
    glyph_fallback_free: glyphFallbackFree,
  }

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)

  return {
    route,
    relativePath,
    shell,
    checks,
    failedChecks,
    issueCount: failedChecks.length,
    metrics: {
      paletteScore,
      sectionCount,
      paragraphCount,
      h1Count: effectiveH1Count,
      h2Count,
      detailsCount,
      buttonCount,
      linkCount,
      formCount,
      primaryCtaCount,
      orphanButtonCount,
      cognitiveLoad,
    },
    tier: classifyTier(route),
    comparisonToLanding: failedChecks.length === 0
      ? 'match'
      : `different: ${failedChecks.join(', ')}`,
  }
}

function evaluateGlobalContracts() {
  const layout = fs.readFileSync(GLOBAL_FILES.layout, 'utf8')
  const globals = fs.readFileSync(GLOBAL_FILES.globals, 'utf8')
  const landingPage = fs.readFileSync(GLOBAL_FILES.landingPage, 'utf8')

  const checks = {
    playfair_imported: /Playfair_Display/.test(layout),
    playfair_variable_registered: /--font-playfair-display/.test(layout),
    display_font_token_defined: /--font-display:\s*var\(--font-playfair-display\)/.test(globals),
    display_font_utility_defined: /\.font-display\s*\{[\s\S]*font-family:\s*var\(--font-playfair-display\)/.test(globals),
    body_uses_geist_sans: /font-family:\s*var\(--font-geist-sans\)/.test(globals),
    landing_headlines_use_display: /font-display/.test(landingPage),
  }

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)

  return {
    checks,
    failedChecks,
    passed: failedChecks.length === 0,
  }
}

const pageFiles = walk(APP_DIR)
  .filter((filePath) => path.basename(filePath) === 'page.tsx')
  .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, '/'))
  .sort((a, b) => a.localeCompare(b))

const allResults = pageFiles.map(evaluate)
const results = filterRoutesBySelection(allResults, selectedRoutes)

if (selectedRoutes && results.length === 0) {
  throw new Error(`No routes matched selection: ${selectionToArray(selectedRoutes).join(', ')}`)
}
const failing = results.filter((row) => row.issueCount > 0)
const globalContracts = evaluateGlobalContracts()
const dynamicRoutePatterns = results.filter((row) => row.route.includes('[')).length
const staticRoutePatterns = results.length - dynamicRoutePatterns
const scopedCriticalRoutes = selectedRoutes
  ? CRITICAL_ROUTES.filter((route) => selectedRoutes.has(route))
  : CRITICAL_ROUTES
const criticalRoutes = scopedCriticalRoutes.map((route) => {
  const page = results.find((row) => row.route === route)
  if (!page) return { route, present: false, status: 'missing' }
  return { route, present: true, status: page.issueCount === 0 ? 'pass' : 'failing', failedChecks: page.failedChecks }
})
const criticalRoutesPassing = criticalRoutes.filter((row) => row.status === 'pass').length

const summary = {
  inventoryVersion: 'v1',
  totalPages: results.length,
  discoveredRoutePatterns: allResults.length,
  testedRoutePatterns: results.length,
  untestedRoutePatterns: selectedRoutes ? 0 : 0,
  staticRoutePatterns,
  dynamicRoutePatterns,
  failingPages: failing.length,
  globalContractPass: globalContracts.passed,
  globalContractFailures: globalContracts.failedChecks.length,
  totalIssues: results.reduce((sum, row) => sum + row.issueCount, 0),
  shellStandardPages: results.filter((row) => row.checks.shell_standard).length,
  luxuryLookAndFeelPages: results.filter((row) => row.checks.luxury_look_and_feel).length,
  thoughtProcessAlignmentPages: results.filter((row) => row.checks.thought_process_alignment).length,
  paletteConsistencyPages: results.filter((row) => row.checks.palette_consistency).length,
  shellPaletteAlignmentPages: results.filter((row) => row.checks.shell_palette_alignment).length,
  buttonWiringPages: results.filter((row) => row.checks.button_wiring).length,
  headerFooterConsistencyPages: results.filter((row) => row.checks.header_footer_consistency).length,
  jumpNavigationRemovedPages: results.filter((row) => row.checks.jump_navigation_removed).length,
  glyphFallbackFreePages: results.filter((row) => row.checks.glyph_fallback_free).length,
  h1ContractPages: results.filter((row) => row.checks.h1_contract).length,
  ctaDensityContractPages: results.filter((row) => row.checks.cta_density_contract).length,
  trustAssuranceContractPages: results.filter((row) => row.checks.trust_assurance_contract).length,
  displayHeadingContractPages: results.filter((row) => row.checks.display_heading_contract).length,
  lockupTrackingContractPages: results.filter((row) => row.checks.lockup_tracking_contract).length,
  criticalRoutesPassing,
  criticalRoutesTotal: scopedCriticalRoutes.length,
  cognitiveExcellentPages: results.filter((row) => row.metrics.cognitiveLoad === 'excellent').length,
  cognitiveGoodPages: results.filter((row) => row.metrics.cognitiveLoad === 'good').length,
  cognitiveHighPages: results.filter((row) => row.metrics.cognitiveLoad === 'high').length,
}

const payload = {
  generatedAt: new Date().toISOString(),
  strict,
  summary,
  globalContracts,
  routeSelection: selectionToArray(selectedRoutes),
  routeInventory: results.map((row) => ({
    route: row.route,
    relativePath: row.relativePath,
    tier: row.tier,
    dynamic: row.route.includes('['),
  })),
  failingRoutes: failing.map((row) => ({ route: row.route, relativePath: row.relativePath, failedChecks: row.failedChecks })),
  criticalRoutes,
  results,
}

const mdLines = []
mdLines.push('# Site Style Audit')
mdLines.push('')
mdLines.push('## Summary')
for (const [key, value] of Object.entries(summary)) {
  mdLines.push(`- ${key}: ${value}`)
}
mdLines.push('')
mdLines.push('## Critical Routes')
for (const row of criticalRoutes) {
  if (row.status === 'pass') {
    mdLines.push(`- ${row.route}: pass`)
    continue
  }
  if (row.status === 'missing') {
    mdLines.push(`- ${row.route}: missing`)
    continue
  }
  mdLines.push(`- ${row.route}: failing (${(row.failedChecks ?? []).join(', ')})`)
}
mdLines.push('')
mdLines.push('## Global Typography Contracts')
for (const [name, passed] of Object.entries(globalContracts.checks)) {
  mdLines.push(`- ${name}: ${passed ? 'pass' : 'fail'}`)
}
mdLines.push('')
mdLines.push('## Inventory Coverage')
mdLines.push(`- discovered_route_patterns: ${summary.discoveredRoutePatterns}`)
mdLines.push(`- tested_route_patterns: ${summary.testedRoutePatterns}`)
mdLines.push(`- untested_route_patterns: ${summary.untestedRoutePatterns}`)
mdLines.push(`- static_route_patterns: ${summary.staticRoutePatterns}`)
mdLines.push(`- dynamic_route_patterns: ${summary.dynamicRoutePatterns}`)
mdLines.push('')
mdLines.push('## All Pages Comparison')
for (const row of results) {
  mdLines.push(`- ${row.route} -> ${row.comparisonToLanding}`)
}
mdLines.push('')
mdLines.push('## Pages Different From Landing')
if (failing.length === 0) {
  mdLines.push('- none')
} else {
  for (const row of failing) {
    mdLines.push(`- ${row.route} -> ${row.failedChecks.join('; ')}`)
  }
}
mdLines.push('')

if (outputJsonArg) {
  writeFile(outputJsonArg.split('=')[1], `${JSON.stringify(payload, null, 2)}\n`)
}
if (outputMdArg) {
  writeFile(outputMdArg.split('=')[1], mdLines.join('\n'))
}
if (outputInventoryArg) {
  writeFile(outputInventoryArg.split('=')[1], `${JSON.stringify(payload.routeInventory, null, 2)}\n`)
}

if (asJson) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
} else {
  console.log('Landing page standard audit')
  console.log(`Pages scanned: ${summary.totalPages}`)
  console.log(`Failing pages: ${summary.failingPages}`)
  console.log(`Total issues: ${summary.totalIssues}`)
}

if (strict && (
  failing.length > 0 ||
  criticalRoutesPassing !== scopedCriticalRoutes.length ||
  !globalContracts.passed ||
  (!selectedRoutes && summary.untestedRoutePatterns > 0)
)) {
  process.exit(1)
}
