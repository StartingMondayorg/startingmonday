import { describe, it, expect, vi, afterEach } from 'vitest'
import { createLimiter } from './concurrency.js'

describe('createLimiter', () => {
  it('never exceeds the limit, whatever the completion order', async () => {
    const limit = 3
    const run = createLimiter(limit)
    let active = 0
    let peak = 0

    // Randomised durations so slots free out of order, which is how the real
    // render queue behaves -- a fast ATS page beside a slow SPA.
    const tasks = Array.from({ length: 25 }, (_, i) => run(async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise(r => setTimeout(r, (i * 7) % 13))
      active--
      return i
    }))

    const results = await Promise.all(tasks)

    expect(peak).toBeLessThanOrEqual(limit)
    expect(peak).toBe(limit)          // and it does use the whole budget
    expect(results).toHaveLength(25)
    expect(active).toBe(0)
  })

  it('frees the slot when a task rejects, so one failure cannot wedge the queue', async () => {
    const run = createLimiter(1)
    await expect(run(async () => { throw new Error('render failed') })).rejects.toThrow('render failed')

    // If the rejected task had leaked its slot, this would hang rather than resolve.
    await expect(run(async () => 'recovered')).resolves.toBe('recovered')
  })
})

describe('MAX_RENDER_CONCURRENCY', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

  async function load() {
    vi.resetModules()
    return (await import('../scanner/fetch-page.js')).MAX_RENDER_CONCURRENCY
  }

  it('reads the configured ceiling', async () => {
    vi.stubEnv('BROWSERLESS_MAX_CONCURRENCY', '7')
    expect(await load()).toBe(7)
  })

  // An unset or malformed value must never authorise more concurrency than the
  // smallest plan allows. The free plan ceiling is 2; the default sits under it.
  it('falls back conservatively when unset or unparseable', async () => {
    vi.stubEnv('BROWSERLESS_MAX_CONCURRENCY', '')
    expect(await load()).toBe(3)

    vi.stubEnv('BROWSERLESS_MAX_CONCURRENCY', 'not-a-number')
    expect(await load()).toBe(3)
  })

  it('never drops below one, which would stall every render', async () => {
    vi.stubEnv('BROWSERLESS_MAX_CONCURRENCY', '0')
    expect(await load()).toBe(1)

    vi.stubEnv('BROWSERLESS_MAX_CONCURRENCY', '-5')
    expect(await load()).toBe(1)
  })
})
