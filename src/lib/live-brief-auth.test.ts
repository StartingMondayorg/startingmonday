import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  hasAdminHeaderAccess: vi.fn(),
  hasRecentAuthentication: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: mocked.createClient }))
vi.mock('@/lib/staff', () => ({
  getStaffMember: mocked.getStaffMember,
  hasAdminHeaderAccess: mocked.hasAdminHeaderAccess,
}))
vi.mock('@/lib/recent-auth', () => ({ hasRecentAuthentication: mocked.hasRecentAuthentication }))

import { requireLiveBriefMutationAccess } from './live-brief-auth'

const user = { id: 'user-1', email: 'mo@example.com' }
const staff = { id: 'staff-1', role: 'admin' }

function configureAuth() {
  mocked.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: user.id, amr: [{ method: 'otp', timestamp: 1_700_000_000 }] } },
        error: null,
      }),
    },
  })
  mocked.getStaffMember.mockResolvedValue(staff)
  mocked.hasAdminHeaderAccess.mockReturnValue(true)
  mocked.hasRecentAuthentication.mockReturnValue(true)
}

beforeEach(() => {
  vi.clearAllMocks()
  configureAuth()
})

describe('requireLiveBriefMutationAccess', () => {
  it('returns the authenticated admin staff identity', async () => {
    await expect(requireLiveBriefMutationAccess()).resolves.toEqual({
      userId: user.id,
      userEmail: user.email,
      staff,
    })
  })

  it.each<[string, { userError?: Error; claimsSub?: string; recent?: boolean; admin?: boolean }]>([
    ['missing user', { userError: new Error('expired') }],
    ['claims subject mismatch', { claimsSub: 'other-user' }],
    ['stale authentication', { recent: false }],
    ['non-admin staff', { admin: false }],
  ])('fails closed for %s', async (_reason, scenario) => {
    const client = await mocked.createClient()
    if (scenario.userError) client.auth.getUser.mockResolvedValue({ data: { user: null }, error: scenario.userError })
    if (scenario.claimsSub) client.auth.getClaims.mockResolvedValue({
      data: { claims: { sub: scenario.claimsSub, amr: [{ timestamp: 1_700_000_000 }] } },
      error: null,
    })
    if (scenario.recent === false) mocked.hasRecentAuthentication.mockReturnValue(false)
    if (scenario.admin === false) mocked.hasAdminHeaderAccess.mockReturnValue(false)

    await expect(requireLiveBriefMutationAccess()).resolves.toBeNull()
  })
})