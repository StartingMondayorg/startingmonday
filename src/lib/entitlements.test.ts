import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserSubscription: vi.fn(),
  resolveOrgScopeForUser: vi.fn(),
  getStaffMember: vi.fn(),
  redirect: vi.fn((to: string) => { throw new Error(`REDIRECT:${to}`) }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}))
vi.mock('@/lib/billing/subscription', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./billing/subscription')>()
  return { ...actual, getUserSubscription: mocks.getUserSubscription }
})
vi.mock('@/lib/org-scope', () => ({ resolveOrgScopeForUser: mocks.resolveOrgScopeForUser }))
vi.mock('@/lib/staff', () => ({ getStaffMember: mocks.getStaffMember }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))

import { isEntitled, isStaffOperator, loadEntitlementInputs, requireEntitlement, type EntitlementInputs } from './entitlements'
import type { UserSubscription } from './billing/subscription'

function sub(tier: UserSubscription['tier'], status = 'active'): UserSubscription {
  return {
    tier,
    status,
    trialEndsAt: null,
    periodEnd: null,
    isActive: status === 'active' || status === 'trialing',
    isPaid: status === 'active',
    isPaused: false,
  } as UserSubscription
}

function inputs(overrides: Partial<EntitlementInputs>): EntitlementInputs {
  return { subscription: sub('active'), partnerId: null, staff: null, ...overrides }
}

describe('R-6 entitlements', () => {
  it('coach surfaces require the coach tier', () => {
    expect(isEntitled('coach', inputs({ subscription: sub('coach') }))).toBe(true)
    expect(isEntitled('coach', inputs({ subscription: sub('active') }))).toBe(false)
    expect(isEntitled('coach', inputs({ subscription: sub('free', 'trialing') }))).toBe(false)
  })

  it('partner and outplacement surfaces require a partner organisation', () => {
    expect(isEntitled('partner', inputs({ partnerId: 'p1' }))).toBe(true)
    expect(isEntitled('partner', inputs({ partnerId: null }))).toBe(false)
  })

  it('chat follows the ai_chat feature map, including trial access', () => {
    expect(isEntitled('ai_chat', inputs({ subscription: sub('active') }))).toBe(true)
    expect(isEntitled('ai_chat', inputs({ subscription: sub('free', 'trialing') }))).toBe(true)
    expect(isEntitled('ai_chat', inputs({ subscription: sub('passive') }))).toBe(false)
    expect(isEntitled('ai_chat', inputs({ subscription: sub('free') }))).toBe(false)
  })

  it('staff operators pass every gate; viewers do not', () => {
    const owner = { id: 's1', email: 'o@example.com', role: 'owner' as const, permissions: {}, created_at: '', created_by: null }
    const viewer = { ...owner, role: 'viewer' as const }
    expect(isStaffOperator(owner)).toBe(true)
    expect(isStaffOperator(viewer)).toBe(false)
    for (const kind of ['coach', 'partner', 'ai_chat'] as const) {
      expect(isEntitled(kind, inputs({ subscription: sub('free'), staff: owner }))).toBe(true)
      expect(isEntitled(kind, inputs({ subscription: sub('free'), staff: viewer }))).toBe(false)
    }
  })
})

describe('R-6 entitlement loading and route gate', () => {
  beforeEach(() => {
    for (const m of Object.values(mocks)) if ('mockReset' in m) m.mockReset()
    mocks.redirect.mockImplementation((to: string) => { throw new Error(`REDIRECT:${to}`) })
  })

  it('loads subscription, partner scope, and staff together', async () => {
    mocks.getUserSubscription.mockResolvedValue(sub('active'))
    mocks.resolveOrgScopeForUser.mockResolvedValue({ ok: true, partnerId: 'p1' })
    mocks.getStaffMember.mockResolvedValue(null)

    const user = { id: 'u1', aud: 'authenticated', email: 'u@example.com', email_confirmed_at: '2026-01-01T00:00:00.000Z' }
    const inputs = await loadEntitlementInputs(user)

    expect(inputs.partnerId).toBe('p1')
    expect(inputs.subscription.tier).toBe('active')
    expect(mocks.resolveOrgScopeForUser).toHaveBeenCalledWith({ userId: 'u1', email: 'u@example.com' })
    expect(mocks.getStaffMember).toHaveBeenCalledWith(user)
  })

  it('treats an orphaned team seat as no partner and passes the auth user to the staff lookup', async () => {
    mocks.getUserSubscription.mockResolvedValue(sub('free'))
    mocks.resolveOrgScopeForUser.mockResolvedValue({ ok: false, reason: 'orphaned_team_seat' })
    mocks.getStaffMember.mockResolvedValue(null)

    const user = { id: 'u1', aud: 'authenticated', email: undefined }
    const inputs = await loadEntitlementInputs(user)

    expect(inputs.partnerId).toBeNull()
    expect(mocks.resolveOrgScopeForUser).toHaveBeenCalledWith({ userId: 'u1', email: null })
    expect(mocks.getStaffMember).toHaveBeenCalledWith(user)
  })

  it('redirects to /login without a session', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })

    await expect(requireEntitlement('coach')).rejects.toThrow('REDIRECT:/login')
    expect(mocks.getUserSubscription).not.toHaveBeenCalled()
  })

  it('redirects to /dashboard when the entitlement is missing', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'u@example.com' } } })
    mocks.getUserSubscription.mockResolvedValue(sub('active'))
    mocks.resolveOrgScopeForUser.mockResolvedValue({ ok: true, partnerId: null })
    mocks.getStaffMember.mockResolvedValue(null)

    await expect(requireEntitlement('partner')).rejects.toThrow('REDIRECT:/dashboard')
  })

  it('returns the inputs when the entitlement holds', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: null } } })
    mocks.getUserSubscription.mockResolvedValue(sub('coach'))
    mocks.resolveOrgScopeForUser.mockResolvedValue({ ok: true, partnerId: null })
    mocks.getStaffMember.mockResolvedValue(null)

    const inputs = await requireEntitlement('coach')

    expect(inputs.subscription.tier).toBe('coach')
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})