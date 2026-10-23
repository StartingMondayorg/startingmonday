import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requirePrepAccess: vi.fn(),
  safeFetch: vi.fn(),
  stream: vi.fn(),
}))

vi.mock('@/lib/require-prep-access', () => ({
  requirePrepAccess: state.requirePrepAccess,
}))

vi.mock('@/lib/net/safe-fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/net/safe-fetch')>()),
  safeFetch: state.safeFetch,
}))

vi.mock('@/lib/ai/anthropic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/anthropic')>()),
  anthropic: { messages: { stream: state.stream } },
}))

vi.mock('@/lib/trace', () => ({ recordTrace: vi.fn(), recordTraceError: vi.fn() }))

vi.mock('@/lib/api-usage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-usage')>()),
  trackApiUsage: vi.fn().mockResolvedValue(undefined),
}))

import { GET, POST } from './route'
import { UnsafeUrlError } from '@/lib/net/safe-fetch'

// Chainable Supabase stand-in: every filter returns the builder; awaiting it
// (or .single()) yields the table's canned rows.
function fakeSupabase(tables: Record<string, unknown>) {
  return {
    from(table: string) {
      const result = { data: tables[table] ?? null, error: null }
      const builder: Record<string, unknown> = {}
      for (const method of ['select', 'eq', 'gte', 'order', 'limit']) builder[method] = () => builder
      builder.single = async () => result
      builder.then = (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject)
      return builder
    },
  }
}

function fakeAnthropicStream() {
  let onText: ((text: string) => void) | null = null
  return {
    on(event: string, cb: (text: string) => void) {
      if (event === 'text') onText = cb
    },
    async finalMessage() {
      onText?.('Brief body')
      return { stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 2 } }
    },
    abort() {},
  }
}

describe('prep route validation', () => {
  const validCompanyId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    state.requirePrepAccess.mockResolvedValue({
      ok: true,
      userId: 'u_1',
      tier: 'free',
      supabase: {},
    })
  })

  it('rejects invalid query params on GET', async () => {
    const req = new NextRequest(`https://startingmonday.app/api/prep/${validCompanyId}?interview_stage=bad_stage`)

    const res = await GET(req, {
      params: Promise.resolve({ id: validCompanyId }),
    })

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) })
  })

  it('rejects invalid JSON on POST', async () => {
    const req = new NextRequest(`https://startingmonday.app/api/prep/${validCompanyId}`, {
      method: 'POST',
      body: '{',
    })

    const res = await POST(req, {
      params: Promise.resolve({ id: validCompanyId }),
    })

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid JSON' })
  })
})

describe('prep route posting_url fetch (P1-5)', () => {
  const companyId = '550e8400-e29b-41d4-a716-446655440000'
  const jobText = 'Chief Technology Officer: lead platform engineering across four regions. '.repeat(4)

  beforeEach(() => {
    state.safeFetch.mockReset()
    state.stream.mockReset()
    state.stream.mockImplementation(() => fakeAnthropicStream())
    state.requirePrepAccess.mockResolvedValue({
      ok: true,
      userId: 'u_1',
      tier: 'free',
      supabase: fakeSupabase({
        companies: { name: 'Acme', sector: 'Software', stage: 'growth', notes: null, interview_notes: null },
        user_profiles: { full_name: 'Pat Doe', resume_text: null },
        scan_results: [],
        contacts: [],
        company_documents: [],
        company_interview_logs: [],
        company_signals: [],
      }),
    })
  })

  function get(postingUrl: string) {
    const req = new NextRequest(
      `https://startingmonday.app/api/prep/${companyId}?posting_url=${encodeURIComponent(postingUrl)}`,
    )
    return GET(req, { params: Promise.resolve({ id: companyId }) })
  }

  it('fetches the posting through safeFetch and adds it as the job description', async () => {
    state.safeFetch.mockResolvedValue(new Response(`<html><body><p>${jobText}</p></body></html>`))

    const res = await get('https://jobs.example.com/cto')

    expect(res.status).toBe(200)
    expect(state.safeFetch).toHaveBeenCalledWith(
      'https://jobs.example.com/cto',
      expect.objectContaining({ timeoutMs: 8000, maxBytes: expect.any(Number) }),
    )
    expect(JSON.parse(res.headers.get('x-prep-attribution-context-ids') ?? '[]')).toContain('ctx_job_description')
    await expect(res.text()).resolves.toContain('Brief body')
    expect(JSON.stringify(state.stream.mock.calls[0][0].messages)).toContain('Chief Technology Officer')
  })

  it('drops a posting that safeFetch refuses as unsafe and still generates the brief', async () => {
    state.safeFetch.mockRejectedValue(new UnsafeUrlError('safe-fetch: resolves to blocked address 10.0.0.5', 'https://evil.example/'))

    const res = await get('https://evil.example/')

    expect(res.status).toBe(200)
    expect(JSON.parse(res.headers.get('x-prep-attribution-context-ids') ?? '[]')).not.toContain('ctx_job_description')
    await expect(res.text()).resolves.toContain('Brief body')
  })

  it('rejects a non-https posting_url before any fetch', async () => {
    const res = await get('http://169.254.169.254/latest/meta-data/')

    expect(res.status).toBe(400)
    expect(state.safeFetch).not.toHaveBeenCalled()
  })
})