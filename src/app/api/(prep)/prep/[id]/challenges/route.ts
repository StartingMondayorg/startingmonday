import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { DOC_CHARS } from '@/lib/ai-limits'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { personaContext } from '@/lib/prompts'
import { assessPrepGrounding, prepGroundingNotice } from '@/lib/prep-grounding'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const DOC_LABEL_NAMES: Record<string, string> = {
  job_description: 'Job Description',
  news:            'News & Press',
  annual_report:   'Annual Report',
  org_notes:       'Org Notes',
  other:           'Other',
}

const SYSTEM =
  'You are a senior operating advisor who has worked inside companies and knows what the real problems look like from the inside. ' +
  'You identify the pain points companies face: the ones they announce, the ones they hide, and the ones they have not yet named. ' +
  'Your job is to help a candidate demonstrate genuine understanding of a company\'s actual situation, not its public narrative. ' +
  'No hedging. No em dashes. Specific and direct.'

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
  const [{ data: company }, { data: documents }, { data: signals }, { data: profile }] = await Promise.all([
    supabase.from('companies').select('name, sector, stage, notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('company_documents').select('label, content').eq('company_id', companyId).eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('company_signals').select('signal_type, signal_summary, signal_date').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since90d).order('signal_date', { ascending: false }).limit(8),
    supabase.from('user_profiles').select('search_persona').eq('user_id', userId).single(),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Pain Points to Address\n\n**1. Execution gaps at scale**\nThey have the strategy but the operational infrastructure has not kept pace. Teams are stretched, processes are informal, and things fall through. A candidate who can build systems and create repeatability without adding bureaucracy has immediate value.\n\n**2. Leadership depth below the C-suite**\nThe executive team is strong but there is a thin bench of leaders who can drive initiatives independently. Whoever they hire needs to develop people, not just direct them.\n\n**3. Customer expansion underperforming acquisition**\nNew logo growth is healthy but net revenue retention tells a different story. Expansion revenue and customer success is where they need operational improvement. Understanding this and naming it directly will differentiate a serious candidate.\n\n## How to Demonstrate You Understand\nDo not wait for them to name these problems. Surface them as your framing: "One of the things I was curious to understand more about is how you are thinking about X." This positions you as someone who has thought about their actual situation, not just their job description.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(demo)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const grounding = assessPrepGrounding({
    hasCompanyNotes: Boolean(company.notes?.trim()),
    signalCount: signals?.length ?? 0,
    documentCount: documents?.length ?? 0,
  })

  const signalSection = (signals ?? []).length > 0
    ? '\n\nRECENT SIGNALS\n' + signals!.map(s => {
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

  const userPrompt = `Identify the real pain points and challenges facing ${company.name} right now.
${personaContext(profile?.search_persona)}
COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${signalSection}${docsSection}

---

Write the brief with these exact sections, using ## for each header:

## Pain Points to Address
Identify the 3-5 real challenges ${company.name} is navigating right now. Include the ones they announce publicly and the ones implied by their signals, hiring, and sector position. For each:
- State the problem directly and specifically
- Explain what is causing it or what makes it hard to solve
- Explain how a candidate who names this in the interview signals they understand the actual situation

Format each as:
**[Number]. [Pain point title]**
[3-4 sentences: what the problem is, root cause or context, and what it means for the interview]

## How to Demonstrate You Understand
3 specific coaching notes on how the candidate should surface these pain points in the conversation. How to frame observations without sounding critical. How to position their background as directly relevant to solving what the company is actually dealing with. Give specific language or framing they can adapt.

Tone: operating advisor voice. Honest. No filler. No em dashes.`

  const groundingInstruction = grounding.isGrounded
    ? ''
    : `

GROUNDING MODE
Evidence is below threshold for verified company-specific challenge claims.
- Use pattern language based on sector and stage dynamics.
- Do not present specific internal events as facts unless present in supplied notes, signals, or documents.
- Prefer "likely challenge" framing over definitive assertions.`

  const groundedUserPrompt = `${userPrompt}${groundingInstruction}`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: getModelForTier(tier),
          max_tokens: 1000,

          system: SYSTEM,
          messages: [{ role: 'user', content: groundedUserPrompt }],
        })
        if (!grounding.isGrounded) {
          controller.enqueue(encoder.encode(`${prepGroundingNotice()}\n\n`))
        }
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.close()
        trackApiUsage(supabase, userId, (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)).catch(err => Sentry.captureException(err, { extra: { route: 'prep-challenges', userId } }))
      } catch (err) {
        controller.enqueue(encoder.encode(`__ERROR__${err instanceof Error ? err.message : 'Unknown error'}`))
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
