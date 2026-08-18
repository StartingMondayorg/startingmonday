import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  verifyUnsubscribeToken: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/unsubscribe-token', () => ({
  verifyUnsubscribeToken: state.verifyUnsubscribeToken,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      update: state.update,
    }),
  }),
}))

import { GET } from './route'

describe('drip unsubscribe route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.verifyUnsubscribeToken.mockReturnValue('user-1')
    state.update.mockReturnValue({ eq: () => ({ is: vi.fn().mockResolvedValue({ error: null }) }) })
  })

  it('returns 400 for invalid unsubscribe links', async () => {
    state.verifyUnsubscribeToken.mockReturnValue(null)

    const response = await GET(new NextRequest('https://startingmonday.app/api/drip/unsubscribe?uid=a&sig=b'))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid link.')
  })

  it('marks the user as unsubscribed and shows the confirmation page', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/drip/unsubscribe?uid=a&sig=b'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('You are unsubscribed.')
  })
})
