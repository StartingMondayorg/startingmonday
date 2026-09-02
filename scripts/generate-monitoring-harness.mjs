#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const matrixPath = path.join(root, 'docs', 'status', 'monitoring-coverage-matrix.latest.json')
const outDir = path.join(root, 'tests', 'e2e', 'generated')
const routeSpecPath = path.join(outDir, 'page-routes.generated.spec.ts')
const actionSpecPath = path.join(outDir, 'action-contracts.generated.spec.ts')

const ROUTE_SKIP_PATTERNS = [
  {
    pattern: /^\/dashboard\/admin(?:\/|$)/,
    reason: 'Admin-only route requires elevated staff role not guaranteed in synthetic auth context',
  },
  {
    pattern: /^\/dashboard\/partner$/,
    reason: 'Partner route requires partner-scoped access and may return role-based 404 for standard auth sessions',
  },
]

function routeSkipReason(route) {
  return ROUTE_SKIP_PATTERNS.find((entry) => entry.pattern.test(route))?.reason ?? ''
}

const routeSkipArg = process.argv.find((arg) => arg.startsWith('--route-skip-reason='))
if (routeSkipArg) {
  console.log(routeSkipReason(routeSkipArg.slice('--route-skip-reason='.length)))
  process.exit(0)
}

if (!fs.existsSync(matrixPath)) {
  console.error('Missing monitoring matrix. Run: npm run monitor:matrix:generate')
  process.exit(1)
}

const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'))

const ACTION_OVERRIDES = {
  '/api/auth/verify-and-magic-link': {
    expectedStatuses: [410],
    note: 'Endpoint is intentionally retired and returns 410 Gone',
  },
  '/api/briefing/send': {
    expectedStatuses: [410],
    note: 'Endpoint is intentionally retired and returns 410 Gone',
  },
  '/api/billing/pause': {
    expectedStatuses: [401, 404],
    note: 'Route is not deployed on production at this time and may return auth-first 401',
  },
  '/api/billing/resume': {
    expectedStatuses: [401, 404],
    note: 'Route is not deployed on production at this time and may return auth-first 401',
  },
  '/api/billing/portal': {
    expectedStatuses: [200, 401, 404],
    note: 'Returns 404 (No billing account found) when the monitoring user has no Stripe customer, expected for the probe account',
  },
  '/api/partners/report': {
    expectedStatuses: [410],
    note: 'Retired endpoint intentionally returns 410 Gone',
  },
  '/api/partner/outcome-events': {
    expectedStatuses: [401, 404],
    note: 'Returns 404 when authenticated user has no partner workspace — expected for standard monitoring user',
  },
  '/api/partner/weekly-loop': {
    expectedStatuses: [401, 404],
    note: 'Returns 404 when authenticated user has no partner workspace — expected for standard monitoring user',
  },
  '/api/team/program-settings': {
    expectedStatuses: [401, 403, 404],
    note: 'Returns 404 when user has no team/enterprise setup — expected for standard monitoring user',
  },
  '/api/team/roles': {
    expectedStatuses: [401, 403, 404],
    note: 'Returns 404 when user has no team/enterprise setup — expected for standard monitoring user',
  },
  '/api/team/white-label': {
    expectedStatuses: [401, 403, 404],
    note: 'Returns 404 when user has no team/enterprise setup — expected for standard monitoring user',
  },
  '/api/strategy': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid long-running streaming response in contract mode',
  },
  '/api/demo-brief/executive-brief': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid long-running streaming response in contract mode',
  },
  '/api/demo-brief/manager-tools': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid long-running streaming response in contract mode',
  },
  '/api/client/coaches': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid DB-dependent failures in contract mode',
  },
  '/api/discover': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid long-running AI and DB-dependent failures in contract mode',
  },
  '/api/executive-brief/grill-me/sessions': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid DB-dependent failures in contract mode',
  },
  '/api/feedback/items': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid DB-dependent failures in contract mode',
  },
  '/api/google-calendar/disconnect': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid request-body-mode differences in contract mode',
  },
  '/api/ideas': {
    methodOverride: 'OPTIONS',
    expectedStatuses: [200, 204, 401, 403, 405],
    note: 'Use preflight-style probe to avoid DB-dependent failures in contract mode',
  },
}

const routeTargets = matrix.routes
  .filter((r) => r.tier === 'tier0' || r.tier === 'tier1')
  .map((r) => ({
    ...(() => {
      const skipReason = routeSkipReason(r.route)
      return skipReason ? { skipReason } : {}
    })(),
    route: r.route,
    authClass: r.authClass,
    hasDynamicSegment: r.hasDynamicSegment,
    concreteExample: r.concreteExample,
    tier: r.tier,
  }))

const actionTargets = matrix.actions
  .filter((a) => a.tier === 'tier0' || a.tier === 'tier1')
  .filter((a) => a.methods.includes('GET') || a.methods.includes('POST'))
  .map((a) => ({
    ...(ACTION_OVERRIDES[a.path] ?? {}),
    path: a.path,
    methods: a.methods,
    tier: a.tier,
    hasDynamicSegment: a.hasDynamicSegment,
  }))

const routeSpec = [
  "import { test, expect, type Page } from '@playwright/test'",
  "import { attachJourneyGuards } from '../monitoring.helpers'",
  '',
  `const routeTargets = ${JSON.stringify(routeTargets, null, 2)} as const`,
  '',
  'async function ensureAuthSession(page: Page) {',
  "  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null)",
  "  return !/\\/login(?:$|[/?#])/.test(page.url())",
  '}',
  '',
  'for (const target of routeTargets) {',
  "  test(`generated route coverage: ${target.route}`, async ({ page }) => {",
  '    const routeConfig = target as { skipReason?: string }',
  '    if (routeConfig.skipReason) {',
  '      test.skip(true, routeConfig.skipReason)',
  '    }',
  '',
  "    if (target.authClass === 'authenticated') {",
  '      const ok = await ensureAuthSession(page)',
  "      test.skip(!ok, 'Auth session unavailable for authenticated route coverage')",
  '    }',
  '',
  '    if (target.hasDynamicSegment && !target.concreteExample) {',
  "      test.skip(true, 'No concrete route example configured for dynamic segment route')",
  '    }',
  '',
  "    if (target.hasDynamicSegment && target.concreteExample && target.concreteExample.includes('example-')) {",
  "      test.skip(true, 'Placeholder example route configured; provide real fixture id for dynamic route coverage')",
  '    }',
  '',
  '    const path = (target.hasDynamicSegment && target.concreteExample) ? target.concreteExample : target.route',
  '    const guards = await attachJourneyGuards(page)',
  "    const res = await page.goto(path, { waitUntil: 'domcontentloaded' })",
  '',
  "    expect(res?.status(), 'Route response should not be 404').not.toBe(404)",
  "    await expect(page.locator('body')).toBeVisible()",
  "    await expect(page.locator('body')).not.toContainText(/(^|\\W)404(\\W|$)|page not found|cannot find the page/i)",
  "    expect(guards.pageErrors, `Page errors: ${guards.pageErrors.join(' | ')}`).toHaveLength(0)",
  "    expect(guards.consoleErrors, `Console errors: ${guards.consoleErrors.join(' | ')}`).toHaveLength(0)",
  "    const bodyText = (await page.locator('body').innerText().catch(() => '')).trim()",
  '    if (bodyText.length === 0) {',
  "      await expect(page.locator('.animate-pulse, [aria-busy=\"true\"], [data-testid=\"loading\"]').first()).toBeVisible()",
  '    }',
  '  })',
  '}',
  '',
].join('\n')

const actionSpec = [
  "import { test, expect } from '@playwright/test'",
  '',
  `const actionTargets = ${JSON.stringify(actionTargets, null, 2)} as const`,
  '',
  'const ACCEPTABLE_STATUS = new Set([200, 201, 202, 204, 400, 401, 403, 405, 422, 429])',
  '',
  'for (const target of actionTargets) {',
  "  test(`generated action contract: ${target.path}`, async ({ request }) => {",
  '    if (target.hasDynamicSegment) {',
  "      test.skip(true, 'Dynamic action path requires fixture id mapping')",
  '    }',
  '',
  '    const methods = [...target.methods] as string[]',
  "    const defaultMethod = methods.includes('GET') ? 'GET' : (methods.includes('POST') ? 'POST' : methods[0])",
  '    const actionConfig = target as { methodOverride?: string; probePath?: string; expectedStatuses?: number[]; note?: string }',
  "    const method = typeof actionConfig.methodOverride === 'string' ? actionConfig.methodOverride : defaultMethod",
  '    const requestPath = typeof actionConfig.probePath === "string" && actionConfig.probePath.length > 0 ? actionConfig.probePath : target.path',
  '    const expectedStatuses = Array.isArray(actionConfig.expectedStatuses) && actionConfig.expectedStatuses.length > 0',
  '      ? new Set(actionConfig.expectedStatuses)',
  '      : ACCEPTABLE_STATUS',
  '',
  '    let res',
  "    if (method === 'GET') {",
  "      res = await request.get(requestPath, { failOnStatusCode: false })",
  "    } else if (method === 'POST') {",
  "      res = await request.post(requestPath, { data: {}, failOnStatusCode: false })",
  '    } else {',
  '      res = await request.fetch(requestPath, { method, failOnStatusCode: false })',
  '    }',
  '',
  "    const msg = 'Unexpected status ' + res.status() + ' for ' + target.path + ' [' + method + ']' + (actionConfig.note ? ' (' + actionConfig.note + ')' : '')",
  '    expect(expectedStatuses.has(res.status()), msg).toBe(true)',
  '  })',
  '}',
  '',
].join('\n')

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(routeSpecPath, routeSpec)
fs.writeFileSync(actionSpecPath, actionSpec)

console.log(`Wrote ${path.relative(root, routeSpecPath)}`)
console.log(`Wrote ${path.relative(root, actionSpecPath)}`)
