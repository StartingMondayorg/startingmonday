import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireStaffAutomationAccess: vi.fn(),
  maybeSingleSnapshot: vi.fn(),
  insertBriefRun: vi.fn(),
  upsertMilestone: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/admin-automation-auth', () => ({ requireStaffAutomationAccess: state.requireStaffAutomationAccess }))

import { POST } from './route'

function buildSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'onboarding_context_snapshots') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: state.maybeSingleSnapshot,
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'onboarding_brief_runs') {
        return {
          insert: state.insertBriefRun,
        }
      }

      if (table === 'activation_milestones') {
        return {
          upsert: state.upsertMilestone,
        }
      }

      throw new Error(`Unexpected table ${table}`)
    }),
  }
}

describe('src/app/api/admin/automation/onboarding/first-brief/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true })
    state.maybeSingleSnapshot.mockResolvedValue({
      data: {
        id: 'snapshot-1',
        context_payload: {
          profile: {
            target_titles: ['Head of Product'],
            current_title: 'Product Lead',
          },
          top_companies: [{ name: 'Acme' }],
          top_contacts: [{ name: 'Jordan' }],
        },
      },
    })
    state.insertBriefRun.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'brief-1' }, error: null }),
      })),
    })
    state.upsertMilestone.mockResolvedValue({ error: null })

    const supabase = buildSupabase()
    state.requireStaffAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase })
  })

  it('returns the auth guard response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-brief', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
    expect(state.requireStaffAutomationAccess).not.toHaveBeenCalled()
  })

  it('returns 400 when no context snapshot exists', async () => {
    state.maybeSingleSnapshot.mockResolvedValue({ data: null })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-brief', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'No context snapshot found. Run Ticket 16 first.' })
  })

  it('returns 500 when onboarding brief insert fails', async () => {
    state.insertBriefRun.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      })),
    })

    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-brief', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'Failed to create first brief' })
  })

  it('creates first brief run and updates milestone on success', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/first-brief', { method: 'POST' })
    const res = await POST(req)

    expect(state.upsertMilestone).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.briefRunId).toBe('brief-1')
    expect(body.briefText).toContain('Head of Product')
    expect(body.briefText).toContain('Acme')
    expect(body.briefText).toContain('Jordan')
  })
})
