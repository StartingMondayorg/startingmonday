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
  'You are a senior executive coach who helps leaders articulate why a specific opportunity genuinely matters to them. ' +
  'Generic answers kill candidacies. Your job is to build a statement that is specific, credible, and personal. ' +
  'It must sound like this person, not like a cover letter. ' +
  'No hedging. No em dashes. No motivational language. Direct and human.'

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
    supabase.from('companies').select('name, sector, stage, notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('user_profiles').select('full_name, current_title, current_company, target_titles, target_sectors, positioning_summary, beyond_resume, search_persona, resume_text, career_history_json, star_stories').eq('user_id', userId).single(),
    supabase.from('company_signals').select('signal_type, signal_summary, signal_date').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since90d).order('signal_date', { ascending: false }).limit(5),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Why Here\n\n**The Statement (adapt this verbatim)**\n"I have spent the last several years in transformation work, and what I have noticed is that the companies that actually get through it are the ones with a very specific combination: a leadership team that is honest about what is broken, a market position worth protecting, and enough operational foundation to build on. What drew me to this conversation is that you have all three. The work here is not theoretical. It is the kind of problem I know how to solve, and it is the right moment in my career to do it at this scale."\n\n**Why This Works**\nIt names what they have without flattering them. It connects the candidate's experience to their specific situation. It positions this as a deliberate choice, not a search for any landing spot.\n\n**Personalize It**\nReplace "transformation work" with your specific background thread. Add one concrete observation from your research that shows you have actually looked at their situation. Keep it under 60 seconds spoken.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(demo)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const signalSection = (signals ?? []).length > 0
    ? '\n\nRECENT SIGNALS (use these as specific hooks)\n' + signals!.map(s => {
        const date = new Date(s.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        return `- [${s.signal_type.toUpperCase()}] ${date}: ${s.signal_summary}`
      }).join('\n')
    : ''

  const targetTitles = (profile?.target_titles ?? []).join(', ')
  const targetSectors = (profile?.target_sectors ?? []).join(', ')

  const userPrompt = `Build a "why I want to work here" statement for an executive interviewing at ${company.name}.

CANDIDATE
Name: ${profile?.full_name ?? 'the candidate'}${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.current_company ? `\nCurrent/recent company: ${profile.current_company}` : ''}${personaContext(profile?.search_persona)}
Target roles: ${targetTitles || 'Not specified'}
Target sectors: ${targetSectors || 'Not specified'}${profile?.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}${buildCareerHistorySection(profile, 1500)}${profile?.beyond_resume ? `\nBeyond the resume: ${profile.beyond_resume}` : ''}${buildStarStoriesSection(profile, 'Choose the single strongest story as the personal thread for the statement. Weave it in as lived experience, not as a listed example.')}

COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${signalSection}

---

Write the brief with these exact sections, using ## for each header:

## Why Here

**The Statement (adapt this verbatim)**
Write a 3-5 sentence spoken statement the candidate can deliver when asked "Why us?" or "Why this role?" It should:
- Open with something specific about this company, not a generic compliment
- Connect to a thread in the candidate's actual background and what they are trying to do next
- Reference at least one concrete signal or observation that shows they have done real homework
- Close with a forward-looking statement about what they are looking to build or solve
- Sound like a person talking, not a cover letter. Use plain language.

**Why This Works**
2-3 sentences explaining which elements of the statement are doing the most work and why they will land.

**Personalize It**
1-2 specific notes on what the candidate should adapt based on their own background before they use this in the room.

Tone: coaching voice, direct, human. No em dashes. No corporate language. No motivational filler.`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: getModelForTier(tier),
          max_tokens: 800,

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
