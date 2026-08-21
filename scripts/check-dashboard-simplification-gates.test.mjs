import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const script = path.join(root, 'scripts', 'check-dashboard-simplification-gates.mjs')
const source = path.join(root, 'src', 'app', '(dashboard)', 'dashboard', 'page.tsx')

test('dashboard simplification gate passes on the flagged layout', () => {
  execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' })
})

test('dashboard simplification gate rejects an added zone', () => {
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sm-dashboard-gate-'))
  const fixture = path.join(fixtureDirectory, 'page.tsx')
  const content = fs.readFileSync(source, 'utf8').replace(
    'data-first-mile-section="dashboard_this_week"',
    'data-first-mile-section="dashboard_extra"',
  )
  fs.writeFileSync(fixture, content)

  assert.throws(
    () => execFileSync(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, DASHBOARD_SIMPLIFICATION_SOURCE: fixture },
      stdio: 'pipe',
    }),
    /Dashboard simplification gate/,
  )
})

test('dashboard simplification gate rejects a loading boundary without main', () => {
  const loadingPath = path.join(root, 'src', 'app', '(dashboard)', 'dashboard', 'loading.tsx')
  const original = fs.readFileSync(loadingPath, 'utf8')
  const replacement = original.replace('<main ', '<section ').replace('</main>', '</section>')
  fs.writeFileSync(loadingPath, replacement)

  try {
    assert.throws(
      () => execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' }),
      /Dashboard simplification gate/,
    )
  } finally {
    fs.writeFileSync(loadingPath, original)
  }
})