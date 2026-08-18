import { type NextRequest } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { personaContext } from '@/lib/prompts'
import { buildCareerHistorySection, buildStarStoriesSection } from '@/lib/prep-profile-context'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const SYSTEM =
  'You are a senior executive coach preparing a candidate for a specific interview. ' +
  'Your job is to write a brief section that explicitly and concretely connects this candidate\'s career background to this specific company\'s known challenges. ' +
  'Be specific. Name actual prior roles, actual company names, actual transitions when known. ' +
  'Generic connections are worthless. If the connection is not concrete, do not make it. ' +
  'No em dashes. No filler. No motivational language. This is coaching, not cheerleading.'

const DEMO_OUTPUT = `## Your Background Match

**What this company is navigating**
- Mid-stage technology modernization with legacy infrastructure debt accumulated over 10+ years
- Board pressure to demonstrate digital ROI while managing operational risk during transition
- A CIO mandate that requires both technical credibility and business narrative. Rare combination.

**Where your background connects**
- You have run exactly this playbook before: taking an organization from fragmented systems to integrated platform, under board scrutiny, without disrupting operations
- Your background in both transformation delivery and executive communication is the specific profile they are hiring for. Not just a technologist, not just a strategist.
- The scale you have operated at matches what they need next, not what they have had

**The talking point to use in the room**
"I have done this specific kind of transition before. Not a pilot, not a roadmap. An actual implementation at scale under real constraints. What made it work was treating the business case and the technical case as one conversation, not two."

**Where to be honest**
If your sector background does not match theirs exactly, name it directly: "My experience is in [sector], not [their sector], but the infrastructure challenge is structurally identical and the stakeholder dynamic is the same." Naming the gap before they do is a strength move.`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const routeParams = PrepRouteParamsSchema.safeParse(await params)
  if (!routeParams.success) {
    return apiError(firstZodError(routeParams.error), 400)
  }

  const access = await requirePrepAccess(request)
  if (!access.ok) return access.response
  const { userId, tier, supabase } = access

  const { id: companyId } = routeParams.data

  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [{ data: company }, { data: profile }, { data: signals }] = await Promise.all([
    supabase.from('companies').select('name, sector, stage, notes, interview_notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('user_profiles').select('full_name, current_title, current_company, positioning_summary, beyond_resume, resume_text, search_persona, role_type, career_history_json, star_stories').eq('user_id', userId).single(),
    supabase.from('company_signals').select('signal_type, signal_summary, signal_date').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since90d).order('signal_date', { ascending: false }).limit(5),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(DEMO_OUTPUT)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const careerSection = buildCareerHistorySection(profile, 1500)

  const signalSection = (signals ?? []).length > 0
    ? '\n\nRECENT SIGNALS\n' + signals!.map(s => {
        const date = new Date(s.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        return `- [${s.signal_type.toUpperCase()}] ${date}: ${s.signal_summary}`
      }).join('\n')
    : ''

  const userPrompt = `Write a "Your Background Match" section for an executive preparing to interview at ${company.name}.

CANDIDATE
Name: ${profile?.full_name ?? 'the candidate'}${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.current_company ? `\nCurrent/recent company: ${profile.current_company}` : ''}${personaContext(profile?.search_persona)}${profile?.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}${profile?.beyond_resume ? `\nBeyond the resume: ${profile.beyond_resume}` : ''}${careerSection}${buildStarStoriesSection(profile, 'Use these stories as concrete evidence in "Where your background connects" where relevant. Reference actual situations and results from the stories, not generic claims.')}

COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nCompany notes / intel: ${company.notes}` : ''}${company.interview_notes ? `\nPost-interview notes: ${company.interview_notes}` : ''}${signalSection}

---

Write the brief with these exact sections using ## for the header:

## Your Background Match

**What this company is navigating**
3 bullet points. Name the specific challenges this company is facing based on the notes, signals, and sector context. Be concrete. If you do not have enough intel, say what the typical challenge is for a company at this stage in this sector.

**Where your background connects**
3 bullet points. Explicitly connect the candidate's specific prior experience to the company's specific challenges. Name actual prior roles, actual companies, actual results when known. Do not make general claims. If the connection is strong, name it directly. If it is a partial match, name the match and the gap.

**The talking point to use in the room**
One concrete sentence the candidate can say when asked about their fit. It must be specific, not generic. It should reference something real from their background.

**Where to be honest**
One or two sentences identifying any gap in the match (sector, scale, or function) and how to address it directly rather than hoping it goes unnoticed.

Tone: coaching voice, direct, concrete. No em dashes. No corporate filler.`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: getModelForTier(tier),
          max_tokens: 900,
          system: SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.close()
        trackApiUsage(supabase, userId, (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)).catch(() => {})
      } catch (err) {
        controller.enqueue(encoder.encode(`__ERROR__${err instanceof Error ? err.message : 'Unknown error'}`))
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
