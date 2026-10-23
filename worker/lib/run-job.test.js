import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createJobRunner } from './run-job.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function makeRunner(overrides = {}) {
  const jobStatus = {}
  const closeCheckIn = vi.fn()
  const onTimeout = vi.fn()
  const onError = vi.fn()
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const runJob = createJobRunner({
    jobStatus,
    getTimeoutMs: () => 1_000,
    startCheckIn: () => 'check-in-1',
    closeCheckIn,
    onTimeout,
    onError,
    logger,
    ...overrides,
  })
  return { runJob, jobStatus, closeCheckIn, onTimeout, onError, logger }
}

describe('createJobRunner', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('closes the check-in ok and goes idle when the job finishes in time', async () => {
    const { runJob, jobStatus, closeCheckIn, onError } = makeRunner()
    await runJob('briefing-job', async () => {})
    expect(jobStatus['briefing-job']).toBe('idle')
    expect(closeCheckIn).toHaveBeenCalledWith('briefing-job', 'check-in-1', 'ok')
    expect(onError).not.toHaveBeenCalled()
  })

  it('closes the check-in as an error and reports when the job throws', async () => {
    const { runJob, jobStatus, closeCheckIn, onError } = makeRunner()
    const failure = new Error('boom')
    await runJob('briefing-job', async () => { throw failure })
    expect(jobStatus['briefing-job']).toBe('idle')
    expect(closeCheckIn).toHaveBeenCalledWith('briefing-job', 'check-in-1', 'error')
    expect(onError).toHaveBeenCalledWith('briefing-job', failure)
  })

  it('keeps the job running after a timeout until its work actually settles', async () => {
    const { runJob, jobStatus, closeCheckIn, onTimeout, logger } = makeRunner()
    const work = deferred()
    const fn = vi.fn(() => work.promise)

    const first = runJob('briefing-job', fn)
    await vi.advanceTimersByTimeAsync(1_000)
    await first

    expect(onTimeout).toHaveBeenCalledWith('briefing-job', 1_000)
    expect(closeCheckIn).toHaveBeenCalledTimes(1)
    expect(closeCheckIn).toHaveBeenCalledWith('briefing-job', 'check-in-1', 'error')
    expect(closeCheckIn).not.toHaveBeenCalledWith('briefing-job', 'check-in-1', 'ok')
    expect(jobStatus['briefing-job']).toBe('running')

    // The next cron tick must not start an overlapping run.
    await runJob('briefing-job', fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith('briefing-job: already running, skipping this tick')

    work.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(jobStatus['briefing-job']).toBe('idle')
    expect(closeCheckIn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith('briefing-job: settled after timeout', expect.objectContaining({
      event: 'job_settled_after_timeout', ok: true,
    }))

    // Once settled, the following tick runs normally.
    fn.mockImplementationOnce(async () => {})
    await runJob('briefing-job', fn)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('goes idle when a timed-out job later rejects', async () => {
    const { runJob, jobStatus, onError, logger } = makeRunner()
    const work = deferred()
    const first = runJob('briefing-job', () => work.promise)
    await vi.advanceTimersByTimeAsync(1_000)
    await first
    expect(jobStatus['briefing-job']).toBe('running')

    work.reject(new Error('late failure'))
    await vi.advanceTimersByTimeAsync(0)
    expect(jobStatus['briefing-job']).toBe('idle')
    expect(onError).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('briefing-job: settled after timeout', expect.objectContaining({
      ok: false, error: 'late failure',
    }))
  })

  it('treats a synchronous throw as a job error rather than crashing the runner', async () => {
    const { runJob, jobStatus, onError } = makeRunner()
    await runJob('briefing-job', () => { throw new Error('sync') })
    expect(jobStatus['briefing-job']).toBe('idle')
    expect(onError).toHaveBeenCalledWith('briefing-job', expect.objectContaining({ message: 'sync' }))
  })
})
