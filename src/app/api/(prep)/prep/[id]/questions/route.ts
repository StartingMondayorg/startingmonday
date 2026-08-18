import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { QUESTIONS_SYSTEM, roleTypeContext } from '@/lib/prompts'
import { DOC_CHARS } from '@/lib/ai-limits'
import { buildCareerHistorySection, buildStarStoriesSection } from '@/lib/prep-profile-context'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const DOC_LABEL_NAMES: Record<string, string> = {
  job_description: 'Job Description',
  news:            'News & Press',
  annual_report:   'Annual Report',
  org_notes:       'Org Notes',
  other:           'Other',
}

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
  const [{ data: company }, { data: profile }, { data: documents }, { data: signals }] = await Promise.all([
    supabase
      .from('companies')
      .select('name, sector, stage, notes')
      .eq('id', companyId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('full_name, current_title, current_company, target_titles, positioning_summary, resume_text, beyond_resume, role_type, career_history_json, star_stories')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('company_documents')
      .select('label, content')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_signals')
      .select('signal_type, signal_summary, signal_date')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .gte('signal_date', since90d)
      .order('signal_date', { ascending: false })
      .limit(5),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Likely Interview Questions\n\n**Tell me about a transformation you led that didn't go as planned. What did you do?**\nThis is the accountability probe. They want to see whether you take ownership or shift blame, and whether you learned something specific rather than vague. Lead with what went wrong and what your role in it was, then pivot to what you changed. The story needs a real consequence.\n\n**How do you build alignment across a leadership team that isn't bought in?**\nThey are testing whether you lead by authority or influence. The right answer centers on listening first and surfacing what's actually driving the resistance, not a communication plan. Use a specific example.\n\n**What's your read on where this company needs to go in the next 18 months?**\nThis is the homework test. If you can't say something specific and directional, you signal you haven't done the work. Reference what you know: their stage, their signals, their competitive position. Show a point of view.\n\n**Why are you leaving your current situation?**\nThey want to know if you are running from something or toward something. The answer must be forward-looking and specific to this company, not a critique of where you came from.\n\n**What does success look like in this role at 90 days?**\nThis is an invitation to show you have thought beyond the title. Name 2-3 specific things you would need to understand or accomplish to consider the first 90 days a success. Tie them to what you know about the company's situation.`
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(demo))
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const name = profile?.full_name ?? 'the candidate'

  const signalSection = (signals ?? []).length > 0
    ? '\n\nCOMPANY SIGNALS (recent)\n' + signals!.map(s => {
        const date = new Date(s.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        return `- [${s.signal_type.toUpperCase()}] ${date}: ${s.signal_summary}`
      }).join('\n')
    : ''

  const docsSection = (documents ?? []).length > 0
    ? '\n\nDOCUMENTS\n' + documents!.map(d => {
        const labelName = DOC_LABEL_NAMES[d.label] ?? d.label
        const content = d.content.length > DOC_CHARS ? d.content.slice(0, DOC_CHARS) + '\n[truncated]' : d.content
        return `[${labelName}]\n${content}`
      }).join('\n\n')
    : ''

  const userPrompt = `Generate likely interview questions for ${name}'s interview at ${company.name}.

CANDIDATE
Name: ${name}${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.current_company ? `\nCurrent/recent company: ${profile.current_company}` : ''}${roleTypeContext(profile?.role_type)}${profile?.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}${buildCareerHistorySection(profile)}${profile?.beyond_resume ? `\nBeyond the resume: ${profile.beyond_resume}` : ''}${buildStarStoriesSection(profile, 'For each question, identify which story below best answers it and reference it explicitly in the coaching note. Do not invent generic examples when a verified story fits.')}

COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel and notes: ${company.notes}` : ''}${signalSection}${docsSection}

---

Generate the 8-10 most likely questions the interviewers will ask in this specific conversation. These are not generic interview questions. They are questions driven by the actual situation: this company's current state, this candidate's background, the stage of the process, and what a smart interviewer would probe given all of the above.

Use this exact section header:

## Likely Interview Questions

For each question, format as:
**[The exact question the interviewer will ask]**
[2-3 sentences: WHY they will ask this specific question in this context, and the coaching note: what to lean into, what to avoid, what wins the room]

Focus on questions that reveal real risk or opportunity for this candidate at this company. Include questions that probe the candidate's specific background gaps, questions triggered by the company's recent signals, and questions that test whether they are a strategic peer or just an applicant. Skip "Tell me about yourself." That is not where the decision gets made.

Tone: direct coaching voice. Talk to the candidate directly in the coaching notes. No em dashes. No hedging.`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: getModelForTier(tier),
          max_tokens: 1500,

          system: QUESTIONS_SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.close()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(err => Sentry.captureException(err, { extra: { route: 'prep-questions', userId } }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`__ERROR__${msg}`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
