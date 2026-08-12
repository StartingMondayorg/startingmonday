import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('generated monitoring route policy', () => {
  it('skips the exact dashboard admin root for standard synthetic users', () => {
    execFileSync(process.execPath, ['scripts/generate-monitoring-harness.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    const generated = readFileSync('tests/e2e/generated/page-routes.generated.spec.ts', 'utf8')
    const target = generated.match(/\{\s*"skipReason":\s*"([^"]+)",\s*"route":\s*"\/dashboard\/admin"[\s\S]*?\}/)

    expect(target?.[1]).toBe('Admin-only route requires elevated staff role not guaranteed in synthetic auth context')
  })
})