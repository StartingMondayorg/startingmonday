import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..')
const scriptPath = path.join(repositoryRoot, 'scripts', 'check-coverage-thresholds.mjs')
const temporaryDirectories: string[] = []
const describeFixture = process.env.SKIP_GIT_FIXTURE_TEST === '1' ? describe.skip : describe

function writeFile(root: string, relativePath: string, content: string) {
  const filePath = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function runGit(root: string, args: string[]) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim()
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-thresholds-'))
  const fixtureRoot = path.resolve(root)
  if (fixtureRoot === repositoryRoot || fixtureRoot.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new Error(`Coverage fixture must not overlap the active worktree: ${fixtureRoot}`)
  }
  temporaryDirectories.push(root)

  runGit(root, ['init'])
  runGit(root, ['config', 'user.email', 'coverage-test@example.com'])
  runGit(root, ['config', 'user.name', 'Coverage Test'])

  writeFile(root, 'src/lib/legacy.ts', 'export const legacy = false\n')
  writeFile(root, 'src/lib/changed.ts', 'export const changed = false\n')
  runGit(root, ['add', '.'])
  runGit(root, ['commit', '-m', 'base'])
  const baseRef = runGit(root, ['rev-parse', 'HEAD'])

  writeFile(root, 'src/lib/changed.ts', 'export const changed = true\n')
  runGit(root, ['add', '.'])
  runGit(root, ['commit', '-m', 'change covered file'])

  writeFile(root, 'config/coverage-thresholds.json', JSON.stringify({
    global: { lines: 0, functions: 0, statements: 0, branches: 0 },
    folders: [{
      prefix: 'src/lib/',
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 55 },
    }],
  }))
  writeFile(root, 'coverage/lcov.info', [
    'SF:src/lib/legacy.ts',
    'LF:100',
    'LH:0',
    'FNF:10',
    'FNH:0',
    'BRF:20',
    'BRH:0',
    'end_of_record',
    'SF:src/lib/changed.ts',
    'LF:10',
    'LH:10',
    'FNF:2',
    'FNH:2',
    'BRF:4',
    'BRH:4',
    'end_of_record',
    '',
  ].join('\n'))

  return { root, baseRef }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describeFixture('coverage folder thresholds', () => {
  it('evaluates only changed production files in diff-scoped mode', () => {
    const { root, baseRef } = createFixture()

    const result = execFileSync(process.execPath, [
      scriptPath,
      '--lcov=coverage/lcov.info',
      '--config=config/coverage-thresholds.json',
      `--base-ref=${baseRef}`,
      '--head-ref=HEAD',
    ], { cwd: root, encoding: 'utf8', stdio: 'pipe' })

    expect(result).toContain('src/lib/ (changed files) lines: 100%')
    expect(result).toContain('coverage-thresholds gate passed')
  })

  it('still evaluates the whole folder outside diff-scoped mode', () => {
    const { root } = createFixture()

    const result = spawnSync(process.execPath, [
      scriptPath,
      '--lcov=coverage/lcov.info',
      '--config=config/coverage-thresholds.json',
    ], { cwd: root, encoding: 'utf8', stdio: 'pipe' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('src/lib/: lines 9.09% < 70%')
  })
})