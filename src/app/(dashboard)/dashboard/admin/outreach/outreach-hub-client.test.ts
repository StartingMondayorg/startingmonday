import { describe, expect, it } from 'vitest'
import { detectLegacyTemplateCopy, formatOutreachErrorMessage, OutreachHubClient } from './outreach-hub-client'

describe('outreach hub module', () => {
  it('exports OutreachHubClient', () => {
    expect(typeof OutreachHubClient).toBe('function')
  })

  it('turns council gate failures into a clear no-send message', () => {
    expect(formatOutreachErrorMessage('Blocked by email council gate: EJES 87 < 90', 'live')).toEqual({
      title: 'Send blocked before delivery',
      detail: 'This draft did not meet the live email quality gate, so no email was sent. Tighten the copy and run a test to yourself before sending live.',
      rawReason: 'Blocked by email council gate: EJES 87 < 90',
    })
  })

  it('uses a sender-specific message for test send resolution failures', () => {
    expect(formatOutreachErrorMessage('Could not resolve test recipient email.', 'test_to_self')).toEqual({
      title: 'Test send could not start',
      detail: 'Your account email could not be resolved for Send Test To Me. Confirm your signed-in user has a valid email address.',
    })
  })

  it('does not surface raw html error pages as outreach explanations', () => {
    expect(formatOutreachErrorMessage('Request failed (502): <!DOCTYPE html><html><body>Bad gateway</body></html>', 'live')).toEqual({
      title: 'Email was not sent',
      detail: 'The outreach email failed before delivery.',
      rawReason: 'Request failed (502): <!DOCTYPE html><html><body>Bad gateway</body></html>',
    })
  })

  it('flags stale legacy outreach copy markers', () => {
    const hits = detectLegacyTemplateCopy(
      'Simple CFO first-call plan for Elastic team',
      'In our Jan-May 2026 pilot group (n=27), active users reached first qualified outreach in a median of 9 days. If useful, reply yes and I will send the one-page first-call plan. Momentum Signal shows movement.',
    )

    expect(hits).toContain('legacy first-call subject')
    expect(hits).toContain('pilot group evidence line')
    expect(hits).toContain('legacy CTA opener')
    expect(hits).toContain('Momentum Signal language')
  })

  it('does not flag current standardized template wording', () => {
    const hits = detectLegacyTemplateCopy(
      'A clearer CFO story for recruiter and board calls',
      'Hi Alex,\n\nStarting Monday helps senior candidates turn a long career into a short story recruiters, CEOs, and boards can follow quickly.\nIt keeps first conversations specific instead of generic so momentum comes from clarity, not volume.\n\nReply yes and I will send the one-page CFO call brief.',
    )

    expect(hits).toEqual([])
  })
})