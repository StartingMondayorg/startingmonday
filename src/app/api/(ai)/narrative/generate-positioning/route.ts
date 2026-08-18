import { type NextRequest, NextResponse } from 'next/server'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { anthropic, MODELS } from '@/lib/anthropic'

const SYSTEM =
  'You are a senior executive coach who writes precise, credible executive positioning statements. ' +
  'No corporate jargon. No motivational language. No em dashes. ' +
  'Every sentence must be specific to this person, not generic. ' +
  'Output valid JSON only, no markdown fences.'

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'positioning_coach')
  if (!access.ok) return access.response

  const body = await request.json().catch(() => ({}))
  const resumeText      = (body.resume_text      ?? '').toString().trim().slice(0, 15000)
  const beyondResume    = (body.beyond_resume     ?? '').toString().trim().slice(0, 3000)
  const targetTitles    = ((body.target_titles    ?? []) as string[]).slice(0, 10).map(t => String(t).slice(0, 100))
  const roleType        = (body.role_type         ?? '').toString().trim().slice(0, 100)
  const currentTitle    = (body.current_title     ?? '').toString().trim().slice(0, 200)
  const currentCompany  = (body.current_company   ?? '').toString().trim().slice(0, 200)

  if (!resumeText && !beyondResume && !currentTitle) {
    return NextResponse.json({ error: 'Add your resume or current title before generating.' }, { status: 400 })
  }

  const prompt = `Write a positioning summary for an executive job candidate. Return a JSON object with two keys:

1. "positioning": 2-3 sentences in this structure:
   Sentence 1: [Title] with [X years] of [core expertise] in [sector/industry context].
   Sentence 2: Known for [most differentiating thing they have done, specific, not generic].
   Sentence 3: Targeting [specific role types] at [specific company types or sectors].

2. "gaps": array of 1-4 short strings (max 12 words each) naming what is missing or weak that would make the positioning stronger. Examples:
   "No quantified outcome:add a dollar or percent impact"
   "Target is too broad:name the sector or company type"
   "Missing transformation scope:specify team or budget scale"
   "No differentiation:what makes this candidate unusual at this level"
   Only include gaps that actually apply. If the positioning is already strong, return an empty array.

CANDIDATE CONTEXT:
${currentTitle ? `Current/recent title: ${currentTitle}` : ''}
${currentCompany ? `Current/recent company: ${currentCompany}` : ''}
${targetTitles.length ? `Target titles: ${targetTitles.join(', ')}` : ''}
${roleType ? `Role type: ${roleType}` : ''}
${beyondResume ? `Context beyond the resume:\n${beyondResume}` : ''}
${resumeText ? `\nResume (use for specific achievements and career arc):\n${resumeText.slice(0, 6000)}` : ''}

Output a single JSON object. No preamble. No markdown.`

  try {
    const msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_BRIEFING_MODEL ?? MODELS.haiku,
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { text: string }).text.trim()
      .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)
    return NextResponse.json({
      positioning: (parsed.positioning ?? '').toString(),
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    })
  } catch {
    return NextResponse.json({ error: 'Generation failed. Try again.' }, { status: 500 })
  }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
