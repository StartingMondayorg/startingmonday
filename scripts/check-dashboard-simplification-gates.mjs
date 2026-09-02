#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'config', 'dashboard-simplification-manifest.json'), 'utf8'))
const sourcePath = process.env.DASHBOARD_SIMPLIFICATION_SOURCE
  ? path.resolve(process.env.DASHBOARD_SIMPLIFICATION_SOURCE)
  : path.join(root, manifest.source)
const source = fs.readFileSync(sourcePath, 'utf8')
const asJson = process.argv.includes('--json')
const violations = []

const flagStart = source.indexOf('if (isStartingMondayDashboardSimplificationEnabled())')
const legacyStart = source.indexOf('\n  return (', flagStart)
if (flagStart < 0 || legacyStart < 0) {
  violations.push({ type: 'flagged-layout', message: 'Could not locate the default-off simplified dashboard branch.' })
}

const flaggedLayout = flagStart >= 0 && legacyStart > flagStart ? source.slice(flagStart, legacyStart) : ''
const zoneMatches = [...flaggedLayout.matchAll(/data-first-mile-section="([^"]+)"/g)].map((match) => match[1])
if (zoneMatches.length !== manifest.zones.length || manifest.zones.some((zone) => !zoneMatches.includes(zone))) {
  violations.push({
    type: 'zone-budget',
    message: `Expected exactly ${manifest.zones.length} named zones (${manifest.zones.join(', ')}); found ${zoneMatches.join(', ') || 'none'}.`,
  })
}

const actionMatches = [...flaggedLayout.matchAll(/data-dashboard-action="([^"]+)"/g)].map((match) => match[1])
if (actionMatches.length > 6 || manifest.primaryActionMarkers.some((action) => !actionMatches.includes(action))) {
  violations.push({
    type: 'cta-budget',
    message: `Expected the primary actions ${manifest.primaryActionMarkers.join(', ')} and no more than 6 marked actions; found ${actionMatches.join(', ') || 'none'}.`,
  })
}

if ((flaggedLayout.match(/<main\b/g) ?? []).length !== 1) {
  violations.push({ type: 'landmark', message: 'The flagged layout must render exactly one main landmark.' })
}

for (const claim of manifest.claimTemplates) {
  if (!new RegExp(claim.pattern, 'i').test(source)) {
    violations.push({ type: 'claim-manifest', claim: claim.id, message: `Claim template "${claim.id}" is missing from the flagged layout.` })
  }
}

for (const pattern of manifest.forbiddenPatterns) {
  if (new RegExp(pattern, 'i').test(flaggedLayout)) {
    violations.push({ type: 'product-isolation', pattern, message: `Forbidden dashboard dependency or internal vocabulary matched: ${pattern}` })
  }
}

for (const boundaryPath of manifest.stateBoundaries ?? []) {
  const boundarySource = fs.readFileSync(path.join(root, boundaryPath), 'utf8')
  const mainCount = (boundarySource.match(/<main\b/g) ?? []).length
  if (path.basename(boundaryPath).startsWith('loading.')) {
    // Loading fallbacks coexist in the DOM with the page's own main landmark
    // during Suspense streaming (SMK-491), so they must not declare one.
    if (mainCount !== 0) {
      violations.push({
        type: 'state-landmark',
        file: boundaryPath,
        message: `${boundaryPath} is a loading fallback and must not declare a main landmark (it coexists with the page's main during streaming); found ${mainCount}.`,
      })
    }
    continue
  }
  const usesSharedRouteError = /<RouteError\b/.test(boundarySource)
  if (mainCount !== 1 && !usesSharedRouteError) {
    violations.push({
      type: 'state-landmark',
      file: boundaryPath,
      message: `${boundaryPath} must render exactly one main landmark or use the shared RouteError boundary; found ${mainCount}.`,
    })
  }
}

const result = { ok: violations.length === 0, source: path.relative(root, sourcePath), violations }
if (asJson) {
  console.log(JSON.stringify(result, null, 2))
} else if (result.ok) {
  console.log(`Dashboard simplification gate: OK (${zoneMatches.length} zones, ${actionMatches.length} marked actions).`)
} else {
  console.error(`Dashboard simplification gate: ${violations.length} violation(s).`)
  for (const violation of violations) console.error(`  ${violation.message}`)
}

process.exit(result.ok ? 0 : 1)