import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateInternalRouteRequest: vi.fn(),
  createServiceClient: vi.fn(),
  select: vi.fn(),
  limit: vi.fn(),
}))

vi.mock('@/lib/internal-route-auth', () => ({
  validateInternalRouteRequest: state.validateInternalRouteRequest,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: state.createServiceClient,
}))

import { GET } from './route'

describe('api admin health route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    state.validateInternalRouteRequest.mockReturnValue(true)
    state.limit.mockResolvedValue({ error: null })
    state.select.mockReturnValue({ limit: state.limit })
    state.createServiceClient.mockReturnValue({ from: () => ({ select: state.select }) })
  })

  it('returns 404 when the internal route guard blocks the request', async () => {
    state.validateInternalRouteRequest.mockReturnValue(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/health'))

    expect(response.status).toBe(404)
    expect(state.createServiceClient).not.toHaveBeenCalled()
  })

  it('returns ok when the database ping succeeds', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/health'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.createServiceClient).toHaveBeenCalledWith('https://supabase.example.com', 'service-role-key')
  })

  it('returns 503 when the database ping fails', async () => {
    state.limit.mockResolvedValue({ error: { message: 'db down' } })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET(new NextRequest('https://startingmonday.app/api/admin/health'))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ ok: false })
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
