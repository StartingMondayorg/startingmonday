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

import { GET } from './route'

describe('src/app/api/linkedin-import/audit/route.ts', () => {
  it('returns 403 when relationship network matching is disabled', async () => {
    state.isRelationshipNetworkMatchingEnabled.mockReturnValue(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/linkedin-import/audit?consent_id=test'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Relationship network matching is currently disabled.' })
    expect(state.requireAuth).not.toHaveBeenCalled()
  })
})
