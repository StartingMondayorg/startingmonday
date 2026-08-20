import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  providerGet: vi.fn(),
  validateCronRequest: vi.fn(() => true),
  createAdminClient: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/app/api/(ops)/cron/provider-quality-audit/route', () => ({
  GET: state.providerGet,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/cron-auth', () => ({
  validateCronRequest: state.validateCronRequest,
}))

import { GET, runtime } from './route'

async function flushTelemetry(): Promise<void> {
  await Promise.resolve()
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exports a static nodejs runtime', () => {
    expect(runtime).toBe('nodejs')
  })

  it('delegates GET handling to provider-quality-audit route', async () => {
    const activeWindowStart = new Date(Date.now() - 3_600_000).toISOString()
    state.maybeSingle.mockResolvedValueOnce({
      data: {
        last_details: {
          hitCount: 2,
          windowHitCount: 2,
          lifetimeHitCount: 2,
          windowStartAt: activeWindowStart,
        },
      },
      error: null,
    })
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
    expect(upsertPayload.last_details.windowHitCount).toBe(3)
    expect(upsertPayload.last_details.lifetimeHitCount).toBe(3)
    expect(upsertPayload.last_details.hitCountWindowHours).toBe(24)
    expect(upsertPayload.last_details.windowStartAt).toBe(activeWindowStart)
    expect(upsertPayload.last_details.replacementRoute).toBe('/api/cron/provider-quality-audit')
  })

  it('resets rolling window while preserving lifetime count when window expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T12:00:00.000Z'))

    state.maybeSingle.mockResolvedValueOnce({
      data: {
        last_details: {
          hitCount: 9,
          windowHitCount: 9,
          lifetimeHitCount: 9,
          windowStartAt: '2026-08-10T10:00:00.000Z',
        },
      },
      error: null,
    })
    state.upsert.mockResolvedValueOnce({ data: null, error: null })
    state.providerGet.mockResolvedValueOnce(NextResponse.json({ ok: true }))

    const request = new NextRequest('https://startingmonday.app/api/cron/apollo-quality-audit')
    const result = await GET(request)

    expect(result.status).toBe(200)
    await flushTelemetry()

    const upsertPayload = state.upsert.mock.calls[0]?.[0]
    expect(upsertPayload.last_details.hitCount).toBe(1)
    expect(upsertPayload.last_details.windowHitCount).toBe(1)
    expect(upsertPayload.last_details.lifetimeHitCount).toBe(10)
    expect(upsertPayload.last_details.windowStartAt).toBe('2026-08-11T12:00:00.000Z')
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
