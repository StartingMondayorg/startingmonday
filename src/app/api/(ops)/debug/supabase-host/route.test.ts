import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('supabase host debug route', () => {
  it('rejects requests without the internal route guard', async () => {
    vi.stubEnv('INTERNAL_ROUTE_SECRET', 'secret')
    vi.stubEnv('INTERNAL_IP_ALLOWLIST', '203.0.113.10')
    const request = new NextRequest('https://startingmonday.app/api/debug/supabase-host')
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
