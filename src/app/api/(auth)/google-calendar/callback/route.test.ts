import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  exchangeGoogleCalendarCode: vi.fn(),
  syncGoogleCalendarIntegration: vi.fn(),
  integrationSingle: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/google-calendar', () => ({
  exchangeGoogleCalendarCode: state.exchangeGoogleCalendarCode,
  syncGoogleCalendarIntegration: state.syncGoogleCalendarIntegration,
}))

vi.mock('@/lib/config', () => ({
  APP_URL: 'https://startingmonday.app',
}))

import { GET } from './route'

describe('google calendar callback route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.integrationSingle.mockResolvedValue({ data: { id: 'integration-1' }, error: null })
    state.upsert.mockReturnValue({ select: () => ({ single: state.integrationSingle }) })
    state.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) } })
    state.createAdminClient.mockReturnValue({
      from: () => ({
        upsert: state.upsert,
      }),
    })
    state.exchangeGoogleCalendarCode.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_at: '2026-01-01T00:00:00.000Z',
      scope: 'calendar.readonly',
    })
    state.syncGoogleCalendarIntegration.mockResolvedValue(undefined)
  })

  it('redirects to login when the user is not authenticated', async () => {
    state.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/google-calendar/callback?code=abc&state=xyz', { method: 'GET' }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/login')
  })

  it('redirects with an error when the state cookie is missing', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/google-calendar/callback?code=abc&state=xyz', { method: 'GET' }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('google_calendar=error')
  })

  it('stores the integration and redirects to the return path', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/google-calendar/callback?code=abc&state=xyz', {
      method: 'GET',
      headers: {
        cookie: 'sm_google_calendar_oauth_state=xyz; sm_google_calendar_return_to=/dashboard/coach',
      },
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/dashboard/coach')
    expect(state.exchangeGoogleCalendarCode).toHaveBeenCalledWith('abc')
    expect(state.syncGoogleCalendarIntegration).toHaveBeenCalled()
  })
})
