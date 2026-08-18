import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()
  const { data } = await supabase
    .from('opportunity_radar')
    .select('company_name, reason, signal_type, confidence, generated_at')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(3)

  const radarRows = (data ?? []) as Array<{
    company_name: string | null
    reason: string | null
    signal_type: string | null
    confidence: number | null
    generated_at: string | null
  }>

  const hits = radarRows.map((row) => {
    const reason = (row.reason ?? '')
      .replace(/\bthe VP's\b/gi, 'your')
      .replace(/\bthe executive's\b/gi, 'your')
      .replace(/\bthe VP\b/gi, 'you')
      .replace(/\bthe executive\b/gi, 'you')

    return {
      ...row,
      reason,
    }
  })

  return NextResponse.json({ hits })
}
