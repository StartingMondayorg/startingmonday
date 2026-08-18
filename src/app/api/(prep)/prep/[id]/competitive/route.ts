import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { COMPETITIVE_SYSTEM } from '@/lib/prompts'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { assessPrepGrounding, prepGroundingNotice } from '@/lib/prep-grounding'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

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
    supabase
      .from('companies')
      .select('name, sector, notes')
      .eq('id', companyId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('current_title, positioning_summary')
      .eq('user_id', userId)
      .single(),
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
    const demo = `## Market Position\n${company.name} is a mid-market player in the ${company.sector ?? 'technology'} space competing primarily on speed-to-value and vertical focus. Their primary buyers are mid-market operations leaders who need outcomes fast without enterprise procurement cycles. They have built market presence through a strong partner channel and word-of-mouth, but face pressure from better-funded competitors moving down-market.\n\n## Key Competitors\n\n**Competitor A** Two or three sentences on what they do, how they position against ${company.name}, and where they are gaining ground.\n\n**Competitor B** Two or three sentences on differentiation and current market trajectory.\n\n**Competitor C** Two or three sentences. Note where ${company.name} has structural advantage.\n\n## Candidate's Angle\nUse your awareness of this competitive dynamic to signal you have done the work. Ask which competitor they lose to most often and why. It tells you more about the company's self-image than any annual report. Frame your background as bringing a pattern-match from a space where these same dynamics played out, and name the outcome.`
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(demo))
        controller.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const grounding = assessPrepGrounding({
    hasCompanyNotes: Boolean(company.notes?.trim()),
    signalCount: signals?.length ?? 0,
    documentCount: 0,
  })

  const signalSection = (signals ?? []).length > 0
    ? '\n\nRECENT SIGNALS\n' + signals!.map(s => {
        const date = new Date(s.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        return `- [${s.signal_type.toUpperCase()}] ${date}: ${s.signal_summary}`
      }).join('\n')
    : ''

  const userPrompt = `Generate a competitive intelligence brief for an executive preparing to interview at ${company.name}.

COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${signalSection}

CANDIDATE CONTEXT${profile?.current_title ? `\nCurrent/recent title: ${profile.current_title}` : ''}${profile?.positioning_summary ? `\nPositioning: ${profile.positioning_summary}` : ''}

---

Write the brief with these exact sections, using ## for each header:

## Market Position
Where ${company.name} stands in its market. What they are known for, what differentiates them, what competitive pressures they face. 2-3 focused paragraphs. Be specific about who buys from them and why. Draw on your knowledge of the sector and company.

## Key Competitors
For each of the 3-5 most significant direct competitors: what they do, how they position against ${company.name}, and where they are gaining or losing ground. If the sector has well-known players, name them specifically. If you have uncertainty about a specific competitor, note it briefly. Format each as:
**[Competitor name]** [2-3 sentences: what they do, how they compare to ${company.name}, current trajectory]

## Candidate's Angle
How the candidate should use this competitive context in the interview. Specific questions to probe that signal competitive awareness. How to frame their background in relation to the competitive landscape. What an insider would know that an applicant would not. 2-3 specific, actionable observations.

Tone: direct, senior-to-senior. Short paragraphs. No em dashes. No hedging on what you actually know. Be honest if specific details about a private company are unavailable, but always provide what you can.`

  const groundingInstruction = grounding.isGrounded
    ? ''
    : `

GROUNDING MODE
Evidence is below threshold for verified company-specific competitive claims.
- Use pattern language and sector-level dynamics instead of naming unverified competitors.
- If you reference a specific competitor, it must be explicitly present in COMPANY notes, documents, or signals.
- Be explicit when details are unavailable.`

  const groundedUserPrompt = `${userPrompt}${groundingInstruction}`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: getModelForTier(tier),
          max_tokens: 1200,

          system: COMPETITIVE_SYSTEM,
          messages: [{ role: 'user', content: groundedUserPrompt }],
        })
        if (!grounding.isGrounded) {
          controller.enqueue(encoder.encode(`${prepGroundingNotice()}\n\n`))
        }
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.close()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(err => Sentry.captureException(err, { extra: { route: 'prep-competitive', userId } }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`__ERROR__${msg}`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-prep-grounding-mode': grounding.isGrounded ? 'grounded' : 'pattern',
      'x-prep-evidence-count': String(grounding.evidenceCount),
    },
  })
}
