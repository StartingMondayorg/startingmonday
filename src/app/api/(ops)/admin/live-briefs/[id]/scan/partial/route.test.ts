import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({ requireLiveBriefMutationAccess: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('@/lib/live-brief-auth', () => ({ requireLiveBriefMutationAccess: mocked.requireLiveBriefMutationAccess }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { POST } from './route'

const auth = { userId: 'user-1', userEmail: 'mo@example.com', staff: { id: 'staff-1', role: 'admin' } }
const context = { params: Promise.resolve({ id: 'request-1' }) }
const request = new NextRequest('https://startingmonday.app/api/admin/live-briefs/request-1/scan/partial', { method: 'POST' })

function configureAdmin(eventError: Error | null = null) {
  const run = vi.fn().mockResolvedValue({ data: { id: 'run-1', request_id: 'request-1', status: 'scanning' }, error: null })
  const runEq = vi.fn().mockResolvedValue({ error: null })
  const runUpdate = vi.fn().mockReturnValue({ eq: runEq })
  const requestEq = vi.fn().mockResolvedValue({ error: null })
  const requestUpdate = vi.fn().mockReturnValue({ eq: requestEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: run }) }) }) }) })
    .mockReturnValueOnce({ update: runUpdate })
    .mockReturnValueOnce({ update: requestUpdate })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update: requestUpdate })
    .mockReturnValueOnce({ update: runUpdate })
  mocked.createAdminClient.mockReturnValue({ from })
  return { runUpdate, requestUpdate, eventInsert }
}

beforeEach(() => { vi.clearAllMocks(); mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth) })

describe('POST /api/admin/live-briefs/[id]/scan/partial', () => {
  it('accepts an active run and journals the human decision', async () => {
    const { runUpdate, requestUpdate, eventInsert } = configureAdmin()
    const response = await POST(request, context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ accepted: true, run_id: 'run-1', status: 'partial_ready' })
    expect(runUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'partial_ready', accepted_partial_by_user_id: auth.userId }))
    expect(requestUpdate).toHaveBeenCalledWith({ status: 'ready_for_review' })
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'scan_partial_accepted' }))
  })

  it('rejects terminal runs', async () => {
    const run = vi.fn().mockResolvedValue({ data: { id: 'run-1', request_id: 'request-1', status: 'completed' }, error: null })
    mocked.createAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: run }) }) }) }) }) })
    expect((await POST(request, context)).status).toBe(409)
  })
})