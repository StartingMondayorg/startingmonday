#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

const stagedSource = execFileSync('git', [
  'diff', '--cached', '--name-only', '--', 'src/**/*.ts', 'src/**/*.tsx',
], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter((value) => value && !/\.(test|spec)\.(ts|tsx)$/.test(value))

const coveredSource = stagedSource.filter((file) =>
  file.startsWith('src/lib/') || file.startsWith('src/app/api/') || file.startsWith('src/app/'),
)

if (coveredSource.length === 0) {
  console.log('staged diff coverage: skipped (no unit-covered production source files)')
  process.exit(0)
}

console.log(`staged diff coverage: checking ${coveredSource.length} production source file(s)`)
execFileSync('npm', ['run', 'test:coverage'], { stdio: 'inherit' })
execFileSync('npm', ['run', 'coverage:folders:check', '--', '--staged'], { stdio: 'inherit' })