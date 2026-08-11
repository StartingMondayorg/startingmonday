import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { proxy } from './proxy'

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

describe('src/proxy.ts middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    delete process.env.DEMO_USER_ID
    delete process.env.DEV_AUTH_EMAIL
  })

  describe('API routes', () => {
    it('should return 403 for bot user-agents on /api/optimize', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/optimize'), {
        headers: {
          'user-agent': 'curl/7.64.1',
        },
      })

      const response = await proxy(request)
      expect(response.status).toBe(403)
    })

    it('should return 403 for empty user-agent on /api/optimize', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/optimize'), {
        headers: {},
      })

      const response = await proxy(request)
      expect(response.status).toBe(403)
    })

    it('should allow browser user-agents on /api/optimize', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/optimize'), {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      const response = await proxy(request)
      expect(response.status).not.toBe(403)
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('should set NOINDEX headers on all API responses', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/some-endpoint'), {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('should set X-Request-Id header', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.headers.get('X-Request-Id')).toBeTruthy()
    })
  })

  describe('Intelligence routes', () => {
    it('should return 403 for bot user-agents on /intelligence routes', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/intelligence/discover'), {
        headers: {
          'user-agent': 'python-requests/2.28.0',
        },
      })

      const response = await proxy(request)
      expect(response.status).toBe(403)
    })

    it('should return 403 for empty user-agent on /intelligence routes', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/intelligence/signals'), {
        headers: {},
      })

      const response = await proxy(request)
      expect(response.status).toBe(403)
    })

    it('should allow browser user-agents on /intelligence routes', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/intelligence/data'), {
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
      })

      const response = await proxy(request)
      expect(response.status).not.toBe(403)
    })
  })

  describe('Bot detection patterns', () => {
    const botPatterns = [
      'curl/7.64.1',
      'python-requests/2.28.0',
      'python-urllib/3.9',
      'Go-http-client/1.1',
      'java/11.0.11',
      'wget/1.21',
      'scrapy/2.5.0',
      'httpx/0.23.0',
      'aiohttp/3.8.0',
      'okhttp/4.10.0',
      'axios/1.2.0',
      'node-fetch/3',
      'ruby/2.7.0',
      'perl/5.32',
      'php/8.0',
      'spider',
      'crawler',
      'bot',
      'HeadlessChrome',
    ]

    botPatterns.forEach((pattern) => {
      it(`should block ${pattern}`, async () => {
        const request = new NextRequest(new URL('http://localhost:3000/api/optimize'), {
          headers: { 'user-agent': pattern },
        })
        const response = await proxy(request)
        expect(response.status).toBe(403)
      })
    })
  })

  describe('Request ID handling', () => {
    it('should preserve X-Request-Id from headers if provided', async () => {
      const providedId = 'req_custom123456789'
      const request = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-request-id': providedId,
        },
      })

      const response = await proxy(request)
      expect(response.headers.get('X-Request-Id')).toBe(providedId)
    })

    it('should generate X-Request-Id if not provided', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      const requestId = response.headers.get('X-Request-Id')
      expect(requestId).toBeTruthy()
      expect(requestId).toMatch(/^req_[a-f0-9]{16}$/)
    })
  })

  describe('dev auth bypass', () => {
    it('redirects login requests to dashboard when local dev auth is enabled', async () => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
      process.env.DEMO_USER_ID = 'demo-user-123'

      const request = new NextRequest(new URL('http://localhost:3000/login'), {
        headers: { 'user-agent': 'Mozilla/5.0' },
      })

      const response = await proxy(request)
      expect(response.headers.get('location')).toMatch('/dashboard')
    })

    it('bypasses the dashboard redirect guard when local dev auth is enabled', async () => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
      process.env.DEMO_USER_ID = 'demo-user-123'

      const request = new NextRequest(new URL('http://localhost:3000/dashboard'), {
        headers: { 'user-agent': 'Mozilla/5.0' },
      })

      const response = await proxy(request)
      expect(response.status).not.toBe(307)
      expect(response.headers.get('X-Request-Id')).toBeTruthy()
    })
  })

  describe('protected route indexing', () => {
    it.each(['/dashboard', '/settings/billing'])('redirects anonymous %s requests with noindex headers', async (pathname) => {
      vi.mocked(createServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as never)

      const request = new NextRequest(new URL(`https://startingmonday.app${pathname}`), {
        headers: { 'user-agent': 'Googlebot' },
      })

      const response = await proxy(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://startingmonday.app/login')
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
      expect(response.headers.get('X-Request-Id')).toBeTruthy()
    })
  })

  describe('MandateSignal host gating', () => {
    it('redirects non-standalone routes to home on mandatesignal.com', async () => {
      const request = new NextRequest(new URL('https://mandatesignal.com/for-cio'), {
        headers: {
          host: 'mandatesignal.com',
          'x-forwarded-host': 'mandatesignal.com',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://mandatesignal.com/')
    })

    it('allows standalone homepage on mandatesignal.com', async () => {
      const request = new NextRequest(new URL('https://mandatesignal.com/'), {
        headers: {
          host: 'mandatesignal.com',
          'x-forwarded-host': 'mandatesignal.com',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.status).not.toBe(307)
    })

    it('allows auth API routes on mandatesignal.com', async () => {
      const request = new NextRequest(new URL('https://mandatesignal.com/api/auth/verify-and-signin'), {
        headers: {
          host: 'mandatesignal.com',
          'x-forwarded-host': 'mandatesignal.com',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.status).not.toBe(307)
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    })

    it('redirects intelligence routes to home on mandatesignal.com', async () => {
      const request = new NextRequest(new URL('https://mandatesignal.com/intelligence/radar'), {
        headers: {
          host: 'mandatesignal.com',
          'x-forwarded-host': 'mandatesignal.com',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const response = await proxy(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://mandatesignal.com/')
    })
  })
})
