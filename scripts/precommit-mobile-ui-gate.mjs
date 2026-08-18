#!/usr/bin/env node
import { execSync } from 'child_process'

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function hasMobileUiChanges(stagedFiles) {
  return stagedFiles.some((file) =>
    file.startsWith('src/app/(dashboard)/dashboard/') ||
    file === 'src/app/(dashboard)/_components/BottomNav.tsx' ||
    file === 'src/app/globals.css' ||
    file.startsWith('src/components/')
  )
}

const staged = sh('git diff --cached --name-only')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

if (!hasMobileUiChanges(staged)) {
  console.log('mobile-ui gate: no relevant staged files, skipping')
  process.exit(0)
}

console.log('mobile-ui gate: relevant staged files detected')
for (const f of staged) {
  if (f.startsWith('src/app/(dashboard)/dashboard/') || f === 'src/app/(dashboard)/_components/BottomNav.tsx' || f === 'src/app/globals.css') {
    console.log(` - ${f}`)
  }
}

console.log('mobile-ui gate: running local mobile UI contract checks')
execSync('node scripts/check-mobile-ui-contract.mjs', {
  stdio: 'inherit',
})

// Playwright suites intentionally do not run in this hook. Pre-commit checks
// must be fast and environment-independent; mobile E2E runs in CI against the
// PR's own build (see ci.yml: mobile-visual-smoke, mobile UX contract jobs).

console.log('mobile-ui gate: passed')
