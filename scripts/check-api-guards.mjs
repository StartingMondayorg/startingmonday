#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const API_ROOT = path.join(ROOT, 'src', 'app', 'api')

const GUARD_PATTERNS = [
  'requireAuth',
  'requireFeatureAccess',
  'requirePrepAccess',
  'requireAutomationAccess',
  'requireStaffAutomationAccess',
  'getStaffMember',
  'validateCronRequest',
  'enforcePublicEndpointGuard',
  'validateInternalRouteRequest',
  'tokensMatch',
]

const DIRECT_AUTH_PATTERNS = [
  'supabase.auth.getUser(',
  'if (!user)',
]

const EXPECTED_PUBLIC_ROUTES = {
  'src/app/api/briefing/send/route.ts': 'retired endpoint (410)',
  'src/app/api/drip/unsubscribe/route.ts': 'signed unsubscribe link endpoint',
  'src/app/api/health/route.ts': 'public liveness endpoint',
  'src/app/api/partners/report/route.ts': 'retired endpoint (410)',
  'src/app/api/track/open/route.ts': 'email tracking pixel endpoint',
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  return {
    json: args.has('--json'),
    strict: args.has('--strict'),
  }
}

async function collectRouteFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectRouteFiles(full))
      continue
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      files.push(full)
    }
  }

  return files
}

function toRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function hasAny(content, patterns) {
  return patterns.some((pattern) => content.includes(pattern))
}

function hasInlineUserAuth(content) {
  return DIRECT_AUTH_PATTERNS.every((pattern) => content.includes(pattern))
}

function isWebhookRoute(relPath) {
  return relPath.includes('/webhooks/')
}

function isPostRoute(content) {
  return content.includes('export async function POST(')
}

async function main() {
  const { json, strict } = parseArgs(process.argv)
  const files = await collectRouteFiles(API_ROOT)

  const routes = []
  for (const file of files) {
    const rel = toRel(file)
    const content = await fs.readFile(file, 'utf8')

    const hasSharedPublicGuard = content.includes('enforcePublicEndpointGuard')
    const postRoute = isPostRoute(content)
    const retiredRoute = content.includes('status: 410')

    if (isWebhookRoute(rel)) {
      routes.push({ path: rel, classification: 'webhook_excluded', reason: 'webhook route uses separate auth model', postRoute, hasSharedPublicGuard, retiredRoute })
      continue
    }

    if (hasAny(content, GUARD_PATTERNS)) {
      routes.push({ path: rel, classification: 'guarded', reason: 'recognized guard helper present', postRoute, hasSharedPublicGuard, retiredRoute })
      continue
    }

    if (hasInlineUserAuth(content)) {
      routes.push({ path: rel, classification: 'guarded_inline_auth', reason: 'inline supabase.auth.getUser() user gate', postRoute, hasSharedPublicGuard, retiredRoute })
      continue
    }

    if (EXPECTED_PUBLIC_ROUTES[rel]) {
      routes.push({ path: rel, classification: 'expected_public_or_system', reason: EXPECTED_PUBLIC_ROUTES[rel], postRoute, hasSharedPublicGuard, retiredRoute })
      continue
    }

    routes.push({ path: rel, classification: 'true_gap', reason: 'no recognized guard pattern or approved exception', postRoute, hasSharedPublicGuard, retiredRoute })
  }

  const trueGaps = routes.filter((r) => r.classification === 'true_gap')
  const expectedPublic = routes.filter((r) => r.classification === 'expected_public_or_system')
  const guarded = routes.filter((r) => r.classification === 'guarded')
  const inlineGuarded = routes.filter((r) => r.classification === 'guarded_inline_auth')
  const webhookExcluded = routes.filter((r) => r.classification === 'webhook_excluded')

  const publicPostWithoutSharedGuard = routes
    .filter((r) => r.classification === 'expected_public_or_system')
    .filter((r) => r.postRoute)
    .filter((r) => !r.retiredRoute)
    .filter((r) => !r.hasSharedPublicGuard)

  const result = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routes.length,
    guarded: guarded.length,
    guardedInlineAuth: inlineGuarded.length,
    expectedPublicOrSystem: expectedPublic.length,
    webhookExcluded: webhookExcluded.length,
    trueGapCount: trueGaps.length,
    trueGaps,
    publicPostWithoutSharedGuardCount: publicPostWithoutSharedGuard.length,
    publicPostWithoutSharedGuard,
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2))
    if (strict && (result.trueGapCount > 0 || result.publicPostWithoutSharedGuardCount > 0)) {
      process.exitCode = 1
    }
    return
  }

  console.log('API guard audit')
  console.log('---------------')
  console.log(`Total routes: ${result.totalRoutes}`)
  console.log(`Guarded (helper): ${result.guarded}`)
  console.log(`Guarded (inline auth): ${result.guardedInlineAuth}`)
  console.log(`Expected public/system: ${result.expectedPublicOrSystem}`)
  console.log(`Webhooks excluded: ${result.webhookExcluded}`)
  console.log(`True auth gaps: ${result.trueGapCount}`)

  if (result.trueGapCount > 0) {
    console.log('')
    console.log('True gaps:')
    for (const gap of result.trueGaps) {
      console.log(`- ${gap.path}`)
    }
  }

  if (result.publicPostWithoutSharedGuardCount > 0) {
    console.log('')
    console.log('Expected public/system routes to review for shared guard:')
    for (const route of result.publicPostWithoutSharedGuard) {
      console.log(`- ${route.path}`)
    }
  }

  if (strict && (result.trueGapCount > 0 || result.publicPostWithoutSharedGuardCount > 0)) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
