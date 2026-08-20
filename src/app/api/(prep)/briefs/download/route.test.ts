import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  toBuffer: vi.fn(),
  briefRow: null as null | Record<string, unknown>,
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: state.briefRow, error: state.briefRow ? null : { message: 'not found' } })),
          })),
        })),
      })),
    })),
  })),
}))
vi.mock('docx', () => {
  class Document { constructor(_: unknown) {} }
  class Paragraph { constructor(_: unknown) {} }
  class TextRun { constructor(_: unknown) {} }
  return {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel: { HEADING_1: 'H1', HEADING_2: 'H2' },
    AlignmentType: { LEFT: 'left' },
    convertInchesToTwip: (v: number) => Math.round(v * 1440),
    Packer: { toBuffer: state.toBuffer },
  }
})

import { POST } from './route'

describe('brief download route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u1' })
    state.toBuffer.mockResolvedValue(Buffer.from('doc-bytes'))
    state.briefRow = null
  })

  it('passes through auth failures', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid json', async () => {
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', { method: 'POST', body: '{' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when text is missing', async () => {
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', {
      method: 'POST',
      body: JSON.stringify({ title: 'My Brief' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'text is required' })
  })

  it('returns a docx attachment with a safe filename', async () => {
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', {
      method: 'POST',
      body: JSON.stringify({ title: 'Q2 Brief!!!', text: '## Header\nbody', low_confidence_acknowledged: true }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(res.headers.get('content-disposition')).toContain('q2-brief-.docx')
  })

  it('blocks export when low confidence acknowledgment is missing', async () => {
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Brief',
        text: 'One short sentence with no structure.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(412)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('low-confidence') })
  })

  it('allows export when low confidence is explicitly acknowledged', async () => {
    const req = new NextRequest('https://startingmonday.app/api/briefs/download', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Brief',
        text: 'One short sentence with no structure.',
        low_confidence_acknowledged: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('blocks export when sensitive claim hooks exist on saved provenance', async () => {
    state.briefRow = {
      id: 'brief-1',
      type: 'prep',
      created_at: new Date().toISOString(),
      claim_provenance: [
        {
          claimText: 'Compensation should be benchmarked at $450k base.',
          originClass: 'system_detected',
          section: 'Offer',
          sensitivePolicyHooks: ['compensation_claim'],
          sourceEvidence: ['company_signals'],
        },
      ],
    }

    const req = new NextRequest('https://startingmonday.app/api/briefs/download', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Brief',
        text: '## Offer\nCompensation should be benchmarked at $450k base.',
        brief_id: 'brief-1',
        low_confidence_acknowledged: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(412)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('sensitive claims'),
      sensitive_claim_count: 1,
      sensitive_hook_counts: { compensation_claim: 1 },
      sample_claims: [expect.stringContaining('Compensation should be benchmarked')],
    })
  })
})
