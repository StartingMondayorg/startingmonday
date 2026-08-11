import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  providerGet: vi.fn(),
  createAdminClient: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/app/api/cron/provider-quality-audit/route', () => ({
  GET: state.providerGet,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

import { GET, runtime } from './route'

async function flushTelemetry(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('apollo-quality-audit compatibility route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.createAdminClient.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'monitoring_alert_state') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: state.maybeSingle,
              }),
            }),
            upsert: state.upsert,
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }))
  })

  it('exports a static nodejs runtime', () => {
    expect(runtime).toBe('nodejs')
  })

  it('delegates GET handling to provider-quality-audit route', async () => {
    state.maybeSingle.mockResolvedValueOnce({ data: { last_details: { hitCount: 2 } }, error: null })
    state.upsert.mockResolvedValueOnce({ data: null, error: null })
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

    await flushTelemetry()
    expect(state.upsert).toHaveBeenCalledTimes(1)

    const upsertPayload = state.upsert.mock.calls[0]?.[0]
    expect(upsertPayload.alert_key).toBe('apollo-quality-audit-compat-hit')
    expect(upsertPayload.last_status).toBe('deprecated-route-hit')
    expect(upsertPayload.last_details.hitCount).toBe(3)
    expect(upsertPayload.last_details.replacementRoute).toBe('/api/cron/provider-quality-audit')
  })

  it('continues to delegate when observability persistence fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    state.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db unavailable' } })
    const response = NextResponse.json({ ok: true, delegated: true })
    state.providerGet.mockResolvedValueOnce(response)

    const request = new NextRequest('https://startingmonday.app/api/cron/apollo-quality-audit')
    const result = await GET(request)
    const body = await result.json()

    expect(result.status).toBe(200)
    expect(body).toEqual({ ok: true, delegated: true })

    await flushTelemetry()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[cron.apollo-quality-audit] compat hit observability write failed',
      expect.any(Error),
    )
    consoleErrorSpy.mockRestore()
  })
})
