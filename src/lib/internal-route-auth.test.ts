import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { validateInternalRouteRequest } from './internal-route-auth'

describe('internal route auth', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv('INTERNAL_ROUTE_SECRET', 'internal-secret')
    vi.stubEnv('INTERNAL_IP_ALLOWLIST', '203.0.113.10')
  })

  it('accepts a valid secret and rightmost forwarded proxy address', () => {
    const request = new NextRequest('https://startingmonday.app/api/debug/supabase-host', {
      headers: {
        'x-internal-secret': 'internal-secret',
        'x-forwarded-for': '198.51.100.5, 203.0.113.10',
      },
    })

    expect(validateInternalRouteRequest(request)).toBe(true)
  })

  it('rejects a spoofed leftmost forwarded address', () => {
    const request = new NextRequest('https://startingmonday.app/api/debug/supabase-host', {
      headers: {
        'x-internal-secret': 'internal-secret',
        'x-forwarded-for': '203.0.113.10, 198.51.100.5',
      },
    })

    expect(validateInternalRouteRequest(request)).toBe(false)
  })
})
