import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/subscription'
import { checkBurstLimit } from '@/lib/burst-limit'
import { isRateLimited } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'
import { recordTrace, recordTraceError } from '@/lib/trace'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()

  const sub = await getUserSubscription(userId, supabase)
  if (!canAccessFeature(sub, 'salary_intelligence')) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  if (!(await checkBurstLimit(userId))) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }
  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly token limit reached.' }, { status: 429 })
  }

  let role: string, company: string, location: string, sector: string, level: string, company_stage: string
  try {
    const body = await request.json()
    role          = typeof body.role          === 'string' ? body.role.trim()          : ''
    company       = typeof body.company       === 'string' ? body.company.trim()       : ''
    location      = typeof body.location      === 'string' ? body.location.trim()      : ''
    sector        = typeof body.sector        === 'string' ? body.sector.trim()        : ''
    level         = typeof body.level         === 'string' ? body.level.trim()         : ''
    company_stage = typeof body.company_stage === 'string' ? body.company_stage.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!role || !company) {
    return NextResponse.json({ error: 'role and company are required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_title, positioning_summary, resume_text')
    .eq('user_id', userId)
    .single()

  const locationStr     = location      || 'United States'
  const sectorStr       = sector        ? `\nSector: ${sector}`                : ''
  const levelStr        = level         ? `\nLevel: ${level}`                  : ''
  const companyStageStr = company_stage ? `\nCompany stage: ${company_stage}`  : ''
  const backgroundStr   = profile?.positioning_summary
    ? `\nCandidate background: ${profile.positioning_summary.slice(0, 400)}`
    : profile?.current_title
    ? `\nCandidate current title: ${profile.current_title}`
    : ''

  const prompt = `You are a compensation expert advising a senior executive entering salary negotiations. Provide a specific, defensible compensation analysis broken down by component.

Role: ${role}
Company: ${company}
Location: ${locationStr}${sectorStr}${levelStr}${companyStageStr}${backgroundStr}

Return a JSON object with exactly this structure:
{
  "low": number (floor total cash comp in USD),
  "target": number (realistic target total cash comp in USD),
  "ceiling": number (stretch ceiling total cash comp in USD),
  "currency": "USD",
  "base": {
    "low": number,
    "target": number,
    "ceiling": number
  },
  "bonus": {
    "target_pct": number (target bonus as % of base, e.g. 30),
    "max_pct": number (max bonus as % of base, e.g. 50),
    "notes": "1 sentence on bonus structure at this company/stage"
  },
  "equity": {
    "range": "e.g. $800K–$1.5M RSUs over 4 years or 0.1%–0.25% options",
    "vesting": "e.g. 4-year with 1-year cliff",
    "notes": "1 sentence on equity norms at this stage/sector"
  },
  "levers": [
    "Specific negotiation lever 1 (e.g. signing bonus to offset unvested equity)",
    "Specific negotiation lever 2 (e.g. accelerated vesting on change of control)",
    "Specific negotiation lever 3 (e.g. performance bonus tied to defined milestones)"
  ],
  "notes": "2-3 sentences on what drives the range at this company specifically",
  "negotiation_script": "4-6 sentences. Exact language to use when they present the offer. Start with acknowledgment, move to anchor at ceiling, reference market data, ask for time.",
  "pushback_responses": [
    { "objection": "That is our standard band for this role", "response": "2-3 sentence counter" },
    { "objection": "We cannot go higher on base", "response": "2-3 sentence counter focused on total comp" },
    { "objection": "We need a decision by end of week", "response": "2-3 sentence counter on timeline" }
  ]
}

Use real market knowledge. Numbers should be specific, not rounded. Return only the JSON object.`

  const model = MODELS.sonnet
  const startMs = Date.now()

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const result = JSON.parse(jsonMatch[0])

    recordTrace({
      supabase, userId,
      feature: 'salary_intelligence',
      model,
      promptTokens: message.usage.input_tokens ?? 0,
      completionTokens: message.usage.output_tokens ?? 0,
      latencyMs: Date.now() - startMs,
      inputSnapshot: { role, company, location: locationStr, sector, level, company_stage },
      outputSnapshot: raw,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.status ?? err.statusCode
    const isCreditsError = status === 400 && err.error?.error?.message?.includes('credit')
    
    if (isCreditsError) {
      recordTraceError({ feature: 'salary_intelligence', userId, error: 'Anthropic API credits exhausted' })
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
    
    recordTraceError({ feature: 'salary_intelligence', userId, error: err instanceof Error ? err.message : String(err) })
    Sentry.captureException(err, { extra: { route: 'salary-intelligence', userId } })
    return NextResponse.json({ error: 'Failed to generate salary analysis' }, { status: 500 })
  }
}
