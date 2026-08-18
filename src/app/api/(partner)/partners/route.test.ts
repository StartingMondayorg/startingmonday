import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  insertInquiry: vi.fn(),
  partnerSelect: vi.fn(),
  partnerEq: vi.fn(),
  partnerMaybeSingle: vi.fn(),
  partnerUpsert: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/owner-email', () => ({
  getOwnerEmail: () => 'owner@example.com',
}))

vi.mock('@/lib/email', () => ({
  sendEmail: state.sendEmail,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === 'partner_inquiries') {
        return { insert: state.insertInquiry }
      }
      if (table === 'partners') {
        return {
          select: state.partnerSelect,
          upsert: state.partnerUpsert,
        }
      }
      return {}
    },
  }),
}))

import { POST } from './route'

describe('partners route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)

    state.guard.mockResolvedValue(null)
    state.insertInquiry.mockResolvedValue({ error: null })
    state.partnerUpsert.mockResolvedValue({ error: null })
    state.partnerSelect.mockReturnValue({ eq: state.partnerEq })
    state.partnerEq.mockReturnValue({ maybeSingle: state.partnerMaybeSingle })
    state.partnerMaybeSingle.mockResolvedValue({ data: null })
    state.sendEmail.mockReturnValue({ catch: vi.fn() })
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/partners', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com', company: 'Acme', role: 'CEO' }),
    }))

    expect(response.status).toBe(429)
  })

  it('rejects missing required fields', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/partners', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing required fields' })
    expect(state.insertInquiry).not.toHaveBeenCalled()
  })

  it('creates the partner inquiry, upserts a referral code, and sends emails', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/partners', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'Ada@Example.com ',
        company: '  Acme  ',
        role: '  CEO  ',
        how_heard: 'Podcast',
        interests: 'Referrals',
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.insertInquiry).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      company: 'Acme',
      role: 'CEO',
      how_heard: 'Podcast',
      interests: 'Referrals',
    })
    expect(state.partnerEq).toHaveBeenCalledWith('referral_code', expect.any(String))
    expect(state.partnerUpsert).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Acme',
      referral_code: expect.any(String),
    }, { onConflict: 'email', ignoreDuplicates: false })
    expect(state.sendEmail).toHaveBeenCalledTimes(2)
    expect(state.sendEmail.mock.calls[0][0]).toEqual(expect.objectContaining({
      to: 'owner@example.com',
      subject: 'Partner inquiry: Ada Lovelace at Acme',
    }))
    expect(state.sendEmail.mock.calls[0][0].html).toContain('Referral code')
    expect(state.sendEmail.mock.calls[1][0]).toEqual(expect.objectContaining({
      to: 'ada@example.com',
      subject: 'Welcome to the Starting Monday partner program',
    }))
    expect(state.sendEmail.mock.calls[1][0].html).toContain('/dashboard/partner')
  })
})
