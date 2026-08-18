import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { personaContext } from '@/lib/prompts'
import { assessPrepGrounding, prepGroundingNotice } from '@/lib/prep-grounding'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const SYSTEM =
  'You are a senior executive recruiter who has placed C-suite leaders across every major industry. ' +
  'You know who runs these companies, what their backgrounds are, and what they care about in a hire. ' +
  'When you know specific names, use them. When you are uncertain, say so and give what you do know about typical leadership profiles in this sector. ' +
  'No hedging. No em dashes. Every sentence earns its place.'

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
  const [{ data: company }, { data: contacts }, { data: signals }, { data: profile }] = await Promise.all([
    supabase.from('companies').select('name, sector, stage, notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('contacts').select('name, title, firm, channel, notes').eq('company_id', companyId).eq('user_id', userId).eq('status', 'active'),
    supabase.from('company_signals').select('signal_type, signal_summary, signal_date').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since90d).order('signal_date', { ascending: false }).limit(5),
    supabase.from('user_profiles').select('search_persona').eq('user_id', userId).single(),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Leadership Team\n\n**Chief Executive Officer**\nTypically a founder or operator background in this sector. Cares about execution velocity, capital efficiency, and whether you have dealt with ambiguity at scale. In interviews they probe for judgment calls under pressure, not process.\n\n**Chief People Officer / CHRO**\nLikely your primary contact during the process. Focused on cultural fit, retention risk, and whether you have built teams before or just managed them. Have a clear answer for how you develop people who are already good.\n\n**Your Hiring Manager**\nWants to know if you will make their life easier or harder. The question underneath every question is: can I trust this person to run independently? Give them evidence of that early.\n\n## Known Contacts\nNo contacts on file. Add anyone you know at this company to your contacts list to get specific coaching on how to use those relationships in the interview process.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(demo)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const grounding = assessPrepGrounding({
    hasCompanyNotes: Boolean(company.notes?.trim()),
    signalCount: signals?.length ?? 0,
    documentCount: 0,
    contactCount: contacts?.length ?? 0,
  })

  const knownContacts = (contacts ?? []).length > 0
    ? '\n\nKNOWN CONTACTS AT THIS COMPANY\n' + contacts!.map(c => {
        const parts = [c.title, c.firm].filter(Boolean).join(' at ')
        return `- ${c.name}${parts ? `, ${parts}` : ''}${c.channel ? ` (via ${c.channel})` : ''}${c.notes ? `: ${c.notes}` : ''}`
      }).join('\n')
    : ''

  const signalSection = (signals ?? []).length > 0
    ? '\n\nRECENT SIGNALS\n' + signals!.map(s => `- [${s.signal_type.toUpperCase()}] ${s.signal_summary}`).join('\n')
    : ''

  const userPrompt = `Generate a leadership team brief for an executive preparing to interview at ${company.name}.
${personaContext(profile?.search_persona)}
COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}${signalSection}${knownContacts}

---

Write the brief with these exact sections, using ## for each header:

## Leadership Team
For each key leader the candidate is likely to encounter in the process (CEO, direct hiring manager role, CHRO/CPO, any other relevant function heads): name them specifically if you know them, otherwise describe the profile typically found in this role at a company of this type. For each leader, state:
- Their name and title (or typical profile if unknown)
- What background they likely come from
- What they care most about in a hire at this level
- The one thing to do or say that will land with this person specifically

Format each person as:
**[Name or Role]** [title if different from header]
[3-4 sentences covering background, what they care about, and what wins with them]

## How to Work the Room
2-3 specific observations on how to navigate the group dynamics in this process. Who is the real decision-maker. What consensus or tension to expect between functions. How the candidate should position themselves differently depending on who they are talking to.

Tone: direct, senior-to-senior. Specific over general. No em dashes.`

  const groundingInstruction = grounding.isGrounded
    ? ''
    : `

GROUNDING MODE
Evidence is below threshold for verified company-specific leadership claims.
- Do not name specific people unless already present in KNOWN CONTACTS.
- Use pattern language: "companies at this stage typically..." and "leaders in this sector often...".
- Be explicit about uncertainty and avoid fabricated specificity.`

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
        trackApiUsage(supabase, userId, (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)).catch(err => Sentry.captureException(err, { extra: { route: 'prep-leadership', userId } }))
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
