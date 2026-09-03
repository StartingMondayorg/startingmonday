import { describe, expect, it } from 'vitest'
import { fingerprint, normalizeTestNames } from './fingerprint'

describe('fingerprint', () => {
  it('is stable for the same class and signal', () => {
    expect(fingerprint('synthetics-p0', 'a,b')).toBe(fingerprint('synthetics-p0', 'a,b'))
  })

  it('separates the same signal seen under different alert classes', () => {
    expect(fingerprint('synthetics-p0', 'a')).not.toBe(fingerprint('post-deploy-synthetics', 'a'))
  })

  it('is 32 hex characters', () => {
    expect(fingerprint('fast-burn', 'fast-burn')).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe('normalizeTestNames', () => {
  it('collapses reordered test lists to one signal', () => {
    // The storm-dedup property: Playwright does not order failed specs stably.
    expect(normalizeTestNames('briefing.spec.ts|auth.spec.ts')).toBe(
      normalizeTestNames('auth.spec.ts|briefing.spec.ts'),
    )
  })

  it('strips paths, bullets and case, and de-duplicates', () => {
    expect(normalizeTestNames('- tests/e2e/Auth.spec.ts | tests/e2e/auth.spec.ts')).toBe('auth.spec.ts')
  })

  it('treats a different failing test as a different signal', () => {
    expect(normalizeTestNames('auth.spec.ts')).not.toBe(normalizeTestNames('billing.spec.ts'))
  })

  it('returns empty for empty input so callers can fall back', () => {
    expect(normalizeTestNames('')).toBe('')
  })
})
