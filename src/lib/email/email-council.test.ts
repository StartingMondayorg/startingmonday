import { describe, expect, it } from 'vitest'
import { autoRefineEmailDraft, evaluateEmailCouncilQuality } from './email-council'

describe('email council scoring and refinement', () => {
  it('scores a human outreach draft with high EJES', () => {
    const subject = 'CIO first-call plan for Northstar Health'
    const html = [
      'Hi Maya,',
      '',
      'I saw CIO succession plan announced after Q2 board review, and that can raise first-call pressure quickly.',
      '',
      'In a job search, the first call often decides momentum. Teams either keep the plan ad hoc or use Starting Monday to run one clear plan for the next serious call.',
      '',
      'In our Jan-May 2026 pilot group (n=27), active users reached first qualified outreach in a median of 9 days; results vary by market and execution.',
      '',
      'Reply yes and I will send the one-page first-call plan. Reply pass and I will close the loop.',
    ].join('\n')

    const evalResult = evaluateEmailCouncilQuality({ channel: 'executives', subject, html, minEjes: 90 })
    expect(evalResult.scores.ejes).toBeGreaterThanOrEqual(90)
    expect(evalResult.passes).toBe(true)
  })

  it('rewrites framework labels before scoring final pass', () => {
    const refined = autoRefineEmailDraft({
      channel: 'general',
      subject: 'Quick question: readiness plan',
      html: 'Trigger this week: deal pressure. Choice: keep it manual. Reply yes and reply pass.',
      minEjes: 99,
      maxPasses: 2,
    })

    expect(refined.refinedSubject.toLowerCase()).not.toContain('quick question')
    expect(refined.refinedHtml.toLowerCase()).not.toContain('trigger this week:')
    expect(refined.refinedHtml.toLowerCase()).not.toContain('choice:')
  })
})
