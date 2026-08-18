import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  listLogs: vi.fn(),
  lookupContact: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table === 'outreach_logs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: state.listLogs,
                    })),
                  })),
                })),
              })),
            })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              ilike: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: state.lookupContact,
                })),
              })),
            })),
          })),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/outreach/reconcile-live-sends/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.listLogs.mockResolvedValue({ data: [{ id: 'log-1', recipient_email: 'lead@acme.com', recipient_name: 'Lead', sent_at: '2026-01-02T00:00:00.000Z' }], error: null })
    state.lookupContact.mockResolvedValue({ data: null, error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/reconcile-live-sends', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/reconcile-live-sends', { method: 'POST' }))
    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('reports dry-run recipients without creating contacts', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/outreach/reconcile-live-sends', {
      method: 'POST',
      body: JSON.stringify({ dryRun: true, days: 7, limit: 10 }),
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      dryRun: true,
      scanned: 1,
      createdContacts: 0,
      missingRecipients: [{ email: 'lead@acme.com' }],
    })
  })
})
