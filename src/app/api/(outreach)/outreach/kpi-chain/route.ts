import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { computeOutreachKPIChain } from '@/lib/outreach/kpi-chain'

function asNumber(value: string | null, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const windowDaysRaw = asNumber(request.nextUrl.searchParams.get('windowDays'), 30)
  const windowDays = Math.min(Math.max(Math.trunc(windowDaysRaw), 7), 180)

  const sinceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  const sinceIso = sinceDate.toISOString()

  const supabase = await createClient()
  const result = await computeOutreachKPIChain({
    supabase,
    userId,
    windowDays,
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'Failed to load KPI chain metrics.',
        details: {
          kpi_chain: result.error,
        },
      },
      { status: 500 }
    )
  }

  return NextResponse.json(result.payload)
}
