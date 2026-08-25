import { describe, it, expect, vi, beforeEach } from 'vitest'
import { warnIfTruncated } from './query-limits.js'
import { logger } from './logger.js'

describe('warnIfTruncated', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('stays quiet when the result is under the cap', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    expect(warnIfTruncated(new Array(198), 5000, { job: 'scan-job' })).toBe(198)
    expect(warn).not.toHaveBeenCalled()
  })

  // Exactly-at-the-cap is the dangerous case: indistinguishable from a query
  // that genuinely matched that many rows.
  it('warns when the result sits exactly on the cap', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    expect(warnIfTruncated(new Array(5000), 5000, { job: 'scan-job', query: 'companies' })).toBe(5000)

    expect(warn).toHaveBeenCalledTimes(1)
    const [, context] = warn.mock.calls[0]
    expect(context).toMatchObject({
      event: 'query_limit_reached',
      job: 'scan-job',
      query: 'companies',
      returned: 5000,
      limit: 5000,
    })
  })

  it('treats null and undefined as an empty result rather than throwing', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    expect(warnIfTruncated(null, 5000)).toBe(0)
    expect(warnIfTruncated(undefined, 5000)).toBe(0)
    expect(warn).not.toHaveBeenCalled()
  })

  // A non-positive cap is not a cap. Without the guard this would warn on every
  // empty result forever, and a noisy warning is one nobody reads.
  it('does not warn against a non-positive cap', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    expect(warnIfTruncated([], 0)).toBe(0)
    expect(warnIfTruncated([], undefined)).toBe(0)
    expect(warn).not.toHaveBeenCalled()
  })
})
