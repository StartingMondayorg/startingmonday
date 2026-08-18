import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const monthsParam = Number(url.searchParams.get('months') ?? '6')
  const months = Number.isFinite(monthsParam) ? Math.min(Math.max(monthsParam, 1), 24) : 6

  const supabase = await createClient()
  const typedSupabase = supabase as any
  const { data, error } = await typedSupabase
    .from('prep_outcome_monthly_rollups')
    .select('month_start, total_outcomes, advanced_count, offer_count, rejected_count, advance_rate_pct, offer_rate_pct')
    .eq('user_id', auth.userId)
    .order('month_start', { ascending: false })
    .limit(months)

  if (error) {
    return NextResponse.json({ error: 'Failed to load prep efficacy rollup' }, { status: 500 })
  }

  const rows = (data ?? []).map((row: any) => ({
    month_start: row.month_start,
    total_outcomes: row.total_outcomes ?? 0,
    advanced_count: row.advanced_count ?? 0,
    offer_count: row.offer_count ?? 0,
    rejected_count: row.rejected_count ?? 0,
    advance_rate_pct: row.advance_rate_pct ?? 0,
    offer_rate_pct: row.offer_rate_pct ?? 0,
  }))

  return NextResponse.json({ months: rows.length, rows })
}
