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

function getUncommittedFiles() {
  try {
    return execSync('git status --porcelain=v1 --untracked-files=all', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function includeUncommitted(files) {
  return [...new Set([...files, ...getUncommittedFiles()])]
}

function getChangedFiles() {
  const baseRef = process.env.LANDING_GUARD_BASE_REF

  // Try explicit base SHA first (provided by CI as PR base commit).
  if (baseRef) {
    const result = tryDiff(`${baseRef}...HEAD`)
    if (result !== null) return includeUncommitted(result)
  }

  // Try origin/main (works locally and in full-depth clones).
  const fromOriginMain = tryDiff('origin/main...HEAD')
  if (fromOriginMain !== null) return includeUncommitted(fromOriginMain)

  // Fallback: single-parent diff — works in shallow clones with fetch-depth: 2.
  const fromParent = tryDiff('HEAD^1..HEAD')
  if (fromParent !== null) return includeUncommitted(fromParent)

  // Cannot determine changed files via any strategy — fail closed rather than
  // silently treating an unresolvable diff as "no changes." A shallow clone,
  // force-push, or rebase edge case here should block the merge with a clear
  // diagnostic, not pass unnoticed.
  console.error('landing-page-guard: could not determine changed files (base ref, origin/main, and HEAD^1 diffs all failed)')
  console.error('This usually means the checkout is too shallow or the base ref is unavailable. Ensure `fetch-depth: 0` (or at least enough history) in the checkout step.')
  process.exit(1)
}

const guardedFiles = new Set([
  'src/app/(marketing)/page.tsx',
  'src/app/(marketing)/example/page.tsx',
  'src/app/components/LandingPage.tsx',
  'src/app/components/SignalTimelineCard.tsx',
  'src/app/components/HeroPageViewTelemetry.tsx',
  'src/lib/starting-monday-hero-content.ts',
  'src/lib/channel-metrics-events.ts',
  'src/lib/feature-flags.ts',
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
