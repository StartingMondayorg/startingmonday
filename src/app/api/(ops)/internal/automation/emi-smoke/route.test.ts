import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}))

import { POST } from './route'

describe('EMI smoke route', () => {
  it('rejects requests with an invalid smoke token', async () => {
    vi.stubEnv('EMI_SMOKE_TOKEN', 'expected-token')
    const request = new NextRequest('https://startingmonday.app/api/internal/automation/emi-smoke', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-token' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
