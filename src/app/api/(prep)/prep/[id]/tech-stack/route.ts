import { type NextRequest } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { DOC_CHARS } from '@/lib/ai-limits'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { personaContext } from '@/lib/prompts'
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
  'You are a senior technology executive who can read a job description or company profile and accurately infer the technology stack, systems, and tools a company is likely running. ' +
  'You draw on sector knowledge, hiring signals, and explicit mentions in job postings. ' +
  'You are honest about what is confirmed versus inferred. ' +
  'No hedging language. No em dashes. Specific and direct.'

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

  const [{ data: company }, { data: documents }, { data: profile }] = await Promise.all([
    supabase.from('companies').select('name, sector, stage, notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('company_documents').select('label, content').eq('company_id', companyId).eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('user_profiles').select('search_persona').eq('user_id', userId).single(),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Tech Stack\n\n**Confirmed (from job postings)**\nNo job description on file. Add a job description to the company's documents to get specific stack analysis.\n\n**Likely (by sector and company profile)**\nBased on the sector and typical company at this stage:\n- Cloud: AWS or Azure\n- CRM: Salesforce\n- HCM/HRIS: Workday or ADP\n- Finance: NetSuite or SAP\n- Collaboration: Microsoft 365 or Google Workspace\n- BI/Reporting: Tableau, PowerBI, or Looker\n\n## What to Know Before the Room\nIf you have no specific information, do not pretend you do. Ask: "I'd be curious to understand your current systems landscape. Where are the biggest integration gaps you're dealing with?" This is better than guessing and shows you know the right questions to ask.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(demo)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const docsSection = (documents ?? []).length > 0
    ? '\n\nDOCUMENTS\n' + documents!.map(d => {
        const labelName = DOC_LABEL_NAMES[d.label] ?? d.label
        const content = d.content.length > DOC_CHARS ? d.content.slice(0, DOC_CHARS) + '\n[truncated]' : d.content
        return `[${labelName}]\n${content}`
      }).join('\n\n')
    : ''

  const userPrompt = `Identify the likely technology stack and key systems at ${company.name}.
${personaContext(profile?.search_persona)}
COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${docsSection}

---

Write the brief with these exact sections, using ## for each header:

## Tech Stack

**Confirmed (from job postings or documents)**
List any technologies, platforms, tools, or systems explicitly mentioned in the job descriptions or other documents provided. If nothing is mentioned, say so clearly.

**Likely (by sector, size, and company profile)**
Based on what you know about companies at this stage in this sector, list the systems they are most likely running in each category: cloud infrastructure, CRM, HCM/HRIS, ERP/finance, data/BI, collaboration, and any domain-specific tools relevant to their sector. Be clear that these are inferred, not confirmed.

## What to Know Before the Room
2-3 specific coaching notes. If the candidate has experience with any likely systems, how to surface that naturally. If there are likely gaps, how to address them. The one question to ask in the interview that will tell the candidate the most about the systems environment they would be walking into.

Tone: technology executive voice. Distinguish clearly between confirmed and inferred. No em dashes.`

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
