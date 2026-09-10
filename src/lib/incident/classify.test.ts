import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classify, extractField, flattenText, isSentryTestNotification } from './classify'
import { fingerprint } from './fingerprint'

// Fixtures are the same files the Stage 0 replay harness posts at the live
// route, so a classification bug shows up here before it reaches production.
function fixture(name: string) {
  return JSON.parse(readFileSync(new URL(`../../../docs/fixtures/alerts/${name}.json`, import.meta.url), 'utf8'))
}

describe('classify', () => {
  it.each([
    ['synthetics-p0', 'synthetics-p0'],
    ['post-deploy-synthetics-rollback', 'post-deploy-synthetics'],
    ['deploy-stalled', 'deploy-stalled'],
    ['sha-not-live', 'sha-not-live'],
    ['smoke-failure', 'smoke-failure'],
    ['canary-gate', 'canary-gate'],
    ['fast-burn', 'fast-burn'],
    ['app-error-new', 'app-error-new'],
  ])('classifies the %s fixture as %s', (name, expected) => {
    expect(classify(fixture(name))?.alertClass).toBe(expected)
  })

  it('returns null for the routing test so slack-alert-test.yml never wakes the agent', () => {
    expect(classify(fixture('routing-test'))).toBeNull()
  })

  it('returns null for unrelated chatter', () => {
    expect(classify({ type: 'message', text: 'deploying now, wish me luck' })).toBeNull()
  })

  it('gives two synthetic alerts with reordered test names one fingerprint', () => {
    // This is the storm-dedup guarantee, end to end: same failing tests, a
    // different deploy SHA and a different risk score, one incident.
    const a = classify(fixture('synthetics-p0'))!
    const b = classify(fixture('synthetics-p0-reordered'))!
    expect(a.evidence.sha).not.toBe(b.evidence.sha)
    expect(fingerprint(a.alertClass, a.signalKey)).toBe(fingerprint(b.alertClass, b.signalKey))
  })

  it('gives a different failing test set a different fingerprint', () => {
    const a = classify(fixture('synthetics-p0'))!
    const b = classify(fixture('post-deploy-synthetics-rollback'))!
    expect(fingerprint(a.alertClass, a.signalKey)).not.toBe(fingerprint(b.alertClass, b.signalKey))
  })

  it('keys Sentry alerts on the issue id from the permalink', () => {
    const result = classify(fixture('app-error-new'))!
    expect(result.signalKey).toBe('6412887301')
  })

  it('separates a Sentry rate alert from a new-issue alert', () => {
    const rate = classify({
      type: 'message',
      text: 'Metric alert: error rate above threshold https://sentry.io/organizations/sm/issues/999/',
    })!
    expect(rate.alertClass).toBe('app-error-rate')
  })

  it('extracts the short SHA from a linked commit field', () => {
    expect(classify(fixture('sha-not-live'))!.evidence.sha).toBe('14d7ac9d')
  })

  it('collapses every canary failure into one bucket, since the payload has no discriminator', () => {
    expect(classify(fixture('canary-gate'))!.signalKey).toBe('canary-gate')
  })
})

describe('isSentryTestNotification', () => {
  // A real test notification that reached #alerts-prod and consumed an agent
  // dispatch. The fixture is the captured payload, not a reconstruction.
  it('recognises the real captured test notification', () => {
    expect(isSentryTestNotification(flattenText(fixture('sentry-test-notification')))).toBe(true)
  })

  it('does not flag a genuine Sentry issue alert', () => {
    expect(isSentryTestNotification(flattenText(fixture('app-error-new')))).toBe(false)
  })

  it('does not flag a real alert whose rule id merely starts with -1', () => {
    // -1 must be the whole id, not a prefix of -1234.
    expect(isSentryTestNotification('https://sentry.io/x?alert_rule_id=-1234')).toBe(false)
    expect(isSentryTestNotification('{"issue":1,"rule":-1234}  sentry.io')).toBe(false)
  })

  it('ignores rule:-1 appearing outside a Sentry message', () => {
    expect(isSentryTestNotification('some log line with "rule": -1 in it')).toBe(false)
  })
})

describe('flattenText', () => {
  it('ignores Block Kit structural type names so they cannot collide with alert phrases', () => {
    const text = flattenText({ blocks: [{ type: 'header', text: { type: 'plain_text', text: 'real content' } }] })
    expect(text).toContain('real content')
    expect(text).not.toContain('plain_text')
  })
})

describe('extractField', () => {
  it('unwraps a Slack link to its display text', () => {
    expect(extractField('*SHA:* <https://x/y|abc1234>', 'SHA')).toBe('abc1234')
  })

  it('returns null for an absent field', () => {
    expect(extractField('*Age:* 5 minutes', 'SHA')).toBeNull()
  })
})
