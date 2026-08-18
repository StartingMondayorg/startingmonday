/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

const ALLOWED_PLANS = new Set(['free', 'passive', 'active', 'executive'])

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))

    const toPlan = (body?.toPlan ?? '').toString().trim().toLowerCase()
    const reason = (body?.reason ?? '').toString().trim().slice(0, 500)
    const approveNow = body?.approveNow === true

    if (!ALLOWED_PLANS.has(toPlan)) {
      return NextResponse.json({ error: 'Invalid toPlan' }, { status: 400 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle()

    const fromPlan = (userRow?.subscription_tier ?? 'free').toString()

    const { data: reqRow, error } = await sb
      .from('plan_change_requests')
      .insert({
        user_id: userId,
        from_plan: fromPlan,
        to_plan: toPlan,
        reason: reason || null,
        status: approveNow ? 'approved' : 'requested',
        processed_at: approveNow ? new Date().toISOString() : null,
      })
      .select('id, status')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create plan change request' }, { status: 500 })

    if (approveNow) {
      await supabase
        .from('users')
        .update({ subscription_tier: toPlan })
        .eq('id', userId)

      await sb
        .from('plan_change_requests')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', reqRow.id)
        .eq('user_id', userId)
    }

    return NextResponse.json({ ok: true, requestId: reqRow?.id, fromPlan, toPlan, status: approveNow ? 'completed' : reqRow?.status })
  } catch (error) {
    console.error('[billing.plan-changes] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
