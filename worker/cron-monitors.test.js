import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// CRON_MONITORS duplicates each job's cron expression so Sentry knows when a
// run is late. Duplication is the whole risk: someone reschedules a job at the
// cron.schedule() call, the monitor keeps the old expression, and Sentry starts
// reporting misses for a job that is running exactly as intended. Alert fatigue
// then trains everyone to ignore the channel, which costs more than the monitor
// was ever worth. These tests fail the build instead.

const source = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

function cronEntries() {
  return [...source.matchAll(/cron\.schedule\('([^']+)'[^\n]*?runJob\('([^']+)'/g)]
    .map(([, expression, job]) => ({ expression, job }))
}

function monitorEntries() {
  const block = source.match(/const CRON_MONITORS = \{([\s\S]*?)\n\}/)
  if (!block) throw new Error('CRON_MONITORS block not found in worker/index.js')
  return [...block[1].matchAll(
    /'([^']+)':\s*\{\s*schedule:\s*'([^']+)',\s*checkinMargin:\s*(\d+),\s*maxRuntime:\s*(\d+)\s*\}/g,
  )].map(([, job, schedule, checkinMargin, maxRuntime]) => ({
    job,
    schedule,
    checkinMargin: Number(checkinMargin),
    maxRuntime: Number(maxRuntime),
  }))
}

// Minutes, mirroring JOB_TIMEOUTS_MS / DEFAULT_JOB_TIMEOUT_MS in index.js.
function jobTimeoutMinutes(job) {
  const block = source.match(/const JOB_TIMEOUTS_MS = \{([\s\S]*?)\n\}/)
  const inline = source.match(new RegExp(`JOB_TIMEOUTS_MS\\['${job}'\\] = (\\d+) \\* 60_000`))
  if (inline) return Number(inline[1])
  const entry = block?.[1].match(new RegExp(`'${job}':\\s*(\\d+) \\* 60_000`))
  if (entry) return Number(entry[1])
  const fallback = source.match(/const DEFAULT_JOB_TIMEOUT_MS = (\d+) \* 60_000/)
  return Number(fallback[1])
}

describe('Sentry cron monitors', () => {
  it('parses at least one monitor', () => {
    expect(monitorEntries().length).toBeGreaterThan(0)
  })

  it('monitors only jobs that are actually scheduled', () => {
    const scheduled = new Set(cronEntries().map(({ job }) => job))
    for (const { job } of monitorEntries()) {
      expect(scheduled, `${job} has a cron monitor but no cron.schedule() entry`).toContain(job)
    }
  })

  it('keeps each monitor schedule identical to its cron.schedule() expression', () => {
    const entries = cronEntries()
    for (const { job, schedule } of monitorEntries()) {
      const registrations = entries.filter(e => e.job === job)
      // A job registered at several times has no single schedule to mirror, so
      // it cannot be monitored this way without picking one arbitrarily.
      expect(registrations, `${job} is registered ${registrations.length} times`).toHaveLength(1)
      expect(registrations[0].expression, `${job} monitor schedule drifted`).toBe(schedule)
    }
  })

  it('leaves room for the in-process timeout to fire first', () => {
    for (const { job, maxRuntime } of monitorEntries()) {
      expect(
        maxRuntime,
        `${job} maxRuntime (${maxRuntime}m) must exceed its job timeout so the ` +
        'worker reports a real error before Sentry infers one',
      ).toBeGreaterThanOrEqual(jobTimeoutMinutes(job))
    }
  })
})
