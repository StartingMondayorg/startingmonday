import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAutomationAccess: vi.fn(),
  parseAutomationBody: vi.fn(),
  asLooseSupabaseClient: vi.fn(),
  enqueueOnboardingVideoRun: vi.fn(),
  fetchOnboardingVideoRunSnapshot: vi.fn(),
  eventQueryLimit: vi.fn(),
}))

vi.mock('@/lib/admin-automation-route', () => ({
  requireAutomationAccess: state.requireAutomationAccess,
  parseAutomationBody: state.parseAutomationBody,
  asLooseSupabaseClient: state.asLooseSupabaseClient,
}))

vi.mock('@/lib/onboarding-video-queue', () => ({
  enqueueOnboardingVideoRun: state.enqueueOnboardingVideoRun,
  fetchOnboardingVideoRunSnapshot: state.fetchOnboardingVideoRunSnapshot,
}))

import { GET, POST } from './route'

describe('src/app/api/admin/automation/onboarding/video-queue/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAutomationAccess.mockResolvedValue({ ok: true, userId: 'user-1', supabase: { key: 'raw' } })
    state.parseAutomationBody.mockResolvedValue({
      ok: true,
      body: {
        workflow_id: undefined,
        trigger_source: 'manual',
        provider: 'heygen',
        max_retries: 3,
        input_payload: { locale: 'en-US' },
      },
    })
    state.enqueueOnboardingVideoRun.mockResolvedValue({ id: 'run-1', status: 'queued' })
    state.fetchOnboardingVideoRunSnapshot.mockResolvedValue({
      runs: [{ id: 'run-1', status: 'queued' }],
      stats: { queued: 1 },
    })

    state.eventQueryLimit.mockResolvedValue({ data: [{ id: 'evt-1', run_id: 'run-1', event_type: 'queued' }] })
    state.asLooseSupabaseClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: state.eventQueryLimit,
            })),
          })),
        })),
      })),
    })
  })

  it('returns guard response when automation access check fails', async () => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    state.requireAutomationAccess.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/video-queue', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('returns parseAutomationBody response when payload validation fails', async () => {
    const invalid = NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    state.parseAutomationBody.mockResolvedValue({ ok: false, response: invalid })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/video-queue', { method: 'POST' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid payload' })
    expect(state.enqueueOnboardingVideoRun).not.toHaveBeenCalled()
  })

  it('enqueues a run and returns queue payload on success', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/video-queue', { method: 'POST' }))

    expect(state.enqueueOnboardingVideoRun).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, run: { id: 'run-1', status: 'queued' } })
  })

  it('returns 500 when enqueue operation throws', async () => {
    state.enqueueOnboardingVideoRun.mockRejectedValue(new Error('boom'))

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/video-queue', { method: 'POST' }))

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ error: 'boom' })
  })

  it('returns snapshot with events when include_events=1', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/onboarding/video-queue?include_events=1&limit=25', { method: 'GET' })
    const res = await GET(req)

    expect(state.fetchOnboardingVideoRunSnapshot).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      runs: [{ id: 'run-1', status: 'queued' }],
      events: [{ id: 'evt-1', run_id: 'run-1', event_type: 'queued' }],
    })
  })
})
