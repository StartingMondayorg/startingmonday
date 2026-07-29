#!/usr/bin/env node

// Renders an EMI smoke artifact as a GitHub step-summary markdown block.
//
// Extracted from an inline `node -e "..."` in emi-weekly-validation.yml: the
// template literals in that one-liner sat inside a double-quoted bash string, so
// the shell treated the backticks as command substitution and mangled every row
// it touched. Keeping it in a file avoids the quoting problem entirely.

import { readFileSync } from 'fs'

const [, , artifactPath, titleArg] = process.argv
const title = titleArg ?? 'EMI Validation'

if (!artifactPath) {
  console.log(`## ${title}\n\nNo artifact path supplied.`)
  process.exit(0)
}

let data
try {
  data = JSON.parse(readFileSync(artifactPath, 'utf8'))
} catch (error) {
  const message = error instanceof Error ? error.message : 'unreadable artifact'
  console.log(`## ${title}\n\nCould not read ${artifactPath}: ${message}`)
  process.exit(0)
}

const value = (input) => (input === null || input === undefined || input === '' ? 'n/a' : String(input))
const list = (input) => (Array.isArray(input) && input.length > 0 ? input.join(', ') : 'none')

const lines = [
  `## ${title}`,
  '',
  `**Gate result: ${data.passed ? 'PASS' : 'FAIL'}**`,
  '',
  '### Pipeline health (blocking)',
  '',
  '| Check | Value |',
  '|---|---|',
  `| Passed | ${value(data.passed)} |`,
  `| KPI query errors | ${list(data.queryErrorMetrics)} |`,
  `| Weekly run id | ${value(data.weeklyRunId)} |`,
  `| Validation run id | ${value(data.validationRunId)} |`,
  `| Proof publisher run id | ${value(data.proofPublisherRunId)} |`,
  `| Claim audit run id | ${value(data.claimAuditRunId)} |`,
  `| Sprint 5 exit run id | ${value(data.sprint5ExitRunId)} |`,
  `| GTM proof run id | ${value(data.gtmProofSequenceRunId)} |`,
  `| Q4 cadence run id | ${value(data.q4CadenceRunId)} |`,
  `| Capstone run id | ${value(data.capstoneReportRunId)} |`,
  `| Success criteria audit run id | ${value(data.successCriteriaAuditRunId)} |`,
  `| Objection dashboard run id | ${value(data.objectionDashboardRunId)} |`,
  `| SLO monitoring run id | ${value(data.sloMonitoringRunId)} |`,
]

if (Array.isArray(data.failures) && data.failures.length > 0) {
  lines.push('', '### Blocking failures', '')
  for (const failure of data.failures) {
    lines.push(`- ${failure}`)
  }
}

lines.push(
  '',
  '### Advisory (non-blocking)',
  '',
  '| Signal | Value |',
  '|---|---|',
  `| Instrumentation status | ${value(data.validationStatus)} |`,
  `| Metrics stale 2+ weeks | ${list(data.staleMetrics)} |`,
  `| Metrics with no data | ${list(data.noDataMetrics)} |`,
  `| Business success criteria | ${value(data.successCriteriaStatus)} |`,
)

const criteria = data.successCriteriaPayload?.criteria_results
if (Array.isArray(criteria) && criteria.length > 0) {
  const passCount = data.successCriteriaPayload?.pass_count
  const required = data.successCriteriaPayload?.required_pass_count
  lines.push(
    '',
    `Business criteria met: ${value(passCount)} of ${value(required)} required. These do not affect the gate result.`,
    '',
    '| Metric | Target | Current | Met |',
    '|---|---|---|---|',
  )
  for (const row of criteria) {
    const current = row.value === null || row.value === undefined ? 'no data' : String(row.value)
    lines.push(`| ${value(row.metric_name)} | ${value(row.comparator)} ${value(row.target)} | ${current} | ${row.pass ? 'yes' : 'no'} |`)
  }
}

if (Array.isArray(data.warnings) && data.warnings.length > 0) {
  lines.push('', '### Warnings', '')
  for (const warning of data.warnings) {
    lines.push(`- ${warning}`)
  }
}

console.log(lines.join('\n'))
