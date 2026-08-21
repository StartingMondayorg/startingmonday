import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocked = vi.hoisted(() => ({
  requireLiveBriefMutationAccess: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/live-brief-auth', () => ({ requireLiveBriefMutationAccess: mocked.requireLiveBriefMutationAccess }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }))

import { GET, POST } from './route'

const auth = { userId: 'user-1', userEmail: 'mo@example.com', staff: { id: 'staff-1', role: 'admin' } }
const context = { params: Promise.resolve({ id: 'request-1' }) }
const body = {
  idempotency_key: '11111111-1111-4111-8111-111111111111',
  companies: [
    { company_key: 'acme', company_name: 'Acme', career_page_url: 'https://acme.example/jobs' },
  ],
}

function request(value: unknown) {
  return new NextRequest('http://localhost/api/admin/live-briefs/request-1/scan', {
    method: 'POST', body: JSON.stringify(value), headers: { 'content-type': 'application/json' },
  })
}

function configureAdmin(eventError: Error | null = null, reviewedProfile: Record<string, unknown> = { title: 'VP' }) {
  const maybeRun = vi.fn().mockResolvedValue({ data: null, error: null })
  const maybeRequest = vi.fn().mockResolvedValue({ data: { status: 'reviewing', reviewed_profile: reviewedProfile }, error: null })
  const runSingle = vi.fn().mockResolvedValue({ data: { id: 'run-1', status: 'queued' }, error: null })
  const runInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: runSingle }) })
  const companyInsert = vi.fn().mockResolvedValue({ error: null })
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: updateEq })
  const eventInsert = vi.fn().mockResolvedValue({ error: eventError })
  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const remove = vi.fn().mockReturnValue({ eq: deleteEq })
  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeRun }) }) })
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeRequest }) }) })
    .mockReturnValueOnce({ insert: runInsert })
    .mockReturnValueOnce({ insert: companyInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ insert: eventInsert })
    .mockReturnValueOnce({ update })
    .mockReturnValueOnce({ delete: remove })
  mocked.createAdminClient.mockReturnValue({ from })
  return { companyInsert, eventInsert, update, remove }
}

function configureStatusAdmin() {
  const maybeRun = vi.fn().mockResolvedValue({
    data: { id: 'run-1', request_id: 'request-1', status: 'partial_ready', selected_company_count: 1 },
    error: null,
  })
  const companies = vi.fn().mockResolvedValue({
    data: [{ id: 'company-1', company_key: 'acme', company_name: 'Acme', status: 'complete' }],
    error: null,
  })
  const from = vi.fn()
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ maybeSingle: maybeRun }) }),
        }),
      }),
    })
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: companies }) }),
    })
  mocked.createAdminClient.mockReturnValue({ from })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocked.requireLiveBriefMutationAccess.mockResolvedValue(auth)
})

describe('POST /api/admin/live-briefs/[id]/scan', () => {
  it('rejects more than 10 selected companies before database access', async () => {
    const response = await POST(request({ companies: Array.from({ length: 11 }, (_, index) => ({ company_key: `c-${index}`, company_name: `Company ${index}` })) }), context)
    expect(response.status).toBe(400)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('requires a reviewed profile before creating a run', async () => {
    configureAdmin(null, {})
    const response = await POST(request(body), context)
    expect(response.status).toBe(409)
  })

  it('creates an idempotent queued run and company rows', async () => {
    const { companyInsert, eventInsert, update } = configureAdmin()
    const response = await POST(request(body), context)
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ run_id: 'run-1', status: 'queued', idempotent: false })
    expect(companyInsert).toHaveBeenCalledWith([expect.objectContaining({ run_id: 'run-1', company_key: 'acme' })])
    expect(update).toHaveBeenCalledWith({ status: 'scanning' })
    expect(eventInsert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'scan_started' }))
  })

  it('deletes the run when the start event fails', async () => {
    const { eventInsert, remove } = configureAdmin(new Error('event write failed'))
    const response = await POST(request(body), context)
    expect(response.status).toBe(500)
    expect(eventInsert).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
  })
})

describe('GET /api/admin/live-briefs/[id]/scan', () => {
  it('requires staff and recent-auth access before polling', async () => {
    mocked.requireLiveBriefMutationAccess.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/admin/live-briefs/request-1/scan'), context)
    expect(response.status).toBe(403)
    expect(mocked.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns the latest run and per-company statuses', async () => {
    configureStatusAdmin()
    const response = await GET(new NextRequest('http://localhost/api/admin/live-briefs/request-1/scan'), context)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      run: expect.objectContaining({ id: 'run-1', status: 'partial_ready' }),
      companies: [{ id: 'company-1', company_key: 'acme', company_name: 'Acme', status: 'complete' }],
    })
  })
})