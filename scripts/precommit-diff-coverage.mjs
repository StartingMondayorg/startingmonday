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

function gitIdentity() {
  return {
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  }
}

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
const before = gitIdentity()
runNpm(['run', 'test:coverage'])
runNpm(['run', 'coverage:folders:check', '--', '--staged'])
const after = gitIdentity()
if (before.head !== after.head || before.branch !== after.branch) {
  throw new Error(`Coverage hook changed Git identity: ${before.branch}@${before.head} -> ${after.branch}@${after.head}`)
}