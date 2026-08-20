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
// On Windows `npm` is npm.cmd, which execFileSync cannot spawn without a shell.
const npmOpts = { stdio: 'inherit', shell: process.platform === 'win32' }
execFileSync('npm', ['run', 'test:coverage'], npmOpts)
execFileSync('npm', ['run', 'coverage:folders:check', '--', '--staged'], npmOpts)