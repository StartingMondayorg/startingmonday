import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  userId: 'u_1',
  userEmail: 'coach@example.com',
  partner: null as null | Record<string, unknown>,
  updateError: null as Error | null,
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
  withAuthCookies: (response: Response) => response,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { email: state.userEmail }, error: null }),
            }),
          }),
        }
      }

      if (table === 'partners') {
        return {
          select: () => ({
            eq: (column: string, value: unknown) => {
              const conditions: Array<[string, unknown]> = [[column, value]]
              const chain = {
                eq(nextColumn: string, nextValue: unknown) {
                  conditions.push([nextColumn, nextValue])
                  return chain
                },
                maybeSingle: async () => {
                  const partner = state.partner
                  if (!partner) return { data: null, error: null }
                  const matchesUser = conditions.some(([key, value]) => key === 'user_id' && value === state.userId)
                  const matchesEmail = conditions.some(([key, value]) => key === 'email' && value === state.userEmail)
                  const matchesActive = conditions.some(([key, value]) => key === 'is_active' && value === true)
                  const partnerMatches = (matchesUser && partner.user_id === state.userId) || (matchesEmail && matchesActive && partner.email === state.userEmail)
                  return { data: partnerMatches ? partner : null, error: null }
                },
              }
              return chain
            },
          }),
          update: (updates: Record<string, unknown>) => ({
            eq: async () => {
              if (state.updateError) return { error: state.updateError }
              state.partner = { ...state.partner, ...updates }
              return { error: null }
            },
          }),
        }
      }

      if (table === 'partner_audit_events') {
        return {
          insert: async () => ({ error: null }),
        }
      }

      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }
    },
  }),
}))

import { GET, PATCH } from './route'

describe('white-label settings route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: state.userId, response: new Response() })
    state.userEmail = 'coach@example.com'
    state.partner = {
      id: 'partner_1',
      name: 'Nash Transition Group',
      email: 'coach@example.com',
      user_id: state.userId,
      white_label_brand_name: null,
      white_label_track_id: null,
      white_label_tier_id: null,
      white_label_primary_color: null,
      white_label_accent_color: null,
      white_label_support_email: null,
      white_label_logo_url: null,
    }
    state.updateError = null
  })

  it('returns resolved settings for the partner workspace', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/white-label', { method: 'GET' })
    const response = await GET(request)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data).toMatchObject({
      brandName: 'Nash Transition Group',
      trackId: 'executive_transition',
      tierId: 'boutique',
      supportEmail: 'coach@example.com',
      logoUrl: null,
    })
  })

  it('saves custom white-label settings', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/white-label', {
      method: 'PATCH',
      body: JSON.stringify({
        brandName: 'Nash Career Transition',
        trackId: 'professional_transition',
        tierId: 'solo',
        primaryColor: '#123ABC',
        accentColor: '#f97316',
        supportEmail: 'support@nashtransition.com',
        logoUrl: 'https://example.com/logo.svg',
      }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data).toMatchObject({
      brandName: 'Nash Career Transition',
      trackId: 'professional_transition',
      tierId: 'solo',
      primaryColor: '#123abc',
      accentColor: '#f97316',
      supportEmail: 'support@nashtransition.com',
      logoUrl: 'https://example.com/logo.svg',
    })
  })

  it('rejects invalid track ids', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/white-label', {
      method: 'PATCH',
      body: JSON.stringify({ trackId: 'unsupported_track' }),
    })

    const response = await PATCH(request)
    expect(response.status).toBe(400)
  })
})