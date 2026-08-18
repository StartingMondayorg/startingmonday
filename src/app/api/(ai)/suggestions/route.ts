import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/subscription'
import { checkBurstLimit } from '@/lib/burst-limit'
import { isRateLimited } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'
import { recordTrace, recordTraceError } from '@/lib/trace'

type Recruiter = { name: string; focus: string }
type SuggestionsResult = { companies: string[]; recruiters: Recruiter[] }

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const supabase = await createClient()

  const sub = await getUserSubscription(userId, supabase)
  if (!canAccessFeature(sub, 'scan')) {
    return NextResponse.json({ companies: [], recruiters: [] })
  }

  if (!(await checkBurstLimit(userId))) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }
  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly token limit reached.' }, { status: 429 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_title, current_company, target_titles, target_sectors, target_locations, positioning_summary')
    .eq('user_id', userId)
    .single()

  if (!profile?.current_title && !profile?.target_titles?.length) {
    return NextResponse.json({ companies: [], recruiters: [] })
  }

  const targetTitles   = (profile.target_titles ?? []).join(', ') || 'Not specified'
  const targetSectors  = (profile.target_sectors ?? []).join(', ') || 'Not specified'
  const targetLocations = (profile.target_locations ?? []).join(', ') || 'Not specified'

  const prompt = `You are helping a senior professional build their job search pipeline. Based on their profile, suggest target companies and executive search firms.

PROFILE
Current/recent title: ${profile.current_title ?? 'Not specified'}
Current/recent company: ${profile.current_company ?? 'Not specified'}
Target roles: ${targetTitles}
Target sectors: ${targetSectors}
Target locations: ${targetLocations}${profile.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}

Return a JSON object with exactly this shape:
{
  "companies": [array of 6 company names: real organizations this person should have in their pipeline, similar to their background and target, varied in size and type, not obvious giants],
  "recruiters": [array of 5 objects: { "name": "firm name", "focus": "one phrase: what they specialize in" }]
}

For companies: pick organizations where someone at this level would be a plausible hire. Mix well-known and under-the-radar. No Fortune 50 logos just for brand recognition.
For recruiters: name actual executive search firms known for this function/sector. Include at least one boutique that specializes in this space.

Return only the JSON object. No explanation. No markdown fences.`

  try {
    const model = MODELS.sonnet
    const startMs = Date.now()
    const message = await anthropic.messages.create({
      model,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const parsed: SuggestionsResult = JSON.parse(raw)

    recordTrace({
      supabase, userId,
      feature: 'suggestions',
      model,
      promptTokens: message.usage.input_tokens ?? 0,
      completionTokens: message.usage.output_tokens ?? 0,
      latencyMs: Date.now() - startMs,
      inputSnapshot: {
        current_title: profile.current_title,
        target_count: (profile.target_titles ?? []).length,
      },
      outputSnapshot: raw,
    })

    return NextResponse.json({
      companies: Array.isArray(parsed.companies) ? parsed.companies.slice(0, 8) : [],
      recruiters: Array.isArray(parsed.recruiters) ? parsed.recruiters.slice(0, 6) : [],
    })
  } catch (err: any) {
    const status = err.status ?? err.statusCode
    const isCreditsError = status === 400 && err.error?.error?.message?.includes('credit')
    
    if (isCreditsError) {
      recordTraceError({ feature: 'suggestions', userId, error: 'Anthropic API credits exhausted' })
      return NextResponse.json({ companies: [], recruiters: [], error: 'Service temporarily unavailable' }, { status: 503 })
    }
    
    recordTraceError({ feature: 'suggestions', userId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ companies: [], recruiters: [] })
  }
}
