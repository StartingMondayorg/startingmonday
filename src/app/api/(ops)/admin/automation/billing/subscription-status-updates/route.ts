/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

const ALLOWED_STATUS = new Set(['active', 'trialing', 'past_due', 'canceled', 'inactive'])

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))

    const nextStatus = (body?.status ?? '').toString().trim().toLowerCase()
    const nextTier = (body?.tier ?? '').toString().trim().toLowerCase() || null
    if (!ALLOWED_STATUS.has(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier')
      .eq('id', userId)
      .maybeSingle()

    const previousStatus = userRow?.subscription_status ?? null
    const previousTier = userRow?.subscription_tier ?? null

    await supabase
      .from('users')
      .update({ subscription_status: nextStatus, ...(nextTier ? { subscription_tier: nextTier } : {}) })
      .eq('id', userId)

    await sb.from('subscription_status_update_logs').insert({
      user_id: userId,
      previous_status: previousStatus,
      new_status: nextStatus,
      previous_tier: previousTier,
      new_tier: nextTier,
      details: { source: 'ticket35' },
    })

    return NextResponse.json({ ok: true, previousStatus, nextStatus, previousTier, nextTier })
  } catch (error) {
    console.error('[billing.subscription-status-updates] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
