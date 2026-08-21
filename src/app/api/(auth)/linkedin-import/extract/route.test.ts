import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  extract: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/linkedin-profile-pdf', () => ({
  LinkedInProfilePdfError: class LinkedInProfilePdfError extends Error {
    constructor(message: string, public readonly status: number) {
      super(message)
    }
  },
  extractLinkedInProfilePdfText: state.extract,
}))

import { POST } from './route'

function request(file?: File) {
  const form = new FormData()
  if (file) form.set('file', file)
  return new NextRequest('http://localhost/api/linkedin-import/extract', { method: 'POST', body: form })
}

describe('LinkedIn PDF extraction route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
  })

  it('returns extracted text for an authenticated request', async () => {
    state.extract.mockResolvedValue('Alex Rivera')
    const response = await POST(request(new File(['%PDF-1.7'], 'profile.pdf', { type: 'application/pdf' })))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ text: 'Alex Rivera' })
  })

  it('returns the parser status and message without exposing implementation details', async () => {
    const { LinkedInProfilePdfError } = await import('@/lib/linkedin-profile-pdf')
    state.extract.mockRejectedValue(new LinkedInProfilePdfError('File too large (5 MB max)', 413))

    const response = await POST(request(new File(['%PDF-1.7'], 'profile.pdf', { type: 'application/pdf' })))

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toEqual({ error: 'File too large (5 MB max)' })
  })

  it('preserves the authentication boundary', async () => {
    const denied = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    expect(await POST(request())).toBe(denied)
    expect(state.extract).not.toHaveBeenCalled()
  })
})
