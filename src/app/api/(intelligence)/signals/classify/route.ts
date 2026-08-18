import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited } from '@/lib/api-usage'
import { getUserSubscription, canAccessFeature } from '@/lib/subscription'
import { SignalsClassifyBodySchema, firstZodError } from '@/lib/schemas'
import { anthropic, MODELS } from '@/lib/anthropic'
import { captureServerEvent } from '@/lib/posthog-server'
import {
  computePersonaRelevance,
  computeSignalConfidence,
  enrichSignalProfileContext,
} from '@/lib/intelligence-quality'

const SIGNAL_TYPES = ['funding', 'exec_departure', 'exec_hire', 'acquisition', 'expansion', 'layoffs', 'ipo', 'new_product', 'award']

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth

  const supabase = await createClient()

  const sub = await getUserSubscription(userId, supabase)
  if (!canAccessFeature(sub, 'scan')) {
    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 })
  }

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly limit reached.' }, { status: 429 })
  }

  const bodyParsed = SignalsClassifyBodySchema.safeParse(raw)
  if (!bodyParsed.success) {
    return NextResponse.json({ error: firstZodError(bodyParsed.error) }, { status: 400 })
  }
  const { companyId, text, sourceUrl } = bodyParsed.data
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .eq('user_id', userId)
    .single()

  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role_type, search_persona, role_family, role_title')
    .eq('user_id', userId)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are classifying a piece of news about ${company.name} for an executive job seeker tracking this company.

NEWS TEXT:
${text.slice(0, 3000)}

Extract the following as valid JSON with no markdown fences:
{
  "signal_type": one of: funding | exec_departure | exec_hire | acquisition | expansion | layoffs | ipo | new_product | award,
  "signal_summary": "1-2 sentence factual summary of what happened. Be specific and concrete.",
  "outreach_angle": "1 sentence on how this is a conversation-opener for someone who wants to work there, or null if the signal is not relevant to job seeking.",
  "signal_date": "YYYY-MM-DD (use ${today} if the date is unclear)"
}`

  let parsed: {
    signal_type: string
    signal_summary: string
    outreach_angle: string | null
    signal_date: string
  }

  try {
    const msg = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    parsed = JSON.parse(raw)
  } catch (err: any) {
    const status = err.status ?? err.statusCode
    const isCreditsError = status === 400 && err.error?.error?.message?.includes('credit')
    
    if (isCreditsError) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Classification failed. Try rephrasing the news.' }, { status: 500 })
  }

  if (!SIGNAL_TYPES.includes(parsed.signal_type)) {
    parsed.signal_type = 'other' in SIGNAL_TYPES ? 'other' : 'new_product'
  }

  const profileContext = enrichSignalProfileContext({
    roleType: profile?.role_type,
    searchPersona: profile?.search_persona,
    roleFamily: profile?.role_family,
    roleTitle: profile?.role_title,
  })

  const relevance = computePersonaRelevance(parsed.signal_type, {
    roleType: profile?.role_type,
    searchPersona: profile?.search_persona,
    roleFamily: profile?.role_family,
    roleTitle: profile?.role_title,
  })

  const confidence = computeSignalConfidence({
    signalType: parsed.signal_type,
    sourceKind: 'manual_news',
    hasSourceUrl: !!sourceUrl,
    evidenceCount: 1,
    signalDate: parsed.signal_date,
  })

  const { error } = await supabase.from('company_signals').insert({
    company_id: companyId,
    user_id: userId,
    signal_type: parsed.signal_type,
    signal_summary: parsed.signal_summary,
    outreach_angle: parsed.outreach_angle ?? null,
    signal_date: parsed.signal_date,
    source_url: sourceUrl ?? null,
    source_kind: 'manual_news',
    confidence,
    focus_tags: [parsed.signal_type],
    evidence_snippets: [text.slice(0, 280)],
    profile_channel: profileContext.profileChannel,
    profile_persona: profileContext.profilePersona,
    relevance_score: relevance,
  })

  if (error) return NextResponse.json({ error: 'Failed to save signal.' }, { status: 500 })

  captureServerEvent(userId, 'signal_classified', { company_id: companyId, signal_type: parsed.signal_type })

  return NextResponse.json({ ok: true, signal: parsed })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
