#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const checks = [
  {
    file: 'src/app/components/LandingPage.tsx',
    allOf: ['Source:', 'documented methods'],
  },
  {
    file: 'src/app/(marketing)/pricing/page.tsx',
    allOf: ['Source note', 'Privacy commitments'],
  },
  {
    file: 'src/app/(marketing)/method-and-evidence/page.tsx',
    allOf: ['Source note', 'Source citations'],
  },
  {
    file: 'src/app/(marketing)/evidence-hub/page.tsx',
    allOf: ['Complete source index', 'Key finding:'],
  },
  {
    file: 'src/app/(marketing)/concierge/concierge-waitlist.tsx',
    allOf: ['Trust and source note', 'Confidential intake details'],
  },
  {
    file: 'src/app/(marketing)/demo/page.tsx',
    allOf: ['Source note', 'pilot cohorts'],
  },
  {
    file: 'src/app/(marketing)/security/page.tsx',
    allOf: ['AI governance and regulatory compliance', 'Incident response'],
  },
  {
    file: 'src/app/(marketing)/for-coaches/trust-pack/page.tsx',
    allOf: ['Trust and confidentiality:', 'Governance path:', '/security'],
  },
  {
    file: 'src/app/(marketing)/for-outplacement/trust-pack/page.tsx',
    allOf: ['Board-safe claims policy', 'Governance path:', '/security'],
  },
]

const failures = []

for (const check of checks) {
  const filePath = path.join(root, check.file)
  if (!fs.existsSync(filePath)) {
    failures.push(`${check.file}: file is missing`)
    continue
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const missing = check.allOf.filter((needle) => !content.includes(needle))
  if (missing.length > 0) {
    failures.push(`${check.file}: missing required trust/proof markers: ${missing.join(', ')}`)
  }
}

if (failures.length > 0) {
  console.error('Marketing trust/proof placement gate failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`marketing trust/proof placement gate passed (${checks.length} routes/components checked).`)
