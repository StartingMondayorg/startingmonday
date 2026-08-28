import { describe, expect, it } from 'vitest'
import { adaptSignalBriefPayload, type RawSignalBriefPayload } from './signal-brief-adapter'

const payload: RawSignalBriefPayload = {
  title: 'DataEndure signal brief',
  reader: 'DataEndure account team',
  client_config: {
    avg_deal_value: 2_000_000,
    win_rate: 0.2,
    lift_statement: 'A first conversation creates more room to shape the engagement.',
    problems: ['The trigger reaches competitors first.', 'The relationship map is unclear.', 'Owned accounts are not watched.'],
    what_it_does: ['Ranks dated triggers.', 'Names public decision-path evidence.', 'Tracks account deltas.'],
    cost_to_reader: 'About 10 minutes weekly; the brief arrives by email.',
  },
  profiles: [
    {
      account: 'DataEndure',
      positioning: 'The public record suggests a capacity pressure; confirm it in discovery.',
      suggested_move: 'Ask how the team is handling the pressure before proposing a service.',
      discovery_questions: {
        situation: ['What changed in the account?', 'Who owns the decision?'],
        problem: ['Where is the team constrained?', 'What work is delayed?', 'Who feels the impact?'],
        implication: ['What does delay cost?', 'Which commitment is at risk?'],
        need_payoff: ['What would the team do with capacity back?', 'What result would make this worth solving?'],
      },
      evidence: [{ date: '2026-08-20', event: 'Capacity change announced', source_url: 'https://example.com/capacity' }],
    },
  ],
}

describe('adaptSignalBriefPayload', () => {
  it('maps the client payload into the renderer contract', () => {
    const result = adaptSignalBriefPayload(payload)

    expect(result.implication_math).toEqual({
      deal_value: 2_000_000,
      win_rate: 0.2,
      lift_statement: payload.client_config.lift_statement,
    })
    expect(result.profiles[0]?.evidence[0]?.source_url).toMatch(/^https:\/\//)
  })

  it('rejects non-HTTPS or malformed evidence dates', () => {
    expect(() => adaptSignalBriefPayload({
      ...payload,
      profiles: [{ ...payload.profiles[0]!, evidence: [{ date: '2026-08-20', event: 'Change', source_url: 'http://example.com' }] }],
    })).toThrow(/HTTPS/)

    expect(() => adaptSignalBriefPayload({
      ...payload,
      profiles: [{ ...payload.profiles[0]!, evidence: [{ date: 'August 20', event: 'Change', source_url: 'https://example.com' }] }],
    })).toThrow(/YYYY-MM-DD/)
  })

  it('rejects invalid client economics', () => {
    expect(() => adaptSignalBriefPayload({
      ...payload,
      client_config: { ...payload.client_config, win_rate: 1.2 },
    })).toThrow(/win_rate/)
  })

  it('rejects cover sections that do not contain exactly three items', () => {
    expect(() => adaptSignalBriefPayload({
      ...payload,
      client_config: { ...payload.client_config, problems: ['Only one problem'] as unknown as [string, string, string] },
    })).toThrow(/exactly three/)
  })
})
