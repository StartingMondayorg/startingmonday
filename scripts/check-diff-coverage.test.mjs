import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const script = path.join(root, 'scripts', 'check-diff-coverage.mjs')

function git(cwd, ...args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

/*
  Builds a throwaway repo whose HEAD commit changes a .ts file by more than
  `bytes`, so the gate has to read a diff larger than that.
*/
function repoWithLargeDiff(bytes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-diff-coverage-'))
  git(dir, 'init', '--quiet')
  git(dir, 'config', 'user.email', 'test@example.com')
  git(dir, 'config', 'user.name', 'Test')
  git(dir, 'commit', '--allow-empty', '--quiet', '-m', 'base')

  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  // One statement per line so every added line is instrumentable in principle.
  const lines = []
  for (let i = 0; lines.join('\n').length < bytes; i += 1) {
    lines.push(`export const token${i} = 'rounded-2xl border border-border bg-muted/40 p-4 shadow-lg backdrop-blur-md'`)
  }
  fs.writeFileSync(path.join(dir, 'src', 'tokens.ts'), `${lines.join('\n')}\n`)
  git(dir, 'add', 'src/tokens.ts')
  git(dir, 'commit', '--quiet', '-m', 'add tokens')

  // Instrument every added line as executed-zero-times, so the gate has a real
  // denominator to measure against rather than skipping uninstrumented lines.
  const lcov = path.join(dir, 'fixture.lcov')
  const records = ['SF:src/tokens.ts']
  for (let i = 1; i <= lines.length; i += 1) records.push(`DA:${i},0`)
  records.push('end_of_record')
  fs.writeFileSync(lcov, `${records.join('\n')}\n`)

  return { dir, lcov, addedLines: lines.length }
}

test('diff coverage gate reads a diff larger than 1MiB instead of dying on it', () => {
  // 1MiB is node's default child_process maxBuffer. Reading the diff through a
  // buffered exec made any PR with a bigger TS/JS diff fail with ENOBUFS before
  // the gate could measure anything, which read like a coverage failure.
  const { dir, lcov } = repoWithLargeDiff(2 * 1024 * 1024)

  const result = spawnSync(
    process.execPath,
    [script, '--base-ref=HEAD~1', '--head-ref=HEAD', `--lcov=${lcov}`, '--min-coverage=90'],
    { cwd: dir, encoding: 'utf8' },
  )

  assert.doesNotMatch(result.stderr, /ENOBUFS/, 'gate must not overflow a stdout buffer')
  assert.match(result.stdout, /diff-coverage summary/, 'gate must report a verdict')
  // Nothing is covered in the fixture, so the verdict is a real failure.
  assert.equal(result.status, 1)

  fs.rmSync(dir, { recursive: true, force: true })
})

test('diff coverage gate counts every changed line of a large diff', () => {
  const { dir, lcov, addedLines } = repoWithLargeDiff(2 * 1024 * 1024)

  const result = spawnSync(
    process.execPath,
    [script, '--base-ref=HEAD~1', '--head-ref=HEAD', `--lcov=${lcov}`, '--min-coverage=90'],
    { cwd: dir, encoding: 'utf8' },
  )

  assert.match(result.stdout, /src\/tokens\.ts/)
  assert.ok(addedLines > 1000, 'fixture should be large enough to matter')
  // Every added line is instrumented and uncovered, so the whole file must land
  // in the denominator -- proving no hunk was dropped while streaming.
  assert.match(result.stdout, new RegExp(`covered lines: 0/${addedLines} `))

  fs.rmSync(dir, { recursive: true, force: true })
})
