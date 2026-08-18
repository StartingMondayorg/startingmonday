import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/require-auth')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/events')

import { POST } from '../route'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'

const mockRequireAuth = vi.mocked(requireAuth)
const mockCreateClient = vi.mocked(createClient)
const mockLogEvent = vi.mocked(logEvent)

function requestBody(body: unknown) {
  return new NextRequest('https://startingmonday.app/api/preferences/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeSupabase(error: { message: string } | null = null) {
  const eq = vi.fn().mockResolvedValue({ error })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, update, eq }
}

beforeEach(() => {
  vi.resetAllMocks()
  mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
  mockLogEvent.mockResolvedValue()
})

describe('POST /api/preferences/briefing', () => {
  it('returns auth response when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })
    const res = await POST(requestBody({ briefingFrequency: 'daily', briefingTime: '07:00' }))
    expect(res.status).toBe(401)
  })

  it('updates daily frequency with valid time', async () => {
    const supabase = makeSupabase(null)
    mockCreateClient.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(requestBody({ briefingFrequency: 'daily', briefingTime: '08:30' }))
    expect(res.status).toBe(200)
    expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    expect(supabase.update).toHaveBeenCalledWith({ briefing_frequency: 'daily', briefing_time: '08:30' })
    expect(mockLogEvent).toHaveBeenCalledWith('user-1', 'briefing_configured', {
      briefing_frequency: 'daily',
      briefing_time: '08:30',
    })
  })

  it('updates weekly frequency without briefing_time', async () => {
    const supabase = makeSupabase(null)
    mockCreateClient.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(requestBody({ briefingFrequency: 'weekly', briefingTime: '09:00' }))
    expect(res.status).toBe(200)
    expect(supabase.update).toHaveBeenCalledWith({ briefing_frequency: 'weekly' })
    expect(mockLogEvent).toHaveBeenCalledWith('user-1', 'briefing_configured', {
      briefing_frequency: 'weekly',
      briefing_time: null,
    })
  })

  it('returns 400 when daily mode has invalid time', async () => {
    const supabase = makeSupabase(null)
    mockCreateClient.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(requestBody({ briefingFrequency: 'daily', briefingTime: '25:99' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid briefing time for daily mode')
  })

  it('returns 400 when daily mode has missing time', async () => {
    const supabase = makeSupabase(null)
    mockCreateClient.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(requestBody({ briefingFrequency: 'daily' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid briefing time for daily mode')
  })

  it('returns 500 when persistence fails', async () => {
    const supabase = makeSupabase({ message: 'db failure' })
    mockCreateClient.mockResolvedValue(supabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await POST(requestBody({ briefingFrequency: 'daily', briefingTime: '07:00' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('db failure')
  })
})
