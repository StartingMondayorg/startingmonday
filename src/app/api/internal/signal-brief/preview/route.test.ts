import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateInternalRouteRequest } from '@/lib/internal-route-auth'
import dataEndureFixture from '../../../../../../tests/fixtures/signal-brief/dataendure-prospect.json'
import { POST } from './route'

vi.mock('@/lib/internal-route-auth', () => ({
  validateInternalRouteRequest: vi.fn(),
}))

const validateMock = vi.mocked(validateInternalRouteRequest)

const validPayload = {
  title: 'Preview brief',
  reader: 'VAR team',
  client_config: {
    avg_deal_value: 2_000_000,
    win_rate: 0.2,
    lift_statement: 'Being first creates room to shape the engagement.',
    problems: ['Competitors hear the trigger first.', 'The relationship map is unclear.', 'Owned accounts are not watched.'],
    what_it_does: ['Ranks dated triggers.', 'Names public decision-path evidence.', 'Tracks account deltas.'],
    cost_to_reader: 'About 10 minutes weekly.',
  },
  profiles: [{
    account: 'Example account',
    positioning: 'The public record suggests a pressure; confirm it in discovery.',
    suggested_move: 'Start with an investigating conversation.',
    discovery_questions: {
      situation: ['What changed?', 'Who owns the decision?'],
      problem: ['Where is the constraint?', 'What is delayed?', 'Who feels it?'],
      implication: ['What does delay cost?', 'What is at risk?'],
      need_payoff: ['What would change?', 'Where would time go?'],
    },
    evidence: [{ date: '2026-08-20', event: 'Public event announced', source_url: 'https://example.com/event' }],
  }],
}

function request(body: string): NextRequest {
  return new NextRequest('http://localhost/api/internal/signal-brief/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('POST /api/internal/signal-brief/preview', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    validateMock.mockReset()
  })

  it('rejects unauthorized requests before checking the feature flag', async () => {
    validateMock.mockReturnValue(false)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    const response = await POST(request(JSON.stringify(validPayload)))

    expect(response.status).toBe(403)
  })

  it('is disabled by default for authorized requests', async () => {
    validateMock.mockReturnValue(true)

    const response = await POST(request(JSON.stringify(validPayload)))

    expect(response.status).toBe(503)
  })

  it('rejects malformed and invalid payloads when enabled', async () => {
    validateMock.mockReturnValue(true)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    expect((await POST(request('{'))).status).toBe(400)
    expect((await POST(request(JSON.stringify({ ...validPayload, profiles: [] })))).status).toBe(422)
  })

  it('rejects non-SPIN or prescriptive profile content', async () => {
    validateMock.mockReturnValue(true)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    const response = await POST(request(JSON.stringify({
      ...validPayload,
      profiles: [{
        ...validPayload.profiles[0],
        positioning: 'You need our managed service.',
      }],
    })))

    expect(response.status).toBe(422)
  })

  it('keeps sample mode disabled behind its own flag', async () => {
    validateMock.mockReturnValue(true)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    const response = await POST(request(JSON.stringify({
      ...validPayload,
      sample_mode: { enabled: true, full_depth_profile_index: 0 },
    })))

    expect(response.status).toBe(503)
  })

  it('returns rendered HTML for a valid authorized preview', async () => {
    validateMock.mockReturnValue(true)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    const response = await POST(request(JSON.stringify(validPayload)))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.html).toContain('What is already costing your week')
    expect(body.html).toContain('Public record')
    expect(body.html).toContain('https://example.com/event')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('renders the representative public-record fixture through the full caller pipeline', async () => {
    validateMock.mockReturnValue(true)
    vi.stubEnv('SIGNAL_BRIEF_PREVIEW_ENABLED', 'true')

    const response = await POST(request(JSON.stringify(dataEndureFixture)))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.html).toContain('DataEndure')
    expect(body.html).toContain('2026-08-20')
    expect(body.html).toContain('$400,000')
    expect(body.html).toContain('Need-payoff')
  })
})
