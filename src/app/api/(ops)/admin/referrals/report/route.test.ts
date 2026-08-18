import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type RowMap = Record<string, unknown[]>

const state = vi.hoisted(() => ({
  user: { id: 'staff_1', email: 'staff@startingmonday.app' } as { id: string; email: string } | null,
  staff: { id: 'st_1' } as { id: string } | null,
  rowsByTable: {} as RowMap,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
  }),
}))

vi.mock('@/lib/staff', () => ({
  getStaffMember: async () => state.staff,
}))

function queryFor(table: string) {
  const builder = {
    select: () => builder,
    gte: () => builder,
    in: () => builder,
    limit: async () => ({ data: state.rowsByTable[table] ?? [] }),
  }
  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => queryFor(table),
  }),
}))

import { GET } from './route'

describe('admin referral report route', () => {
  beforeEach(() => {
    state.user = { id: 'staff_1', email: 'staff@startingmonday.app' }
    state.staff = { id: 'st_1' }
    state.rowsByTable = {}
  })

  it('returns 401 when no authenticated user exists', async () => {
    state.user = null
    const req = new NextRequest('https://startingmonday.app/api/admin/referrals/report')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-staff users', async () => {
    state.staff = null
    const req = new NextRequest('https://startingmonday.app/api/admin/referrals/report')
    const res = await GET(req)

    expect(res.status).toBe(403)
  })

  it('returns referral attribution coverage counts and detailed rows', async () => {
    state.rowsByTable = {
      users: [
        {
          id: 'u1',
          created_at: '2026-07-02T10:00:00.000Z',
          referral_source: 'COACH1',
          signup_source: 'COACH1',
          acquisition_channel: 'referral',
        },
        {
          id: 'u2',
          created_at: '2026-07-01T10:00:00.000Z',
          referral_source: 'COACH2',
          signup_source: 'COACH2',
          acquisition_channel: 'referral',
        },
        {
          id: 'u3',
          created_at: '2026-07-01T08:00:00.000Z',
          referral_source: null,
          signup_source: null,
          acquisition_channel: null,
        },
      ],
      referral_attributions: [
        { signup_user_id: 'u1', partner_id: 'p1' },
      ],
      user_profiles: [
        { user_id: 'u1', referred_by: 'COACH1', referred_by_name: 'Jordan Patel', referred_by_company: 'Coach One LLC' },
        { user_id: 'u2', referred_by: 'COACH2', referred_by_name: 'Mina Kim', referred_by_company: 'Career Partners' },
      ],
      partners: [
        { id: 'p1', name: 'Coach One', referral_code: 'COACH1' },
      ],
    }

    const req = new NextRequest('https://startingmonday.app/api/admin/referrals/report?lookbackDays=30')
    const res = await GET(req)
    const body = await res.json() as {
      counts: {
        referral_source_users: number
        attributed_users: number
        missing_attribution_users: number
        profile_referred_by_users: number
      }
      missingAttributionUsers: Array<{ id: string }>
      recentAttributions: Array<{ signup_user_id: string; partner_referral_code: string | null }>
    }

    expect(res.status).toBe(200)
    expect(body.counts).toEqual({
      referral_source_users: 2,
      attributed_users: 1,
      missing_attribution_users: 1,
      profile_referred_by_users: 2,
    })
    expect(body.missingAttributionUsers).toEqual([
      expect.objectContaining({ id: 'u2' }),
    ])
    expect(body.recentAttributions).toEqual([
      expect.objectContaining({
        signup_user_id: 'u1',
        partner_referral_code: 'COACH1',
        profile_referred_by_name: 'Jordan Patel',
        profile_referred_by_company: 'Coach One LLC',
      }),
    ])

    expect(body.missingAttributionUsers).toEqual([
      expect.objectContaining({
        id: 'u2',
        profile_referred_by_name: 'Mina Kim',
        profile_referred_by_company: 'Career Partners',
      }),
    ])
  })
})
