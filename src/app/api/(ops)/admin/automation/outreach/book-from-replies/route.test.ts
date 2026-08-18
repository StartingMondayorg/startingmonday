import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  listInbox: vi.fn(),
  existingContact: vi.fn(),
  insertContact: vi.fn(),
  insertBooking: vi.fn(),
  updateContact: vi.fn(),
  updateInbox: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table === 'outreach_reply_inbox') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: state.listInbox,
                    })),
                  })),
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: state.updateInbox,
            })),
          })),
        }
      }

      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: state.existingContact,
                })),
              })),
            })),
          })),
          insert: state.insertContact,
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: state.updateContact,
            })),
          })),
        }
      }

      if (table === 'meeting_bookings') {
        return {
          insert: state.insertBooking,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/outreach/book-from-replies/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.listInbox.mockResolvedValue({ data: [{ id: 'msg-1', email: 'prospect@acme.com', contact_id: null }] })
    state.existingContact.mockResolvedValue({ data: null })
    state.insertContact.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'contact-1' } }),
      })),
    })
    state.insertBooking.mockResolvedValue({ error: null })
    state.updateContact.mockResolvedValue({ error: null })
    state.updateInbox.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/book-from-replies', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when caller is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/book-from-replies', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('creates contact and booking for interested meeting-signal replies', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/book-from-replies', {
      method: 'POST',
      body: JSON.stringify({ limit: 25 }),
    }))

    expect(state.insertContact).toHaveBeenCalledTimes(1)
    expect(state.insertBooking).toHaveBeenCalledTimes(1)
    expect(state.updateContact).toHaveBeenCalledTimes(1)
    expect(state.updateInbox).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, processed: 1, booked: 1 })
  })
})
