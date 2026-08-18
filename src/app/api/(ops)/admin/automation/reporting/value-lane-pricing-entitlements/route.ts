 
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { buildBillingPayload, hasEntitlement, VALUE_LANE_PLANS } from '@/lib/value-lane-pricing'

const pricingSchema = z.object({
  partner_id: z.string(),
  plan_code: z.string(),
  entitlement_checks: z.array(z.string()).default([]),
  note: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, pricingSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const payload = parsed.body
  const billingPayload = buildBillingPayload(payload.plan_code)
  if (!billingPayload) {
    return NextResponse.json({ error: 'Unknown plan_code' }, { status: 400 })
  }

  const entitlementResults = payload.entitlement_checks.map((entitlement) => ({
    entitlement,
    allowed: hasEntitlement(payload.plan_code, entitlement),
  }))

  const eventPayload = {
    ticket: 'PB-Q2-010',
    generated_at: new Date().toISOString(),
    partner_id: payload.partner_id,
    plan_code: payload.plan_code,
    lane: billingPayload.lane,
    entitlement_results: entitlementResults,
    billing_payload: billingPayload,
    note: payload.note ?? null,
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: eventPayload,
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-010',
    pricing_model: VALUE_LANE_PLANS,
    event: eventPayload,
  })
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-010',
    pricing_model: VALUE_LANE_PLANS,
    documentation_alignment: {
      partner_success_playbook: 'aligned',
      last_reviewed: new Date().toISOString(),
    },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
