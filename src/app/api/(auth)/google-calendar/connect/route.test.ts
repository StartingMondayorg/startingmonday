import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authGetUser, buildGoogleCalendarAuthUrl } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  buildGoogleCalendarAuthUrl: vi.fn(),
}))

vi.mock('@/lib/config', () => ({
  APP_URL: 'https://example.com',
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: authGetUser,
    },
  })),
}))

vi.mock('@/lib/google-calendar', () => ({
  buildGoogleCalendarAuthUrl,
}))

import { GET } from './route'

function createRequest(url: string) {
  return new Request(url) as never
}

function readRedirectLocation(response: Response) {
  const location = response.headers.get('location')
  expect(location).toBeTruthy()
  return new URL(location!)
}

describe('src/app/api/google-calendar/connect/route.ts', () => {
  beforeEach(() => {
    authGetUser.mockReset()
    buildGoogleCalendarAuthUrl.mockReset()
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  })

  it('redirects unauthenticated users to login', async () => {
    authGetUser.mockResolvedValueOnce({ data: { user: null } })

    const response = await GET(createRequest('https://example.com/api/google-calendar/connect?returnTo=/dashboard/admin/social'))

    expect(response.headers.get('location')).toBe('https://example.com/login')
    expect(buildGoogleCalendarAuthUrl).not.toHaveBeenCalled()
  })

  it('falls back to a friendly redirect when oauth is unavailable', async () => {
    buildGoogleCalendarAuthUrl.mockImplementationOnce(() => {
      throw new Error('missing google calendar env')
    })

    const response = await GET(createRequest('https://example.com/api/google-calendar/connect?returnTo=/dashboard/admin/social'))
    const location = readRedirectLocation(response)

    expect(location.origin).toBe('https://example.com')
    expect(location.pathname).toBe('/dashboard/admin/social')
    expect(location.searchParams.get('google_calendar')).toBe('error')
    expect(location.searchParams.get('message')).toBe('Google Calendar is not configured for this environment.')
    expect(buildGoogleCalendarAuthUrl).toHaveBeenCalledTimes(1)
  })
})
