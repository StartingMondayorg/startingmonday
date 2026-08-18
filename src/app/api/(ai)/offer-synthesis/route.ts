import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/api-usage'
import { getUserSubscription, canAccessFeature } from '@/lib/subscription'
import { anthropic, MODELS } from '@/lib/anthropic'

type OfferInput = {
  name: string
  sector?: string | null
  offer_role_title?: string | null
  offer_base?: number | null
  offer_bonus_pct?: number | null
  offer_signing?: number | null
  offer_equity?: string | null
  offer_notes?: string | null
  offer_decision_factors?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatOffer(o: OfferInput, index: number): string {
  const lines: string[] = [`Offer ${index + 1}: ${o.name}${o.sector ? ` (${o.sector})` : ''}`]
  if (o.offer_role_title) lines.push(`  Role: ${o.offer_role_title}`)
  if (o.offer_base) {
    lines.push(`  Base: ${fmt(o.offer_base)}`)
    if (o.offer_bonus_pct) {
      const est = Math.round(o.offer_base * o.offer_bonus_pct / 100)
      lines.push(`  Bonus: ${o.offer_bonus_pct}% target (${fmt(est)})`)
      lines.push(`  Total cash: ${fmt(o.offer_base + est)}`)
    }
  }
  if (o.offer_signing) lines.push(`  Signing: ${fmt(o.offer_signing)}`)
  if (o.offer_equity) lines.push(`  Equity: ${o.offer_equity}`)
  if (o.offer_notes) lines.push(`  Offer notes: ${o.offer_notes}`)
  if (o.offer_decision_factors) lines.push(`  Decision factors: ${o.offer_decision_factors}`)
  return lines.join('\n')
}

function buildPrompt(offers: OfferInput[]): string {
  const offerBlock = offers.map((o, i) => formatOffer(o, i)).join('\n\n')

  if (offers.length === 1) {
    return `You are advising a senior executive who has received a job offer. Read the complete offer data below and provide a clear-eyed synthesis in 3-4 sentences.

OFFER
${offerBlock}

Write exactly 3-4 sentences:
- What this offer actually represents beyond the numbers - what it is really asking of them
- The key risk or tension they should be clear-eyed about before accepting
- The one question they should be able to answer clearly before deciding

Be specific to the data above. Do not summarize the numbers back to them. No hedging. Trusted advisor voice. No em dashes.`
  }

  return `You are advising a senior executive who has ${offers.length} offers in front of them. Read the complete offer data below and produce a clear-eyed synthesis in 4-6 sentences.

OFFERS
${offerBlock}

Write exactly 4-6 sentences:
- What is genuinely distinctive about each offer - one thing per offer, financial or otherwise, that makes it different from the others
- Where the real tension is - what values, priorities, or tradeoffs make this decision hard
- The one question they should be sitting with before deciding - not which pays more, but the question that, if they could answer it clearly, would resolve the tension

Do not pick a winner. Do not summarize the numbers back to them. Be specific to the actual data. No hedging. Trusted advisor voice. No em dashes.`
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()

  const sub = await getUserSubscription(auth.userId, supabase)
  if (!canAccessFeature(sub, 'prep_brief')) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  if (await isRateLimited(supabase, auth.userId)) {
    return NextResponse.json({ error: 'Monthly limit reached.' }, { status: 429 })
  }

  let offers: OfferInput[]
  try {
    const body = await request.json()
    if (!Array.isArray(body.offers) || body.offers.length === 0) {
      return NextResponse.json({ error: 'offers array required' }, { status: 400 })
    }
    offers = body.offers.slice(0, 10).map((o: OfferInput) => ({
      name:                   String(o.name ?? '').slice(0, 200),
      sector:                 o.sector    ? String(o.sector).slice(0, 100)    : null,
      offer_role_title:       o.offer_role_title    ? String(o.offer_role_title).slice(0, 200)    : null,
      offer_base:             typeof o.offer_base    === 'number' ? o.offer_base    : null,
      offer_bonus_pct:        typeof o.offer_bonus_pct === 'number' ? o.offer_bonus_pct : null,
      offer_signing:          typeof o.offer_signing  === 'number' ? o.offer_signing  : null,
      offer_equity:           o.offer_equity    ? String(o.offer_equity).slice(0, 300)    : null,
      offer_notes:            o.offer_notes     ? String(o.offer_notes).slice(0, 500)     : null,
      offer_decision_factors: o.offer_decision_factors ? String(o.offer_decision_factors).slice(0, 500) : null,
    }))
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: MODELS.sonnet,
      max_tokens: 400,
      messages: [{ role: 'user', content: buildPrompt(offers) }],
    })
    const synthesis = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ synthesis })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'offer_synthesis_error', error: msg }))
    return NextResponse.json({ error: 'Failed to generate synthesis' }, { status: 500 })
  }
}
