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

    expect(state.providerGet).toHaveBeenCalledTimes(1)
    expect(state.providerGet).toHaveBeenCalledWith(request)
    expect(result).toBe(response)
  })
})
