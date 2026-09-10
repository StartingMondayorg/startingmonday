import { describe, expect, it } from 'vitest'
import { MAX_CHANGED_LINES, MAX_FILES, filesInPatch, validatePatch } from './patch-safety'

function diff(path: string, added = 1): string {
  const lines = Array.from({ length: added }, (_, i) => `+  const x${i} = ${i}`).join('\n')
  return [
    `diff --git a/${path} b/${path}`,
    'index 1111111..2222222 100644',
    `--- a/${path}`,
    `+++ b/${path}`,
    '@@ -1,2 +1,3 @@',
    ' context',
    lines,
  ].join('\n')
}

describe('validatePatch: accepts legitimate fixes', () => {
  it('accepts a small change under src/', () => {
    expect(validatePatch(diff('src/lib/foo.ts')).ok).toBe(true)
  })

  it('accepts worker/ and tests/, so a fix can carry its regression test', () => {
    expect(validatePatch(diff('worker/jobs/bar.js')).ok).toBe(true)
    expect(validatePatch(diff('tests/e2e/baz.spec.ts')).ok).toBe(true)
  })

  it('accepts a multi-file change within the limits', () => {
    const patch = [diff('src/a.ts'), diff('src/b.ts'), diff('tests/c.spec.ts')].join('\n')
    expect(validatePatch(patch).ok).toBe(true)
  })
})

describe('validatePatch: refuses what it must', () => {
  // Each of these is something a confused or manipulated agent could plausibly
  // produce, and that we could not cheaply undo.
  it.each([
    ['a workflow file', '.github/workflows/ci.yml', 'workflow-or-action'],
    ['a composite action', '.github/actions/x/action.yml', 'workflow-or-action'],
    ['the dependency manifest', 'package.json', 'dependency-manifest'],
    ['the lockfile', 'package-lock.json', 'dependency-manifest'],
    ['a database migration', 'supabase/migrations/1700_x.sql', 'database-migration'],
    ['an env file', '.env.production', 'environment-file'],
    ['a guard script', 'scripts/check-api-guards.mjs', 'guard-script'],
    ['the secret scanner config', '.gitleaks.toml', 'secret-scanner-config'],
    ['anything outside the allow-list', 'docs/architecture.md', 'outside-allowed-paths'],
    ['the repo root', 'README.md', 'outside-allowed-paths'],
  ])('refuses %s', (_label, path, rule) => {
    const report = validatePatch(diff(path))
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain(rule)
  })

  it('refuses the incident loop modifying itself', () => {
    // Otherwise the agent could widen its own guardrails.
    const report = validatePatch(diff('src/lib/incident/patch-safety.ts'))
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('incident-loop-self-modification')
  })

  it('refuses path traversal even when it resolves inside src/', () => {
    const report = validatePatch(diff('src/../.github/workflows/ci.yml'))
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('path-traversal')
  })

  it('refuses absolute paths', () => {
    expect(validatePatch(diff('/etc/passwd')).ok).toBe(false)
  })

  it('refuses a patch touching too many files', () => {
    const patch = Array.from({ length: MAX_FILES + 1 }, (_, i) => diff(`src/f${i}.ts`)).join('\n')
    const report = validatePatch(patch)
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('too-many-files')
  })

  it('refuses a patch that is too large to review', () => {
    const report = validatePatch(diff('src/big.ts', MAX_CHANGED_LINES + 1))
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('too-many-lines')
  })

  it('refuses an empty patch', () => {
    expect(validatePatch('').ok).toBe(false)
    expect(validatePatch('   \n  ').violations.map(v => v.rule)).toContain('empty')
  })

  it('refuses output that is not a diff at all', () => {
    const report = validatePatch('I decided not to change anything.')
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('unparseable')
  })

  it('refuses a rename that moves a file out of the allowed tree', () => {
    const patch = 'diff --git a/src/ok.ts b/.github/workflows/evil.yml\nsimilarity index 100%\n'
    const report = validatePatch(patch)
    expect(report.ok).toBe(false)
    expect(report.violations.map(v => v.rule)).toContain('workflow-or-action')
  })
})

describe('filesInPatch', () => {
  it('reads both sides of a rename', () => {
    expect(filesInPatch('diff --git a/src/old.ts b/src/new.ts\n')).toEqual(['src/old.ts', 'src/new.ts'])
  })

  it('ignores /dev/null for new and deleted files', () => {
    expect(filesInPatch('diff --git a/dev/null b/src/new.ts\n')).toContain('src/new.ts')
  })

  it('deduplicates the common same-path case', () => {
    expect(filesInPatch(diff('src/a.ts'))).toEqual(['src/a.ts'])
  })
})

describe('line counting', () => {
  it('does not count file headers as changes', () => {
    const report = validatePatch(diff('src/a.ts', 3))
    expect(report.addedLines).toBe(3)
    expect(report.removedLines).toBe(0)
  })
})
