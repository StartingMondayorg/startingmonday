import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('generated monitoring route policy', () => {
  it('skips the exact dashboard admin root for standard synthetic users', () => {
    const reason = execFileSync(process.execPath, [
      'scripts/generate-monitoring-harness.mjs',
      '--route-skip-reason=/dashboard/admin',
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8',
    }).trim()

    expect(reason).toBe('Admin-only route requires elevated staff role not guaranteed in synthetic auth context')
  })
})