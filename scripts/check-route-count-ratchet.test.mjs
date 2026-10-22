import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const script = path.join(root, 'scripts', 'check-route-count-ratchet.mjs')

function fixtureTree(routes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-route-ratchet-'))
  for (const route of routes) {
    const target = path.join(dir, ...route.split('/'))
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(path.join(target, 'page.tsx'), 'export default function Page() { return null }\n')
  }
  return dir
}

function writeBaseline(dir, baseline) {
  const file = path.join(dir, 'route-count-baseline.json')
  fs.writeFileSync(file, JSON.stringify(baseline))
  return file
}

function run(appDir, baselineFile, extraArgs = []) {
  return execFileSync(process.execPath, [script, ...extraArgs], {
    cwd: root,
    env: { ...process.env, ROUTE_COUNT_APP_DIR: appDir, ROUTE_COUNT_BASELINE: baselineFile },
    stdio: 'pipe',
  }).toString()
}

test('route-count ratchet passes against the live tree and its committed baseline', () => {
  execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' })
})

test('ignores admin pages and passes when the count holds', () => {
  const appDir = fixtureTree(['dashboard', 'dashboard/signals', 'dashboard/admin/crm', 'settings'])
  const baseline = writeBaseline(appDir, { count: 3, routes: ['dashboard', 'dashboard/signals', 'settings'] })
  const out = run(appDir, baseline)
  assert.match(out, /3 authenticated non-admin pages \(baseline 3\)/)
})

test('fails when a page is added without raising the baseline', () => {
  const appDir = fixtureTree(['dashboard', 'dashboard/signals', 'dashboard/new-thing'])
  const baseline = writeBaseline(appDir, { count: 2, routes: ['dashboard', 'dashboard/signals'] })
  assert.throws(() => run(appDir, baseline), /rose from 2 to 3/)
})

test('fails when the baseline is raised with a justification outside docs/strategy', () => {
  const appDir = fixtureTree(['dashboard', 'dashboard/new-thing'])
  const baseline = writeBaseline(appDir, {
    count: 2,
    justification: { document: 'README.md', displaces: 'nothing' },
    routes: ['dashboard', 'dashboard/new-thing'],
  })
  assert.throws(() => run(appDir, baseline), /existing docs\/strategy\/ document/)
})

test('passes when the baseline is raised with a real docs/strategy justification', () => {
  const appDir = fixtureTree(['dashboard', 'dashboard/new-thing'])
  const baseline = writeBaseline(appDir, {
    count: 2,
    justification: { document: 'docs/strategy/sm-simplification-proposal-2026-10-20.md', displaces: 'fixture' },
    routes: ['dashboard', 'dashboard/new-thing'],
  })
  const out = run(appDir, baseline)
  assert.match(out, /2 authenticated non-admin pages \(baseline 2\)/)
})

test('--update-baseline rewrites the count and route list', () => {
  const appDir = fixtureTree(['dashboard', 'settings'])
  const baseline = writeBaseline(appDir, { count: 5, routes: [] })
  run(appDir, baseline, ['--update-baseline'])
  const next = JSON.parse(fs.readFileSync(baseline, 'utf8'))
  assert.equal(next.count, 2)
  assert.deepEqual(next.routes, ['dashboard', 'settings'])
})
