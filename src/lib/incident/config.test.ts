import { describe, expect, it } from 'vitest'
import { classConfig, decideDispatch, findSuppression, globalDailyLimit } from './config'
import { fingerprint } from './fingerprint'

const NOW = new Date('2026-09-10T00:00:00Z')

function decide(over: Partial<Parameters<typeof decideDispatch>[0]> = {}) {
  return decideDispatch({
    alertClass: 'app-error-new',
    signalKey: '123',
    fingerprint: fingerprint('app-error-new', '123'),
    occurrenceCount: 1,
    enabled: true,
    now: NOW,
    ...over,
  })
}

describe('classConfig', () => {
  it('falls back to notify-only for an unrecognised class', () => {
    // A new alert shape must never be able to auto-dispatch.
    expect(classConfig('something-we-have-never-seen').mode).toBe('notify-only')
  })

  it('reads the manifest for a known class', () => {
    expect(classConfig('app-error-new').mode).toBe('diagnose-and-patch')
    expect(classConfig('deploy-stalled').mode).toBe('notify-only')
  })

  it('exposes a global daily limit', () => {
    expect(globalDailyLimit()).toBeGreaterThan(0)
  })
})

describe('decideDispatch', () => {
  it('dispatches a first-occurrence actionable alert', () => {
    expect(decide()).toEqual({ dispatch: true, mode: 'diagnose-and-patch' })
  })

  it('refuses when the kill switch is off', () => {
    expect(decide({ enabled: false })).toMatchObject({ dispatch: false, reason: 'responder_disabled' })
  })

  it('refuses a notify-only class', () => {
    expect(decide({ alertClass: 'deploy-stalled', signalKey: 'abc' })).toMatchObject({
      dispatch: false,
      reason: 'class_notify_only',
    })
  })

  it('refuses repeat deliveries of a fingerprint it already dispatched', () => {
    // The storm rule: alert 2..12 of one incident cost nothing.
    expect(decide({ occurrenceCount: 12 })).toMatchObject({
      dispatch: false,
      reason: 'already_dispatched_for_fingerprint',
    })
  })

  it('waits for a second occurrence when the class demands one', () => {
    const first = decide({ alertClass: 'synthetics-p0', signalKey: 'auth', occurrenceCount: 1 })
    expect(first).toMatchObject({ dispatch: false, reason: 'awaiting_consecutive_1_of_2' })
    expect(decide({ alertClass: 'synthetics-p0', signalKey: 'auth', occurrenceCount: 2 })).toMatchObject({
      dispatch: true,
    })
  })

  it('treats a total synthetic wipeout as infrastructure, not a code bug', () => {
    expect(
      decide({ alertClass: 'synthetics-p0', signalKey: 'auth', occurrenceCount: 2, allFailing: true }),
    ).toMatchObject({ dispatch: false, reason: 'all_checks_failing_is_infra' })
  })

  it('honours a live suppression', () => {
    expect(
      decide({ alertClass: 'smoke-failure', signalKey: 'monitoring:main', now: new Date('2026-09-10') }),
    ).toMatchObject({ dispatch: false })
  })
})

describe('findSuppression', () => {
  it('stops applying once the entry expires', () => {
    const before = findSuppression('smoke-failure', 'monitoring:main', 'x', new Date('2026-10-01'))
    const after = findSuppression('smoke-failure', 'monitoring:main', 'x', new Date('2026-11-01'))
    expect(before).not.toBeNull()
    expect(after).toBeNull()
  })

  it('ignores an entry missing its owner or expiry', () => {
    expect(findSuppression('app-error-new', 'nope', 'nope', new Date('2026-09-10'))).toBeNull()
  })
})
