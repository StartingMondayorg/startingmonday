import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  isRelationshipNetworkMatchingEnabled: vi.fn(),
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/feature-flags', () => ({
  isRelationshipNetworkMatchingEnabled: state.isRelationshipNetworkMatchingEnabled,
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

import { GET, POST, PATCH } from './route'

describe('src/app/api/linkedin-import/match/route.ts', () => {
  it('returns 403 across all handlers when relationship network matching is disabled', async () => {
    state.isRelationshipNetworkMatchingEnabled.mockReturnValue(false)

    const getResponse = await GET(new NextRequest('https://startingmonday.app/api/linkedin-import/match?company_id=test'))
    const postResponse = await POST(new NextRequest('https://startingmonday.app/api/linkedin-import/match', {
      method: 'POST',
      body: JSON.stringify({ match_id: 'm1', confirm: true }),
      headers: { 'content-type': 'application/json' },
    }))
    const patchResponse = await PATCH(new NextRequest('https://startingmonday.app/api/linkedin-import/match', {
      method: 'PATCH',
      body: JSON.stringify({ match_id: 'm1' }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(getResponse.status).toBe(403)
    await expect(getResponse.json()).resolves.toEqual({ error: 'Relationship network matching is currently disabled.' })
    expect(postResponse.status).toBe(403)
    await expect(postResponse.json()).resolves.toEqual({ error: 'Relationship network matching is currently disabled.' })
    expect(patchResponse.status).toBe(403)
    await expect(patchResponse.json()).resolves.toEqual({ error: 'Relationship network matching is currently disabled.' })
    expect(state.requireAuth).not.toHaveBeenCalled()
  })
})
