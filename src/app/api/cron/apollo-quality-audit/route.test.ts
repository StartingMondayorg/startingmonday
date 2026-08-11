import { describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  providerGet: vi.fn(),
}))

vi.mock('@/app/api/cron/provider-quality-audit/route', () => ({
  GET: state.providerGet,
}))

import { GET, runtime } from './route'

describe('apollo-quality-audit compatibility route', () => {
  it('exports a static nodejs runtime', () => {
    expect(runtime).toBe('nodejs')
  })

  it('delegates GET handling to provider-quality-audit route', async () => {
    const response = NextResponse.json({ ok: true, delegated: true })
    state.providerGet.mockResolvedValueOnce(response)

    const request = new NextRequest('https://startingmonday.app/api/cron/apollo-quality-audit?health=1')
    const result = await GET(request)
    const body = await result.json()

    expect(state.providerGet).toHaveBeenCalledTimes(1)
    expect(state.providerGet).toHaveBeenCalledWith(request)
    expect(result.status).toBe(200)
    expect(body).toEqual({ ok: true, delegated: true })
    expect(result.headers.get('x-startingmonday-compat-route')).toBe('apollo-quality-audit')
    expect(result.headers.get('x-startingmonday-replacement-route')).toBe('provider-quality-audit')
    expect(result.headers.get('deprecation')).toBe('true')
    expect(result.headers.get('sunset')).toBe('Wed, 30 Sep 2026 00:00:00 GMT')
    expect(result.headers.get('link')).toBe('</api/cron/provider-quality-audit>; rel="successor-version"')
    expect(result.headers.get('warning')).toBe('299 - "Deprecated cron route; migrate to /api/cron/provider-quality-audit"')
  })
})
