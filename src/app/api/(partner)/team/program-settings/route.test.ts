import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  userId: 'u_1',
  userEmail: 'coach@example.com',
  partner: null as null | Record<string, unknown>,
  programSettings: null as null | Record<string, unknown>,
  upsertError: null as Error | null,
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
            eq: () => ({ maybeSingle: async () => ({ data: { email: state.userEmail }, error: null }) }),
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
                  const matchesUser = conditions.some(([key, current]) => key === 'user_id' && current === state.userId)
                  const matchesEmail = conditions.some(([key, current]) => key === 'email' && current === state.userEmail)
                  const matchesActive = conditions.some(([key, current]) => key === 'is_active' && current === true)
                  const partnerMatches = (matchesUser && partner.user_id === state.userId) || (matchesEmail && matchesActive && partner.email === state.userEmail)
                  return { data: partnerMatches ? partner : null, error: null }
                },
              }
              return chain
            },
          }),
          update: (updates: Record<string, unknown>) => ({
            eq: async () => {
              state.partner = { ...state.partner, ...updates }
              return { error: null }
            },
          }),
        }
      }

      if (table === 'partner_program_settings') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.programSettings, error: null }),
            }),
          }),
          upsert: (row: Record<string, unknown>) => {
            const { partner_id: _partnerId, ...settings } = row
            state.programSettings = { ...state.programSettings, ...settings }
            return Promise.resolve({ error: state.upsertError })
          },
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

describe('partner program settings route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: state.userId, response: new Response() })
    state.partner = {
      id: 'partner_1',
      email: state.userEmail,
      user_id: state.userId,
    }
    state.programSettings = null
    state.upsertError = null
  })

  it('returns defaults when no settings exist', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/program-settings', { method: 'GET' })
    const response = await GET(request)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data).toMatchObject({
      defaultProgram: 'outplacement_standard',
      sponsorTemplateVariant: 'pilot_compact',
      weeklySummaryDay: 'friday',
      cohortNamingPrefix: null,
    })
  })

  it('saves custom partner program settings', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/program-settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultProgram: 'outplacement_boutique',
        sponsorTemplateVariant: 'enterprise_board',
        weeklySummaryDay: 'monday',
        cohortNamingPrefix: 'NTG',
      }),
    })
    const response = await PATCH(request)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.data).toMatchObject({
      defaultProgram: 'outplacement_boutique',
      sponsorTemplateVariant: 'enterprise_board',
      weeklySummaryDay: 'monday',
      cohortNamingPrefix: 'NTG',
    })
  })

  it('rejects invalid program ids', async () => {
    const request = new NextRequest('https://startingmonday.app/api/team/program-settings', {
      method: 'PATCH',
      body: JSON.stringify({ defaultProgram: 'unsupported' }),
    })
    const response = await PATCH(request)
    expect(response.status).toBe(400)
  })
})
