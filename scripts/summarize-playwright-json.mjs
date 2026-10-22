#!/usr/bin/env node
// Summarize a Playwright JSON report for workflow gates.
//
// Playwright's JSON reporter sets tests[].status to expected | unexpected | flaky | skipped.
// "passed" is a per-attempt result status, never a test status, so counting
// `status === 'passed'` treats every passing test as a failure.
//
// Usage: node scripts/summarize-playwright-json.mjs <report.json> [playwright-exit-code]
// Prints GITHUB_OUTPUT-style lines: passed, failed, flaky, skipped, total, failed_tests, error.

import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function summarizePlaywrightReport(report, exitCode = 0) {
  let passed = 0
  let failed = 0
  let flaky = 0
  let skipped = 0
  const failedTests = []

  function walk(suite) {
    for (const child of suite.suites ?? []) walk(child)
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status === 'expected') passed++
        else if (test.status === 'flaky') {
          passed++
          flaky++
        } else if (test.status === 'skipped') skipped++
        else {
          failed++
          failedTests.push(spec.title)
        }
      }
    }
  }
  for (const suite of report?.suites ?? []) walk(suite)

  // Playwright errors outside any test (global setup, config, auth fixture) produce a
  // nonzero exit with no failing test. Never let that read as green.
  const topLevelErrors = Array.isArray(report?.errors) ? report.errors.length : 0
  let error = ''
  if (failed === 0 && (Number(exitCode) !== 0 || topLevelErrors > 0)) {
    failed = 1
    error = topLevelErrors > 0 ? 'playwright reported errors outside tests' : `playwright exited ${exitCode} with no failing test`
    failedTests.push('(run error)')
  }

  return { passed, failed, flaky, skipped, total: passed + failed, failedTests, error }
}

export function toOutputLines(summary) {
  return [
    `passed=${summary.passed}`,
    `failed=${summary.failed}`,
    `flaky=${summary.flaky}`,
    `skipped=${summary.skipped}`,
    `total=${summary.total}`,
    `failed_tests=${summary.failedTests.join('|')}`,
    `error=${summary.error}`,
  ].join('\n')
}

function main() {
  const [file, exitCodeArg] = process.argv.slice(2)
  if (!file) {
    console.error('usage: summarize-playwright-json.mjs <report.json> [exit-code]')
    process.exit(2)
  }
  let summary
  try {
    const report = JSON.parse(readFileSync(file, 'utf8'))
    summary = summarizePlaywrightReport(report, exitCodeArg ?? 0)
  } catch (err) {
    summary = {
      passed: 0,
      failed: 1,
      flaky: 0,
      skipped: 0,
      total: 1,
      failedTests: ['(unreadable report)'],
      error: `could not read Playwright JSON report: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  process.stdout.write(`${toOutputLines(summary)}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
