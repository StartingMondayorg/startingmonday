import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getStaffMember: vi.fn(),
  buildOutreachTemplateDraft: vi.fn(() => ({
    subject: 'A clearer COO story for recruiter and board calls',
    body: 'Hi Alex, this is a generated server-side draft.',
    templateSource: 'latest_template_engine' as const,
  })),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/outreach/template-draft', () => ({
  buildOutreachTemplateDraft: state.buildOutreachTemplateDraft,
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'staff@example.com' } } })) },
  }),
}))

import { POST } from './route'

describe('outreach template route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/outreach/template', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('requires a valid outreach channel', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/template', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        outreachChannel: 'invalid',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid outreachChannel.' })
  })

  it('returns server-generated template draft', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/template', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        roleBucket: 'COO',
        outreachChannel: 'executives',
        personaFocus: 'COO transitions',
        templateStep: 'first_touch',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      templateSource: 'latest_template_engine',
      subject: 'A clearer COO story for recruiter and board calls',
    })
    expect(state.buildOutreachTemplateDraft).toHaveBeenCalledTimes(1)
  })
})
