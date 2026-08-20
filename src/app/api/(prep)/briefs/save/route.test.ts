import { beforeEach, describe, expect, it, vi } from 'vitest'

const insertSpy = vi.fn()

vi.mock('@/lib/require-auth', () => ({
  requireAuth: vi.fn(async () => ({ ok: true, userId: 'user-1' })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      insert: (payload: unknown) => {
        insertSpy(payload)
        return {
          select: () => ({
            single: async () => ({ data: { id: 'brief-1' }, error: null }),
          }),
        }
      },
    })),
  })),
}))

vi.mock('@/lib/events', () => ({
  logEvent: vi.fn(async () => undefined),
}))

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: vi.fn(() => undefined),
}))

vi.mock('@/lib/watermark', () => ({
  watermarkText: vi.fn((text: string) => text),
}))

describe('src/app/api/briefs/save/route.ts', () => {
  beforeEach(() => {
    insertSpy.mockReset()
  })

  it('rejects prep writes without claim provenance', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'prep', text: 'Test prep brief output' }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('persists provenance payload for prep writes', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prep',
        text: 'Candidate has verified career history and signal context.',
        claim_provenance: [
          {
            claimText: 'Candidate has verified career history and signal context.',
            originClass: 'user_provided',
            section: 'Bottom Line',
            sensitivePolicyHooks: [],
            sourceEvidence: ['career_history'],
          },
        ],
        provenance_version: 1,
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>
    expect(payload.claim_provenance).toBeDefined()
    expect(payload.provenance_version).toBe(1)
  })

  it('rewrites unsupported proper-noun claims before prep persistence', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prep_section',
        text: '## Leadership Team\n\n- Jane Smith joined in March 2025 to run enterprise transformation.',
        section_name: 'leadership',
        claim_provenance: [
          {
            claimText: 'Jane Smith joined in March 2025 to run enterprise transformation.',
            originClass: 'inferred',
            section: 'Leadership Team',
            sensitivePolicyHooks: [],
            sourceEvidence: [],
          },
        ],
        provenance_version: 1,
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>
    const outputText = payload.output_text as string

    expect(outputText).not.toContain('Jane Smith')
    expect(outputText).not.toContain('March 2025')
    expect(outputText).toContain('companies at this stage typically focus on operating cadence')
  })

  it('keeps specific claims when source evidence exists', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prep_section',
        text: '## Leadership Team\n\n- Jane Smith joined in March 2025 to run enterprise transformation.',
        section_name: 'leadership',
        claim_provenance: [
          {
            claimText: 'Jane Smith joined in March 2025 to run enterprise transformation.',
            originClass: 'system_detected',
            section: 'Leadership Team',
            sensitivePolicyHooks: [],
            sourceEvidence: ['company_signals'],
          },
        ],
        provenance_version: 1,
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>
    const outputText = payload.output_text as string

    expect(outputText).toContain('Jane Smith joined in March 2025')
  })

  it('downgrades unmatched attribution v2 claims to inferred during save', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prep',
        text: '## Bottom Line\n\nSpecific claim about market timing.',
        provenance_version: 2,
        attributionContextIds: ['ctx_company_signals_1'],
        claim_provenance: [
          {
            claimText: 'Specific claim about market timing.',
            originClass: 'system_detected',
            section: 'Bottom Line',
            sensitivePolicyHooks: [],
            sourceEvidence: ['company_signals'],
            sourceContextIds: ['ctx_missing'],
          },
        ],
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>
    const provenance = payload.claim_provenance as Array<Record<string, unknown>>

    expect(provenance[0]?.originClass).toBe('inferred')
    expect(provenance[0]?.sourceEvidence).toEqual([])
    expect(provenance[0]?.sourceContextIds).toEqual([])
  })

  it('rejects malformed company_id via schema validation', async () => {
    const { POST } = await import('@/app/api/(prep)/briefs/save/route')
    const req = new Request('http://localhost/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'strategy',
        text: 'A valid strategy brief body',
        company_id: 'not-a-uuid',
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
    expect(insertSpy).not.toHaveBeenCalled()
  })
})
