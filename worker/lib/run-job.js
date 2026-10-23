// Cron job runner with a soft timeout (code review 2026-10-22, P1-3).
//
// A JavaScript promise cannot be cancelled, so a timed-out job keeps running.
// The runner therefore reports the timeout (Sentry check-in closed as 'error',
// log, alert) but leaves jobStatus[name] = 'running' until the job's promise
// actually settles. That keeps the next cron tick from starting an overlapping
// run of the same job while the first one is still doing work.

export function createJobRunner({
  jobStatus,
  getTimeoutMs,
  startCheckIn = () => undefined,
  closeCheckIn = () => {},
  onTimeout = () => {},
  onError = () => {},
  logger,
}) {
  return async function runJob(name, fn) {
    if (jobStatus[name] === 'running') {
      logger.warn(`${name}: already running, skipping this tick`)
      return
    }
    jobStatus[name] = 'running'
    const start = Date.now()
    const timeoutMs = getTimeoutMs(name)
    const checkInId = startCheckIn(name)

    const settled = Promise.resolve()
      .then(fn)
      .then(() => ({ ok: true }), error => ({ ok: false, error }))

    let timer
    const timedOut = new Promise(resolve => {
      timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs)
    })
    const first = await Promise.race([settled, timedOut])
    clearTimeout(timer)

    if (first.timedOut) {
      closeCheckIn(name, checkInId, 'error')
      onTimeout(name, timeoutMs)
      // Not awaited: runJob returns now so the cron callback is not held open,
      // but the job stays 'running' until its own work finishes.
      settled.then(outcome => {
        jobStatus[name] = 'idle'
        logger.warn(`${name}: settled after timeout`, {
          event: 'job_settled_after_timeout',
          job: name,
          ms: Date.now() - start,
          ok: outcome.ok,
          ...(outcome.ok ? {} : { error: outcome.error?.message }),
        })
      })
      return
    }

    jobStatus[name] = 'idle'
    if (first.ok) {
      closeCheckIn(name, checkInId, 'ok')
      logger.info(`${name}: finished`, { ms: Date.now() - start })
      return
    }
    closeCheckIn(name, checkInId, 'error')
    onError(name, first.error)
  }
}
