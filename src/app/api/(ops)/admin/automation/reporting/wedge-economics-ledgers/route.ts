import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const MARKETING_MOTIONS = ['direct_paid_sprint', 'partner_pilot', 'other'] as const
const PARTNER_COMMERCIAL_EVENTS = ['pilot_fee_collected', 'expansion_proposal_sent', 'expansion_accepted', 'expansion_rejected'] as const

const marketingEntrySchema = z.object({
  ledger: z.literal('marketing_spend'),
  motion: z.enum(MARKETING_MOTIONS),
  channel: z.string().trim().optional(),
  amount_usd: z.number().finite().min(0),
  effective_at: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const partnerCommercialEntrySchema = z.object({
  ledger: z.literal('partner_commercial'),
  partner_id: z.string().uuid(),
  event_type: z.enum(PARTNER_COMMERCIAL_EVENTS),
  amount_usd: z.number().finite().min(0).nullable().optional(),
  effective_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const postSchema = z.object({
  entries: z.array(z.discriminatedUnion('ledger', [marketingEntrySchema, partnerCommercialEntrySchema])).min(1).max(500),
})

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '30', 10)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(raw, 120))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = parseLookbackDays(request)
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const [marketingResult, partnerCommercialResult] = await Promise.all([
    sb
      .from('marketing_spend_entries')
      .select('id, motion, channel, amount_usd, effective_at, notes, metadata, created_at')
      .gte('effective_at', sinceIso)
      .order('effective_at', { ascending: false })
      .limit(500),
    sb
      .from('partner_commercial_events')
      .select('id, partner_id, event_type, amount_usd, effective_at, metadata, created_at')
      .gte('effective_at', sinceIso)
      .order('effective_at', { ascending: false })
      .limit(500),
  ])

  const errors = [marketingResult.error?.message, partnerCommercialResult.error?.message].filter(
    (message): message is string => Boolean(message),
  )

  if (errors.length > 0) {
    Sentry.captureException(new Error('wedge-economics-ledgers load failed'), { extra: { route: 'admin/wedge-economics-ledgers', op: 'load', details: errors } })
    return NextResponse.json({ error: 'Failed to load wedge economics ledgers.', details: errors }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    lookback_days: lookbackDays,
    marketing_spend_entries: marketingResult.data ?? [],
    partner_commercial_events: partnerCommercialResult.data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, postSchema)
  if (!parsed.ok) return parsed.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const marketingRows = parsed.body.entries
    .filter((entry) => entry.ledger === 'marketing_spend')
    .map((entry) => ({
      motion: entry.motion,
      channel: entry.channel ?? null,
      amount_usd: Number(entry.amount_usd.toFixed(2)),
      effective_at: entry.effective_at ?? new Date().toISOString(),
      notes: entry.notes ?? null,
      metadata: entry.metadata ?? {},
    }))

  const partnerCommercialRows = parsed.body.entries
    .filter((entry) => entry.ledger === 'partner_commercial')
    .map((entry) => ({
      partner_id: entry.partner_id,
      event_type: entry.event_type,
      amount_usd: entry.amount_usd === undefined ? null : entry.amount_usd === null ? null : Number(entry.amount_usd.toFixed(2)),
      effective_at: entry.effective_at ?? new Date().toISOString(),
      metadata: entry.metadata ?? {},
    }))

  if (marketingRows.length > 0) {
    const insertResult = await sb.from('marketing_spend_entries').insert(marketingRows)
    if (insertResult.error) {
      Sentry.captureException(insertResult.error, { extra: { route: 'admin/wedge-economics-ledgers', op: 'insert-marketing' } })
      return NextResponse.json({ error: 'Failed to insert marketing spend entries.', details: [insertResult.error.message] }, { status: 500 })
    }
  }

  if (partnerCommercialRows.length > 0) {
    const insertResult = await sb.from('partner_commercial_events').insert(partnerCommercialRows)
    if (insertResult.error) {
      Sentry.captureException(insertResult.error, { extra: { route: 'admin/wedge-economics-ledgers', op: 'insert-partner-commercial' } })
      return NextResponse.json({ error: 'Failed to insert partner commercial events.', details: [insertResult.error.message] }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: {
      marketing_spend_entries: marketingRows.length,
      partner_commercial_events: partnerCommercialRows.length,
    },
  })
}
