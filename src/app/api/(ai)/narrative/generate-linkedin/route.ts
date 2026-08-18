import { type NextRequest, NextResponse } from 'next/server'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { anthropic, MODELS } from '@/lib/anthropic'

const SYSTEM =
  'You are a senior executive coach who writes LinkedIn content that sounds like a real person, not a recruiter. ' +
  'No corporate jargon. No em dashes. No motivational language. No bullet lists in the About section. ' +
  'Headline must be under 220 characters. About must be 3-4 short paragraphs, plain prose. ' +
  'Output valid JSON only, no markdown fences.'

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'positioning_coach')
  if (!access.ok) return access.response
  const { userId } = access

  const body = await request.json().catch(() => ({}))
  const positioning  = (body.positioning_summary ?? '').toString().trim().slice(0, 3000)
  const targetTitles = ((body.target_titles ?? []) as string[]).slice(0, 10).map(t => String(t).slice(0, 100))
  const roleType     = (body.role_type ?? '').toString().trim().slice(0, 100)
  const currentTitle = (body.current_title ?? '').toString().trim().slice(0, 200)

  if (!positioning) {
    return NextResponse.json({ error: 'Add a positioning summary before generating LinkedIn content.' }, { status: 400 })
  }

  const prompt = `Write LinkedIn profile content for an executive based on their positioning summary.

Return a JSON object with two keys:

1. "headline": a LinkedIn headline under 220 characters. Format: [Role type] | [Core expertise] | [What they deliver]. Example: "CIO | Enterprise Digital Transformation | Building Technology Organizations That Ship". No hashtags. No buzzwords.

2. "about": a LinkedIn About section, 3-4 short paragraphs, plain prose. Structure:
   Paragraph 1: Who they are and what they do at the highest level. One or two sentences.
   Paragraph 2: What they are known for. The specific kind of work they do and why it matters.
   Paragraph 3: Where they are headed. The type of role and organization they are seeking.
   Paragraph 4 (optional): Brief note on how to reach them or what they are working on now.

CANDIDATE:
${currentTitle ? `Current/recent title: ${currentTitle}` : ''}
${targetTitles.length ? `Target titles: ${targetTitles.join(', ')}` : ''}
${roleType ? `Role type: ${roleType}` : ''}
Positioning: ${positioning}

Output a single JSON object. No preamble. No markdown.`

  let headline = ''
  let about = ''

  try {
    const msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_BRIEFING_MODEL ?? MODELS.haiku,
      max_tokens: 800,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { text: string }).text.trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)
    headline = (parsed.headline ?? '').toString()
    about    = (parsed.about    ?? '').toString()
  } catch {
    return NextResponse.json({ error: 'Generation failed. Try again.' }, { status: 500 })
  }

  // Persist to profile
  const admin = createAdminClient()
  await admin.from('user_profiles')
    .update({ linkedin_headline: headline, linkedin_about: about })
    .eq('user_id', userId)

  return NextResponse.json({ headline, about })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
