#!/usr/bin/env npx tsx
// Deterministic gate on an agent-authored diff. Exits non-zero with the reasons.
//
//   npx tsx scripts/agent-response/check-agent-patch.ts --patch agent.patch

import { readFileSync } from 'node:fs'
import { describeViolations, validatePatch } from '@/lib/incident/patch-safety'

const args = process.argv.slice(2)
const i = args.indexOf('--patch')
const path = i === -1 ? 'agent.patch' : args[i + 1]

const report = validatePatch(readFileSync(path, 'utf8'))
console.log(`files: ${report.files.join(', ') || '(none)'}`)
console.log(`changes: +${report.addedLines}/-${report.removedLines}`)

if (!report.ok) {
  console.error(`patch REJECTED -- ${describeViolations(report)}`)
  process.exit(1)
}
console.log('patch accepted')
