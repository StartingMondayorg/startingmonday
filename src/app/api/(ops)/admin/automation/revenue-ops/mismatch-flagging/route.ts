/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const { data: checks } = await sb
    .from('payment_reconciliation_checks')
    .select('id, status, mismatch_count, details, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const source = checks ?? []
  const openFlags = source
    .filter((row: { status: string }) => row.status === 'mismatch')
    .map((row: { mismatch_count: number; details: Record<string, unknown> }) => ({
      category: 'payment_reconciliation',
      severity: row.mismatch_count > 2 ? 'high' : 'medium',
      details: row.details,
    }))

  if (openFlags.length > 0) {
    await sb.from('revenue_mismatch_flags').insert(
      openFlags.map((flag: { category: string; severity: string; details: Record<string, unknown> }) => ({
        user_id: userId,
        category: flag.category,
        severity: flag.severity,
        details: flag.details,
        status: 'open',
      })),
    )
  }

  return NextResponse.json({ ok: true, created: openFlags.length, basedOnChecks: source.length })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
