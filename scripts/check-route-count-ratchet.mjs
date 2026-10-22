#!/usr/bin/env node
// Route-count ratchet (sm-simplification-proposal 2026-10-20 §3e, §5 "Guardrail").
//
// The authenticated, non-admin page count may not increase. Counts every
// src/app/(dashboard)/**/page.tsx outside an /admin/ segment and compares it
// with config/route-count-baseline.json. Going down is allowed and should be
// recorded with --update-baseline. Going up requires raising the baseline in
// the same change with a `justification` that names an existing document under
// docs/strategy/ explaining what the new page displaces.
//
// Usage: node scripts/check-route-count-ratchet.mjs [--json] [--update-baseline]
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
// Env overrides exist for the node:test fixtures only.
const appDir = process.env.ROUTE_COUNT_APP_DIR ?? path.join(root, 'src', 'app', '(dashboard)')
const baselinePath = process.env.ROUTE_COUNT_BASELINE ?? path.join(root, 'config', 'route-count-baseline.json')
const asJson = process.argv.includes('--json')
const update = process.argv.includes('--update-baseline')

function collectRoutes(dir = appDir) {
  const out = []
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'admin') continue
        walk(full)
      } else if (entry.name === 'page.tsx') {
        out.push(path.relative(appDir, path.dirname(full)).split(path.sep).join('/') || '/')
      }
    }
  }
  walk(dir)
  return out.sort()
}

function evaluate(routes, baseline) {
  const count = routes.length
  const problems = []
  if (count > baseline.count) {
    problems.push(
      `Authenticated non-admin page count rose from ${baseline.count} to ${count}. ` +
        'Raise config/route-count-baseline.json in this change with a justification naming a docs/strategy/ document that says what the new page displaces.',
    )
  }
  if (baseline.justification) {
    const doc = String(baseline.justification.document ?? '')
    if (!doc.startsWith('docs/strategy/') || !fs.existsSync(path.join(root, doc))) {
      problems.push(`Baseline justification must point at an existing docs/strategy/ document (got "${doc}").`)
    }
  }
  const baselineSet = new Set(baseline.routes ?? [])
  const added = routes.filter((r) => !baselineSet.has(r))
  const removed = (baseline.routes ?? []).filter((r) => !routes.includes(r))
  return { count, baselineCount: baseline.count, added, removed, problems }
}

const routes = collectRoutes()

if (update) {
  const previous = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : {}
  const next = {
    count: routes.length,
    recordedAt: new Date().toISOString().slice(0, 10),
    justification: previous.justification ?? null,
    routes,
  }
  fs.writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`route-count-ratchet: baseline updated to ${routes.length} pages`)
  process.exit(0)
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
const result = evaluate(routes, baseline)

if (asJson) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(`route-count-ratchet: ${result.count} authenticated non-admin pages (baseline ${result.baselineCount})`)
  if (result.added.length) console.log(`  added:   ${result.added.join(', ')}`)
  if (result.removed.length) console.log(`  removed: ${result.removed.join(', ')}`)
  for (const p of result.problems) console.error(`  FAIL ${p}`)
  if (!result.problems.length && result.count < result.baselineCount) {
    console.log('  Count went down. Run `npm run guard:route-count -- --update-baseline` to record the new ceiling.')
  }
}

process.exit(result.problems.length ? 1 : 0)
