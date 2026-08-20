/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))
    const amountCents = Math.max(0, Number(body?.amountCents ?? 0))
    const reason = (body?.reason ?? '').toString().trim().slice(0, 500)
    const autoApprove = body?.autoApprove === true

    const { data, error } = await sb
      .from('refund_workflow_triggers')
      .insert({
        user_id: userId,
        reason: reason || null,
        amount_cents: amountCents || null,
        status: autoApprove ? 'processed' : 'queued',
        details: { source: 'ticket34', auto_approve: autoApprove },
        processed_at: autoApprove ? new Date().toISOString() : null,
      })
      .select('id, status')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create refund trigger' }, { status: 500 })
    return NextResponse.json({ ok: true, triggerId: data?.id, status: data?.status })
  } catch (error) {
    console.error('[billing.refund-workflow-triggers] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
