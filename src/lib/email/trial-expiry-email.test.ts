import { beforeEach, describe, expect, it, vi } from 'vitest'
import { evaluateEmailCouncilQuality } from './email-council'
import {
  TRIAL_EXPIRY_FROM,
  TRIAL_EXPIRY_REPLY_TO,
  TRIAL_EXPIRY_SUBJECT,
  buildTrialExpiryEmail,
  formatTrialEndDate,
} from './trial-expiry-email'

const USER_ID = '11111111-1111-4111-8111-111111111111'

beforeEach(() => vi.stubEnv('UNSUBSCRIBE_SECRET', 'test-secret'))

function build() {
  return buildTrialExpiryEmail({
    firstName: 'Dana',
    trialEndsAt: '2026-09-14T00:00:00.000Z',
    userId: USER_ID,
  })
}

describe('formatTrialEndDate', () => {
  it('renders a UTC-stable long date', () => {
    expect(formatTrialEndDate('2026-09-14T00:00:00.000Z')).toBe('September 14, 2026')
  })

  it('does not drift across timezones for a late-day timestamp', () => {
    expect(formatTrialEndDate('2026-09-14T23:30:00.000Z')).toBe('September 14, 2026')
  })

  it('accepts a Date as well as an ISO string', () => {
    expect(formatTrialEndDate(new Date('2026-09-14T00:00:00.000Z'))).toBe('September 14, 2026')
  })
})

describe('buildTrialExpiryEmail', () => {
  it('uses the subject Rich approved', () => {
    expect(TRIAL_EXPIRY_SUBJECT).toBe('Your Starting Monday trial: 10 days left')
    expect(build().subject).toBe(TRIAL_EXPIRY_SUBJECT)
  })

  it('sends from Rich with replies routed to him', () => {
    expect(TRIAL_EXPIRY_FROM).toContain('richard@startingmonday.app')
    expect(TRIAL_EXPIRY_REPLY_TO).toBe('richard@startingmonday.app')
  })

  it('greets by first name and names the trial end date', () => {
    const { html } = build()
    expect(html).toContain('Hi Dana,')
    expect(html).toContain('It ends on September 14, 2026.')
  })

  it('drops the "Quick heads-up" opener Rich cut', () => {
    expect(build().html).not.toMatch(/quick heads.?up/i)
  })

  it('includes both the upgrade and feedback CTAs', () => {
    const { html } = build()
    expect(html).toContain('/settings/billing')
    expect(html).toContain('/feedback')
    expect(html).toContain('Choose a plan')
  })

  it('includes an unsubscribe link', () => {
    expect(build().html).toContain('Unsubscribe from these emails')
  })

  it('carries no em dash into the rendered body', () => {
    // Both scripts/prebuild-guard.mjs and the no-restricted-syntax lint rule
    // reject em dashes, so the copy must not reintroduce one via an escape.
    expect(build().html).not.toContain(String.fromCharCode(0x2014))
  })
})

describe('email council gate', () => {
  // sendEmail silently refuses to send anything scoring below
  // EMAIL_COUNCIL_MIN_SCORE (default 80) -- it returns an error rather than
  // throwing. The gate is tuned for cold outreach, rewarding "reply yes / reply
  // pass" exits and "n=" proof markers that would read as wrong in a lifecycle
  // notice to an existing customer, so this copy clears the bar with no margin
  // at all: EJES is exactly 80.
  //
  // These assertions exist so that a copy edit which drops the score fails here,
  // loudly, instead of quietly disabling the highest-priority revenue email in
  // production. If this test fails, the copy change is the thing to fix -- do not
  // "fix" it by lowering the threshold.
  it('clears the council gate at the default threshold', () => {
    const { subject, html } = build()
    const evaluation = evaluateEmailCouncilQuality({ channel: 'general', subject, html })

    expect(evaluation.blockers).toEqual([])
    expect(evaluation.passes).toBe(true)
  })

  it('has no headroom above the threshold, so guard the exact score', () => {
    const { subject, html } = build()
    const evaluation = evaluateEmailCouncilQuality({ channel: 'general', subject, html })

    expect(evaluation.scores.ejes).toBe(80)
  })
})
