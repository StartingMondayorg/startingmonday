import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { summarizePlaywrightReport, toOutputLines } from './summarize-playwright-json.mjs'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'summarize-playwright-json.mjs')

const spec = (title, ...statuses) => ({ title, tests: statuses.map((status) => ({ status })) })
const report = (...specs) => ({ suites: [{ suites: [{ specs }] }], errors: [] })

test('a green run counts expected tests as passed, not failed', () => {
  // Shape of the 2026-10-22 production run that still fired the failure alert.
  const s = summarizePlaywrightReport(report(spec('a', 'expected'), spec('b', 'expected'), spec('c', 'skipped')), 0)
  assert.equal(s.passed, 2)
  assert.equal(s.failed, 0)
  assert.equal(s.skipped, 1)
  assert.equal(s.error, '')
})

test('unexpected tests are failures and are named', () => {
  const s = summarizePlaywrightReport(report(spec('ok', 'expected'), spec('dashboard loads', 'unexpected')), 1)
  assert.equal(s.failed, 1)
  assert.deepEqual(s.failedTests, ['dashboard loads'])
})

test('flaky tests pass but are counted', () => {
  const s = summarizePlaywrightReport(report(spec('retry', 'flaky')), 0)
  assert.equal(s.passed, 1)
  assert.equal(s.flaky, 1)
  assert.equal(s.failed, 0)
})

test('a nonzero exit with no failing test is a failure', () => {
  const s = summarizePlaywrightReport(report(spec('a', 'skipped')), 1)
  assert.equal(s.failed, 1)
  assert.match(s.error, /exited 1/)
})

test('top-level Playwright errors are a failure even with exit 0', () => {
  const s = summarizePlaywrightReport({ suites: [], errors: [{ message: 'global setup failed' }] }, 0)
  assert.equal(s.failed, 1)
  assert.match(s.error, /outside tests/)
})

test('CLI reports an unreadable report as a failure', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pw-summary-'))
  const file = path.join(dir, 'report.json')
  writeFileSync(file, 'not json')
  const out = execFileSync(process.execPath, [script, file, '0'], { encoding: 'utf8' })
  assert.match(out, /^failed=1$/m)
  assert.match(out, /^error=could not read Playwright JSON report/m)
})

test('CLI output is GITHUB_OUTPUT lines', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pw-summary-'))
  const file = path.join(dir, 'report.json')
  writeFileSync(file, JSON.stringify(report(spec('a', 'expected'))))
  const out = execFileSync(process.execPath, [script, file, '0'], { encoding: 'utf8' })
  assert.equal(out, `${toOutputLines(summarizePlaywrightReport(report(spec('a', 'expected')), 0))}\n`)
  assert.match(out, /^passed=1$/m)
  assert.match(out, /^failed=0$/m)
})
