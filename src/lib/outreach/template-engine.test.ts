import { describe, it, expect } from 'vitest'
import { evaluateEmailCouncilQuality } from '../email/email-council'
import templateEngine from './template-engine.cjs'

type DraftInput = {
  channel: 'executives' | 'search_firms' | 'coaches' | 'outplacement_firms'
  firstName: string
  company: string
  roleLabel: string
  focus: string
  step?: string
  state?: 'panic' | 'optionality' | 'burnout' | 'board-track'
  profileTrigger?: string
  postTrigger?: string
  newsTrigger?: string
}

function build(input: DraftInput) {
  return (templateEngine as { buildLatestTemplateDraft: (payload: DraftInput) => { subject: string; body: string } }).buildLatestTemplateDraft(input)
}

function toHtml(text: string) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;">${text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')}</div>`
}

function ensureSignatureLine(messageText: string) {
  return `${messageText.replace(/\r\n/g, '\n').trim()}\n\nRich\nstartingmonday.app`
}

function withComplianceFooter(messageText: string) {
  return [
    messageText.trim(),
    '',
    '---',
    'Starting Monday',
    'If you prefer no further outreach, reply with "unsubscribe" and I will stop.',
  ].join('\n')
}

describe('outreach template engine', () => {
  it('builds executive copy with explicit recruiter and board call context', () => {
    const draft = build({
      channel: 'executives',
      firstName: 'Alex',
      company: 'Acme',
      roleLabel: 'CFO',
      focus: 'CFO',
      state: 'panic',
    })

    expect(draft.subject).toBe('A clearer CFO story for recruiter and board calls')
    expect(draft.body).toContain('When a CFO search opens, even strong candidates can sound generic in the first recruiter and board call.')
    expect(draft.body).toContain('Starting Monday helps senior candidates turn a long career into a short story recruiters, CEOs, and boards can follow quickly.')
    expect(draft.body).toContain('It shows what to lead with, what to cut, and what to save for later.')
    expect(draft.body).toContain('Reply yes and I will send the one-page CFO call brief.')
    expect(draft.body).not.toContain('Search momentum is critical')
    expect(draft.body).not.toContain('(n=27)')
    expect(draft.body).not.toContain('Proof detail:')
    expect(draft.body).not.toContain('If this is ignored')
    expect(draft.body).not.toContain('reply "send it"')
    expect(draft.body).not.toContain('pilot group')
  })

  it('builds search firm copy with direct shortlist-quality language', () => {
    const draft = build({
      channel: 'search_firms',
      firstName: 'Sam',
      company: 'Summit Search',
      roleLabel: 'Partner',
      focus: 'Partner',
    })

    expect(draft.subject).toBe('A tighter first outreach brief for Summit Search')
    expect(draft.body).toContain('In retained search, shortlist quality drops when the first outreach starts before the role story is crisp.')
    expect(draft.body).toContain('Starting Monday gives search teams one short brief for what the first outreach should say before volume starts.')
    expect(draft.body).toContain('It keeps shortlist quality tighter before partner review cycles start.')
    expect(draft.body).toContain('It is meant to cut partner rework and keep shortlist quality tight.')
    expect(draft.body).toContain('Reply yes and I will send the first outreach brief.')
  })

  it('builds coach copy with pain-led wedge and explicit control language', () => {
    const draft = build({
      channel: 'coaches',
      firstName: 'Jordan',
      company: 'CoachCo',
      roleLabel: 'Executive Coach',
      focus: 'Executive Coach',
      state: 'burnout',
    })

    expect(draft.subject).toBe('Clients should show up prepared for CoachCo')
    expect(draft.body).toContain('Between sessions, prep work usually ends up split across notes, email, and memory.')
    expect(draft.body).toContain('Starting Monday helps coaches stop losing time to underprepared clients, collapsing follow-through, and constant context rebuild.')
    expect(draft.body).toContain('Nothing is auto-sent to contacts - coaches stay in control.')
    expect(draft.body).toContain('Reply yes and I will send the 14-day coach pilot checklist.')
    expect(draft.body).not.toContain('between-session execution layer')
    expect(draft.body).not.toContain('pilot group')
  })

  it('builds outplacement copy with direct readiness and coordinator-load language', () => {
    const draft = build({
      channel: 'outplacement_firms',
      firstName: 'Casey',
      company: 'Outplace Inc',
      roleLabel: 'Managing Director',
      focus: 'Executive transition programs',
      state: 'optionality',
    })

    expect(draft.subject).toBe('A shared readiness standard for Outplace Inc')
    expect(draft.body).toContain('Across Executive transition programs, candidates can get prepared in different ways, and counselors feel the inconsistency.')
    expect(draft.body).toContain('Starting Monday gives outplacement teams one operating layer for readiness, follow-up, and prep visibility so cohorts stay aligned without adding admin work.')
    expect(draft.body).toContain('Across Jan-May 2026 outplacement cases, teams saw faster early outreach momentum when a shared readiness standard was in place. Directional evidence, not a guarantee.')
    expect(draft.body).toContain('If helpful, I can send the 30-day cohort readiness checklist.')
    expect(draft.body).not.toContain('pilot group')
    expect(draft.body).not.toContain('(n=27)')
    expect(draft.body).not.toContain('reply yes and i will send')
  })

  it('builds executive followup subjects with step-specific variants', () => {
    const followup2 = build({
      channel: 'executives',
      firstName: 'Riley',
      company: 'Northstar',
      roleLabel: 'CIO',
      focus: 'CIO',
      step: 'followup_2',
    })

    expect(followup2.subject).toBe('Should I send the CIO call brief for Northstar')
    expect(followup2.body).toContain('the first recruiter call usually decides whether your story feels specific or generic')
    expect(followup2.body).toContain('make role fit clear before the first recruiter, CEO, or board conversation')
    expect(followup2.body).not.toContain('Search momentum is critical')
    expect(followup2.body).not.toContain('If this is not relevant right now, no problem')
  })

  it('keeps follow-up drafts above the live council gate (>80)', () => {
    const drafts: DraftInput[] = [
      { channel: 'executives', firstName: 'Riley', company: 'Northstar', roleLabel: 'CIO', focus: 'CIO', step: 'followup_1' },
      { channel: 'executives', firstName: 'Riley', company: 'Northstar', roleLabel: 'CIO', focus: 'CIO', step: 'followup_2' },
      { channel: 'executives', firstName: 'Riley', company: 'Northstar', roleLabel: 'CIO', focus: 'CIO', step: 'followup_3' },
      { channel: 'search_firms', firstName: 'Sam', company: 'SearchCo', roleLabel: 'Partner', focus: 'CIO', step: 'followup_1' },
      { channel: 'search_firms', firstName: 'Sam', company: 'SearchCo', roleLabel: 'Partner', focus: 'CIO', step: 'followup_2' },
      { channel: 'search_firms', firstName: 'Sam', company: 'SearchCo', roleLabel: 'Partner', focus: 'CIO', step: 'followup_3' },
      { channel: 'coaches', firstName: 'Jordan', company: 'CoachCo', roleLabel: 'Executive Coach', focus: 'Executive Coach', step: 'followup_1' },
      { channel: 'coaches', firstName: 'Jordan', company: 'CoachCo', roleLabel: 'Executive Coach', focus: 'Executive Coach', step: 'followup_2' },
      { channel: 'coaches', firstName: 'Jordan', company: 'CoachCo', roleLabel: 'Executive Coach', focus: 'Executive Coach', step: 'followup_3' },
      { channel: 'outplacement_firms', firstName: 'Casey', company: 'Outplace Inc', roleLabel: 'Managing Director', focus: 'Executive transition programs', step: 'followup_1' },
      { channel: 'outplacement_firms', firstName: 'Casey', company: 'Outplace Inc', roleLabel: 'Managing Director', focus: 'Executive transition programs', step: 'followup_2' },
      { channel: 'outplacement_firms', firstName: 'Casey', company: 'Outplace Inc', roleLabel: 'Managing Director', focus: 'Executive transition programs', step: 'followup_3' },
    ]

    for (const input of drafts) {
      const draft = build(input)
      const finalMessageText = withComplianceFooter(ensureSignatureLine(draft.body))
      const evaluation = evaluateEmailCouncilQuality({
        channel: input.channel,
        subject: `[TEST] ${draft.subject}`,
        html: toHtml(finalMessageText),
        minEjes: 81,
      })

      expect(evaluation.passes, `${input.channel} ${input.step} draft blocked: ${evaluation.blockers.join(', ')}`).toBe(true)
      expect(evaluation.scores.ejes).toBeGreaterThan(80)
    }
  })

  it('keeps long-company coach followups under the route subject guardrail', () => {
    const draft = build({
      channel: 'coaches',
      firstName: 'Marshall',
      company: 'Marshall Goldsmith Stakeholder Centered Coaching',
      roleLabel: 'Executive Coach',
      focus: 'CEO-to-Board',
      step: 'followup_1',
    })

    expect(draft.subject).toBe('Stop paying for the same recap twice for Marshall Goldsmith team')
    expect(draft.subject.length).toBeLessThanOrEqual(80)

    const finalMessageText = withComplianceFooter(ensureSignatureLine(draft.body))
    const evaluation = evaluateEmailCouncilQuality({
      channel: 'coaches',
      subject: draft.subject,
      html: toHtml(finalMessageText),
      minEjes: 81,
    })

    expect(evaluation.passes, evaluation.blockers.join(', ')).toBe(true)
    expect(evaluation.scores.ejes).toBeGreaterThan(80)
  })

  it('builds a plain-language executive draft for board roles', () => {
    const draft = build({
      channel: 'executives',
      firstName: 'Taylor',
      company: 'BoardCo',
      roleLabel: 'Board Advisor',
      focus: 'Board Advisor',
    })

    expect(draft.subject).toBe('A clearer Board Advisor story for recruiter and board calls')
    expect(draft.body).toContain('turn a long career into a short story recruiters, CEOs, and boards can follow quickly')
  })

  it('uses dynamic trigger inputs when provided', () => {
    const executive = build({
      channel: 'executives',
      firstName: 'Alex',
      company: 'Acme',
      roleLabel: 'CFO',
      focus: 'CFO',
      newsTrigger: 'new CFO search announced after earnings reset',
    })

    const coach = build({
      channel: 'coaches',
      firstName: 'Jordan',
      company: 'CoachCo',
      roleLabel: 'Executive Coach',
      focus: 'Executive Coach',
      postTrigger: 'your post on keeping client prep simple',
    })

    const outplacement = build({
      channel: 'outplacement_firms',
      firstName: 'Casey',
      company: 'Outplace Inc',
      roleLabel: 'Managing Director',
      focus: 'Executive transition programs',
      profileTrigger: 'your cohort model now spans three regions',
    })

    expect(executive.body).toContain('I saw new CFO search announced after earnings reset, and it looked like recruiter and board conversations may be coming fast.')
    expect(executive.body).toContain('turn a long career into a short story recruiters, CEOs, and boards can follow quickly')
    expect(executive.body).toContain('It keeps first conversations specific instead of generic so momentum comes from clarity, not volume.')
    expect(coach.body).toContain('I saw your post on keeping client prep simple, and it looked like the kind of prep load coaches end up carrying between sessions.')
    expect(coach.body).toContain('stop losing time to underprepared clients, collapsing follow-through, and constant context rebuild')
    expect(outplacement.body).toContain('I saw your cohort model now spans three regions, and it looked like the kind of growth point where cohort consistency gets harder to hold.')
    expect(outplacement.body).toContain('one operating layer for readiness, follow-up, and prep visibility')
  })

  it('keeps search copy focused on shortlist quality instead of product jargon', () => {
    const search = build({
      channel: 'search_firms',
      firstName: 'Taylor',
      company: 'SearchCo',
      roleLabel: 'Partner',
      focus: 'CIO',
      newsTrigger: 'new CIO mandate announced',
    })

    expect(search.body).toContain('I saw new CIO mandate announced, and it looked like the kind of moment when shortlist quality can drift.')
    expect(search.body).not.toContain('Momentum Signal')
    expect(search.body).not.toContain('Search momentum is critical')
  })

  it('keeps default first-touch drafts above the live council gate (>80)', () => {
    const drafts: DraftInput[] = [
      { channel: 'executives', firstName: 'Alex', company: 'Acme', roleLabel: 'CFO', focus: 'CFO' },
      { channel: 'search_firms', firstName: 'Sam', company: 'SearchCo', roleLabel: 'Partner', focus: 'CIO' },
      { channel: 'coaches', firstName: 'Jordan', company: 'CoachCo', roleLabel: 'Executive Coach', focus: 'Executive Coach' },
      { channel: 'outplacement_firms', firstName: 'Casey', company: 'Outplace Inc', roleLabel: 'Managing Director', focus: 'Executive transition programs' },
    ]

    for (const input of drafts) {
      const draft = build(input)
      const evaluation = evaluateEmailCouncilQuality({
        channel: input.channel,
        subject: draft.subject,
        html: toHtml(draft.body),
        minEjes: 81,
      })

      expect(evaluation.passes, `${input.channel} draft blocked: ${evaluation.blockers.join(', ')}`).toBe(true)
      expect(evaluation.scores.ejes).toBeGreaterThan(80)
    }
  })
})
