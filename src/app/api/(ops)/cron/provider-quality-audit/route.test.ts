import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({
  validateCronRequest: state.validateCronRequest,
}))

import { GET, runtime } from './route'

describe('provider-quality-audit route', () => {
  it('exports a static nodejs runtime', () => {
    expect(runtime).toBe('nodejs')
  })

  it('returns 403 when cron auth is invalid', async () => {
    state.validateCronRequest.mockReturnValue(false)

    const request = new NextRequest('https://startingmonday.app/api/cron/provider-quality-audit?health=1')
    const response = await GET(request)

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' })
  })
})
