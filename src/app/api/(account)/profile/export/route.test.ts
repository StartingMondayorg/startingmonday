import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  createClient: vi.fn(),
  userGetUser: vi.fn(),
  profileSingle: vi.fn(),
  companiesOrder: vi.fn(),
  contactsOrder: vi.fn(),
  followUpsOrder: vi.fn(),
  signalsLimit: vi.fn(),
  briefsLimit: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { GET } from './route'

describe('profile export route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.userGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'coach@example.com' } } })
    state.profileSingle.mockResolvedValue({ data: { full_name: 'Coach Example' } })
    state.companiesOrder.mockResolvedValue({ data: [{ name: 'Acme' }], error: null })
    state.contactsOrder.mockResolvedValue({ data: [{ name: 'Contact One' }], error: null })
    state.followUpsOrder.mockResolvedValue({ data: [{ action: 'Follow up' }], error: null })
    state.signalsLimit.mockResolvedValue({ data: [{ signal_type: 'funding' }], error: null })
    state.briefsLimit.mockResolvedValue({ data: [{ type: 'prep' }], error: null })
    state.createClient.mockResolvedValue({
      auth: { getUser: state.userGetUser },
      from(table: string) {
        if (table === 'user_profiles') {
          return {
            select: () => ({ eq: () => ({ single: state.profileSingle }) }),
          }
        }
        if (table === 'companies') {
          return {
            select: () => ({ eq: () => ({ is: () => ({ order: state.companiesOrder }) }) }),
          }
        }
        if (table === 'contacts') {
          return {
            select: () => ({ eq: () => ({ eq: () => ({ order: state.contactsOrder }) }) }),
          }
        }
        if (table === 'follow_ups') {
          return {
            select: () => ({ eq: () => ({ order: state.followUpsOrder }) }),
          }
        }
        if (table === 'company_signals') {
          return {
            select: () => ({ eq: () => ({ order: () => ({ limit: state.signalsLimit }) }) }),
          }
        }
        return {
          select: () => ({ eq: () => ({ order: () => ({ limit: state.briefsLimit }) }) }),
        }
      },
    })
  })

  it('returns unauthorized when no user is present', async () => {
    state.userGetUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/profile/export'))

    expect(response.status).toBe(401)
  })

  it('returns a downloadable json export', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/profile/export'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('content-disposition')).toContain('startingmonday-export-')
    const body = await response.json()
    expect(body.account.email).toBe('coach@example.com')
    expect(body.profile.full_name).toBe('Coach Example')
    expect(body.companies).toHaveLength(1)
    expect(body.contacts).toHaveLength(1)
    expect(body.follow_ups).toHaveLength(1)
    expect(body.company_signals).toHaveLength(1)
    expect(body.briefs).toHaveLength(1)
  })
})
