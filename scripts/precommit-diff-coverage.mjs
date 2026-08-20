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
function runNpm(args) {
  if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], { stdio: 'inherit' })
    return
  }
  execFileSync('npm', args, { stdio: 'inherit' })
}

// This test creates temporary Git repositories. It is run by the normal test
// suite, but excluded from coverage instrumentation because Vitest workers can
// share mutable Git process state on Windows.
runNpm(['run', 'test:coverage', '--', '--exclude=src/lib/check-coverage-thresholds.test.ts'])
runNpm(['run', 'coverage:folders:check', '--', '--staged'])