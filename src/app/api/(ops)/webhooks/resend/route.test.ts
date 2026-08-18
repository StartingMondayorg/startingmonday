import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockImplementation((body: string, headers: Record<string, string>) => {
      if (headers['svix-signature'] !== 'valid-sig') {
        throw new Error('Invalid signature')
      }
      return JSON.parse(body)
    }),
  })),
}))

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://startingmonday.app/api/webhooks/resend', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })
}

describe('resend webhook route auth', () => {
  beforeEach(() => {
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test'
  })

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET
    const request = makeRequest({ type: 'email.delivered' })
    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('returns 401 when svix signature is missing', async () => {
    const request = makeRequest({ type: 'email.delivered' })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 401 when svix signature is invalid', async () => {
    const request = makeRequest({ type: 'email.delivered' }, { 'svix-signature': 'bad-sig' })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
