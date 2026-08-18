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
  'You are a strategy advisor who has worked with boards and C-suite teams across Fortune 500 and high-growth companies. ' +
  'You read between the lines of what companies say and identify what they are actually focused on. ' +
  'You connect public signals, hiring patterns, and sector dynamics to surface what is driving decisions right now. ' +
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
    supabase.from('company_signals').select('signal_type, signal_summary, outreach_angle, signal_date').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since90d).order('signal_date', { ascending: false }).limit(8),
    supabase.from('user_profiles').select('search_persona').eq('user_id', userId).single(),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Strategic Priorities\n\n**1. Profitable growth over top-line expansion**\nThe macro environment has forced a reset. After years of grow-at-all-costs, leadership is focused on unit economics and sustainable ARR growth. This shows up in hiring: they want operators who have navigated a tightening, not just a ramp.\n\n**2. AI-enabling their core product**\nEvery company in this sector is under pressure to show an AI story to customers and investors. The question is not whether they are doing it but how fast and how substantively. Candidates who can accelerate this credibly have an advantage.\n\n**3. Enterprise go-to-market maturity**\nBased on their pipeline stage and signals, they are moving from mid-market to enterprise. This requires a different sales motion, a different implementation model, and leadership that has done it before.\n\n## How to Align Your Narrative\nConnect your story to priorities 1 and 3 explicitly. For priority 1, name a specific moment where you optimized for efficiency under constraint. For priority 3, name a time you built or scaled an enterprise motion. Do not make them infer the connection.`
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

  const userPrompt = `Identify the strategic priorities currently driving ${company.name}.
${personaContext(profile?.search_persona)}
COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${signalSection}${docsSection}

---

Write the brief with these exact sections, using ## for each header:

## Strategic Priorities
Identify the 3-5 strategic priorities that are actually driving decisions at ${company.name} right now. Not their stated mission. What they are actually doing and why. For each priority:
- State what it is in one direct sentence
- Cite the evidence: which signals, hiring patterns, news, or sector dynamics support this read
- What it means for what kind of leader they are looking to hire

Format each as:
**[Priority number]. [Priority title]**
[3-4 sentences: what it is, the evidence, and what it means for the hire]

## How to Align Your Narrative
2-3 specific, direct coaching notes on how the candidate should connect their story to these priorities in the interview. Name the exact connection, not the general principle. If there is a priority where the candidate's background is thin, name it directly and suggest how to address it.

Tone: strategy advisor voice. Evidence-based. No em dashes. No generic observations.`

  const groundingInstruction = grounding.isGrounded
    ? ''
    : `

GROUNDING MODE
Evidence is below threshold for verified company-specific strategic-priority claims.
- Use pattern language based on stage and sector patterns.
- Do not state internal strategic decisions as facts unless supported by supplied notes, signals, or documents.
- Label uncertainty directly.`

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
        trackApiUsage(supabase, userId, (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)).catch(err => Sentry.captureException(err, { extra: { route: 'prep-priorities', userId } }))
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
