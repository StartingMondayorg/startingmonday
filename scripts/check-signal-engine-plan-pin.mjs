import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const planRelativePath = 'docs/signal-engine-cross-product-master-plan-2026-07-26.md'
const planPath = path.join(root, planRelativePath)
const agentsPath = path.join(root, 'AGENTS.md')

const requiredPlanMarkers = [
  '**Version:** 1.0 execution baseline',
  '**Status:** Complete planning baseline; execution gated by WS0 and named decisions',
  '## 4. Locked Architecture Boundaries',
  '### 3.3 DG-02 single-lineage correction register',
  '49865BD71FF3A4378BBD4AB129C78BCBEEAB215D2CF8A063CFCBEBD8FE96B3FA',
  'one final archive named `signal-engine-kit-v17.3.zip`',
  '### 3.4 WS0-06 required late-spec dispositions',
  '## 10. Initial Control Register',
  '## 16. Execution Backlog',
  '## 26. Story Definition of Ready and Done',
  'WS0-00 Engineer/repository readiness',
  'WS9-02 Aggregate schema v1',
]

const requiredAgentMarkers = [
  '## Signal Engine Program Governance',
  planRelativePath,
  'Signal-engine preflight',
  'Do not begin implementation until the preflight is complete.',
]

function fail(messages) {
  console.error('Signal-engine plan pin guard failed:')
  for (const message of messages) console.error(`- ${message}`)
  process.exitCode = 1
}

const errors = []

if (!fs.existsSync(planPath)) {
  errors.push(`canonical plan is missing: ${planRelativePath}`)
} else {
  const plan = fs.readFileSync(planPath, 'utf8')
  for (const marker of requiredPlanMarkers) {
    if (!plan.includes(marker)) errors.push(`canonical plan marker missing: ${marker}`)
  }
}

if (!fs.existsSync(agentsPath)) {
  errors.push('AGENTS.md is missing')
} else {
  const agents = fs.readFileSync(agentsPath, 'utf8')
  for (const marker of requiredAgentMarkers) {
    if (!agents.includes(marker)) errors.push(`AGENTS.md governance marker missing: ${marker}`)
  }
}

try {
  execFileSync('git', ['ls-files', '--error-unmatch', planRelativePath], {
    cwd: root,
    stdio: 'ignore',
  })
} catch {
  errors.push(`${planRelativePath} is not tracked in Git`)
}

if (errors.length > 0) {
  fail(errors)
} else {
  console.log(`Signal-engine plan pin guard passed (${planRelativePath}).`)
}
