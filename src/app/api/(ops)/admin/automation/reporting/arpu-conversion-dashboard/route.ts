/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

type PricingEvent = {
  partner_id: string
  lane: 'launch' | 'scale' | 'transform'
  billing_payload: { amount_usd?: number; included_seats?: number } | null
}

type MigrationEvent = {
  partner_id: string
  phase: 'scheduled' | 'in_flight' | 'completed' | 'exception'
}

function toArpu(amountUsd: number, seats: number): number {
  if (!seats) return 0
  return Number((amountUsd / seats).toFixed(2))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = Number(request.nextUrl.searchParams.get('lookback_days') ?? 60)
  const sinceIso = new Date(Date.now() - Math.max(30, Math.min(lookbackDays, 180)) * 24 * 60 * 60 * 1000).toISOString()

  const runsRes = await sb
    .from('trend_report_runs')
    .select('id,created_at,trend_payload')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(800)

  const rows = (runsRes.data ?? []) as Array<{ id: string; created_at: string; trend_payload: any }>
  const pricingEvents = rows
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-010')
    .map((row) => ({
      partner_id: String(row.trend_payload?.partner_id ?? 'unknown'),
      lane: String(row.trend_payload?.lane ?? 'launch') as PricingEvent['lane'],
      billing_payload: row.trend_payload?.billing_payload ?? null,
    })) as PricingEvent[]

  const migrationEvents = rows
    .filter((row) => row.trend_payload?.ticket === 'PB-Q2-011')
    .map((row) => ({
      partner_id: String(row.trend_payload?.partner_id ?? 'unknown'),
      phase: String(row.trend_payload?.phase ?? 'scheduled') as MigrationEvent['phase'],
    })) as MigrationEvent[]

  const arpuBySegment = ['launch', 'scale', 'transform'].map((lane) => {
    const scoped = pricingEvents.filter((event) => event.lane === lane)
    const arpuValues = scoped.map((event) => {
      const amount = Number(event.billing_payload?.amount_usd ?? 0)
      const seats = Number(event.billing_payload?.included_seats ?? 0)
      return toArpu(amount, seats)
    }).filter((value) => value > 0)

    const avgArpu = arpuValues.length > 0
      ? Number((arpuValues.reduce((sum, value) => sum + value, 0) / arpuValues.length).toFixed(2))
      : 0

    return {
      segment: lane,
      partner_count: new Set(scoped.map((event) => event.partner_id)).size,
      arpu_usd: avgArpu,
    }
  })

  const migrationByPartner = new Map<string, MigrationEvent['phase'][]>()
  for (const event of migrationEvents) {
    const current = migrationByPartner.get(event.partner_id) ?? []
    current.push(event.phase)
    migrationByPartner.set(event.partner_id, current)
  }

  const conversionRows = Array.from(migrationByPartner.entries()).map(([partner_id, phases]) => {
    const hasPilot = phases.includes('scheduled') || phases.includes('in_flight')
    const hasContract = phases.includes('completed')
    return {
      partner_id,
      pilot_entered: hasPilot,
      contract_converted: hasContract,
    }
  })

  const pilotCount = conversionRows.filter((row) => row.pilot_entered).length
  const contractCount = conversionRows.filter((row) => row.contract_converted).length
  const conversionRatePct = pilotCount > 0 ? Number(((contractCount / pilotCount) * 100).toFixed(2)) : 0

  const anomalies = arpuBySegment.filter((row) => row.arpu_usd <= 0).map((row) => ({
    type: 'arpu_missing',
    segment: row.segment,
    message: `No ARPU data for ${row.segment} segment`,
  }))

  const attributionDrift = conversionRows.filter((row) => row.contract_converted && !pricingEvents.some((event) => event.partner_id === row.partner_id)).map((row) => ({
    type: 'attribution_drift',
    partner_id: row.partner_id,
    message: 'Partner has conversion event without pricing attribution record',
  }))

  const guardrails = {
    anomalies,
    attribution_drift: attributionDrift,
    status: anomalies.length === 0 && attributionDrift.length === 0 ? 'ok' : 'investigate',
  }

  await sb.from('trend_report_runs').insert({
    user_id: auth.userId,
    trend_payload: {
      ticket: 'PB-Q2-012',
      generated_at: new Date().toISOString(),
      lookback_days: lookbackDays,
      arpu_by_segment: arpuBySegment,
      conversion_rate_pct: conversionRatePct,
      pilot_count: pilotCount,
      contract_count: contractCount,
      guardrails,
    },
  })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q2-012',
    lookback_days: lookbackDays,
    arpu_by_segment: arpuBySegment,
    pilot_to_contract_conversion: {
      pilot_count: pilotCount,
      contract_count: contractCount,
      conversion_rate_pct: conversionRatePct,
    },
    q2_readout: {
      arpu_uplift_trend: arpuBySegment,
      conversion_trend_pct: conversionRatePct,
    },
    guardrails,
  })
}
