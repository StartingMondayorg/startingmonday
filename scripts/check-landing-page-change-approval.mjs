#!/usr/bin/env node

import { execSync } from 'node:child_process'

function tryDiff(ref) {
  try {
    return execSync(`git diff --name-only ${ref}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return null
  }
}

function getChangedFiles() {
  const baseRef = process.env.LANDING_GUARD_BASE_REF

  // Try explicit base SHA first (provided by CI as PR base commit).
  if (baseRef) {
    const result = tryDiff(`${baseRef}...HEAD`)
    if (result !== null) return result
  }

  // Try origin/main (works locally and in full-depth clones).
  const fromOriginMain = tryDiff('origin/main...HEAD')
  if (fromOriginMain !== null) return fromOriginMain

  // Fallback: single-parent diff — works in shallow clones with fetch-depth: 2.
  const fromParent = tryDiff('HEAD^1..HEAD')
  if (fromParent !== null) return fromParent

  // Cannot determine changed files — fail safe (pass).
  console.warn('landing-page-guard: could not determine changed files; skipping check')
  return []
}

const guardedFiles = new Set([
  'src/app/(marketing)/page.tsx',
  'src/app/components/LandingPage.tsx',
])

const changedFiles = getChangedFiles()
const changedGuarded = changedFiles.filter((file) => guardedFiles.has(file))

if (changedGuarded.length === 0) {
  console.log('landing-page-guard: pass (no guarded landing page changes detected)')
  process.exit(0)
}

const explicitApproval = process.env.ALLOW_LANDING_PAGE_CHANGE === 'true'

if (!explicitApproval) {
  console.error('landing-page-guard: blocked')
  console.error('Detected landing page changes:')
  for (const file of changedGuarded) {
    console.error(`  - ${file}`)
  }
  console.error('To approve: add the "allow-landing-page-change" label to the PR, or set ALLOW_LANDING_PAGE_CHANGE=true repo variable after explicit owner approval.')
  process.exit(1)
}

console.log('landing-page-guard: pass (explicit approval flag provided)')
