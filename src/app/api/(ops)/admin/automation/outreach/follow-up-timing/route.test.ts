import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  listContacts: vi.fn(),
  existingFollowUp: vi.fn(),
  insertFollowUp: vi.fn(),
  updateContact: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    limit: state.listContacts,
                  })),
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: state.updateContact,
            })),
          })),
        }
      }

      if (table === 'follow_ups') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: state.existingFollowUp,
                  })),
                })),
              })),
            })),
          })),
          insert: state.insertFollowUp,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/outreach/follow-up-timing/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.listContacts.mockResolvedValue({
      data: [
        { id: 'contact-1', name: 'Avery', contacted_at: '2026-01-01T00:00:00.000Z' },
      ],
    })
    state.existingFollowUp.mockResolvedValue({ data: null })
    state.insertFollowUp.mockResolvedValue({ error: null })
    state.updateContact.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/follow-up-timing', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when caller is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/follow-up-timing', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('creates follow-up tasks only when no pending follow-up exists', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/follow-up-timing', {
      method: 'POST',
      body: JSON.stringify({ lookbackDays: 7, limit: 50 }),
    }))

    expect(state.insertFollowUp).toHaveBeenCalledTimes(1)
    expect(state.updateContact).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, evaluated: 1, created: 1 })
  })
})
