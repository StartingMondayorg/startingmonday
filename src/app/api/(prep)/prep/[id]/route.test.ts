import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requirePrepAccess: vi.fn(),
}))

vi.mock('@/lib/require-prep-access', () => ({
  requirePrepAccess: state.requirePrepAccess,
}))

import { GET, POST } from './route'

describe('prep route validation', () => {
  const validCompanyId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    state.requirePrepAccess.mockResolvedValue({
      ok: true,
      userId: 'u_1',
      tier: 'free',
      supabase: {},
    })
  })

  it('rejects invalid query params on GET', async () => {
    const req = new NextRequest(`https://startingmonday.app/api/prep/${validCompanyId}?interview_stage=bad_stage`)

    const res = await GET(req, {
      params: Promise.resolve({ id: validCompanyId }),
    })

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) })
  })

  it('rejects invalid JSON on POST', async () => {
    const req = new NextRequest(`https://startingmonday.app/api/prep/${validCompanyId}`, {
      method: 'POST',
      body: '{',
    })

    const res = await POST(req, {
      params: Promise.resolve({ id: validCompanyId }),
    })

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid JSON' })
  })
})