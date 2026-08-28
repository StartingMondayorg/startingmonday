import { describe, expect, it } from 'vitest'
import { renderSignalBrief, type SignalBriefInput } from './signal-brief-renderer'

const input: SignalBriefInput = {
  title: 'Presidio signal brief',
  reader: 'Presidio VAR team',
  problems: ['Competitors hear about the trigger first.', 'Relationship targets are unclear.', 'Owned accounts are not watched systematically.'],
  implication_math: {
    deal_value: 2_000_000,
    win_rate: 0.2,
    lift_statement: 'Being first creates a higher-value opening conversation.',
  },
  what_it_does: ['Ranks dated triggers by decision imminence.', 'Names decision-makers from public events.', 'Tracks deltas until a watched account moves.'],
  cost_to_reader: 'About 10 minutes a week. No new system; the brief lands in email.',
  profiles: [
    {
      account: 'Yordas',
      positioning: 'The public record suggests a scope-merge pressure; confirm it before proposing anything.',
      suggested_move: 'Open with an investigating conversation about the scope decision.',
      discovery_questions: {
        situation: ['Is the scope merge decided or still open?', 'Who owns the decision today?'],
        problem: ['Where is the current process creating friction?', 'Which team absorbs the work?', 'What is being delayed?'],
        implication: ['What does another quarter of delay cost?', 'What downstream commitment is at risk?'],
        need_payoff: ['What would change if the pressure came off the team?', 'Where would the team reinvest the time?'],
      },
      evidence: [
        { date: '2026-08-18', event: 'Scope-merge discussion disclosed', source_url: 'https://example.com/scope-merge' },
        { date: '2026-08-22', event: 'Leadership transition announced', source_url: 'https://example.com/leadership-transition' },
      ],
    },
  ],
  method_note: 'Public records only.',
}

describe('renderSignalBrief', () => {
  it('renders the value cover before profiles with parameterized expected value', () => {
    const html = renderSignalBrief(input)

    expect(html.indexOf('What is already costing your week')).toBeLessThan(html.indexOf('Account briefs'))
    expect(html).toContain('$400,000')
    expect(html).toContain('20% baseline win rate')
  })

  it('uses Tactics and renders discovery questions in SPIN order', () => {
    const html = renderSignalBrief(input)

    expect(html).toContain('<h3>Tactics</h3>')
    expect(html.indexOf('Situation')).toBeLessThan(html.indexOf('Problem'))
    expect(html.indexOf('Problem')).toBeLessThan(html.indexOf('Implication'))
    expect(html.indexOf('Implication')).toBeLessThan(html.indexOf('Need-payoff'))
  })

  it('escapes reader-controlled strings', () => {
    const html = renderSignalBrief({ ...input, reader: '<script>alert(1)</script>' })

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('supports briefs without an optional method note or profiles', () => {
    const html = renderSignalBrief({ ...input, method_note: undefined, profiles: [] })

    expect(html).not.toContain('Method note')
    expect(html).toContain('<h2>Account briefs</h2>')
  })

  it('renders exactly one full-depth profile in sample mode', () => {
    const html = renderSignalBrief({
      ...input,
      profiles: [input.profiles[0]!, { ...input.profiles[0]!, account: 'Second account' }],
      sample_mode: { enabled: true, full_depth_profile_index: 0 },
    })

    expect(html.match(/<section class="public-evidence">/g)).toHaveLength(1)
    expect(html).toContain('This profile is available in the full brief.')
    expect(html).not.toContain('Second account</h2><section class="public-evidence">')
  })
})
