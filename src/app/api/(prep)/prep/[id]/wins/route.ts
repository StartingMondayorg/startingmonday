import { type NextRequest } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { trackApiUsage } from '@/lib/api-usage'
import { isDemoUser } from '@/lib/demo'
import { anthropic, getModelForTier } from '@/lib/anthropic'
import { personaContext } from '@/lib/prompts'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const SYSTEM =
  'You are a senior executive coach who helps candidates demonstrate they have done real homework on a company. ' +
  'You identify recent wins worth acknowledging in an interview: new customers, partnerships, product launches, awards, expansions, and leadership moves. ' +
  'You also coach the candidate on exactly how to reference each win naturally in conversation without sounding like they Googled the company the night before. ' +
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

  const since180d = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const [{ data: company }, { data: signals }, { data: profile }] = await Promise.all([
    supabase.from('companies').select('name, sector, stage, notes').eq('id', companyId).eq('user_id', userId).single(),
    supabase.from('company_signals').select('signal_type, signal_summary, outreach_angle, signal_date, source_url').eq('company_id', companyId).eq('user_id', userId).gte('signal_date', since180d).order('signal_date', { ascending: false }).limit(12),
    supabase.from('user_profiles').select('search_persona').eq('user_id', userId).single(),
  ])

  if (!company) return apiError('Not found', 404)

  if (isDemoUser(userId)) {
    const encoder = new TextEncoder()
    const demo = `## Recent Wins\n\n**Strategic Partnership Announced**\nThey announced a major partnership that extends their distribution into a new channel. This is worth referencing as evidence of market momentum, but frame it as a question: "I saw the partnership announcement. What has the early response been like from your existing customer base?"\n\n**Product Launch**\nA new product or feature line launched recently. If you can get specific about what problem it solves, you signal you actually read about it rather than just noting it existed.\n\n**Leadership Addition**\nA key senior hire was announced. This signals where the company is investing. Understanding what gap that hire fills tells you something about where the gaps still are.\n\n## How to Reference Wins in the Room\nDo not list what you know. Ask about it. "I noticed X. What has the impact been?" positions you as someone who did homework and is genuinely curious. Listing facts you researched sounds like a student presentation. Questions sound like a peer conversation.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(demo)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  if (!(signals ?? []).length) {
    const encoder = new TextEncoder()
    const msg = `## Recent Wins\n\nNo signals on file yet for ${company.name}. Once the signal job has run, recent news, launches, and announcements will appear here.\n\nIn the meantime: search for "${company.name}" on Google News and LinkedIn before the interview, and look specifically for announcements in the last 90 days. Add anything significant as a note on the company page.`
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(msg)); c.close() } })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const signalList = signals!.map(s => {
    const date = new Date(s.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    return `- [${s.signal_type.toUpperCase()}] ${date}: ${s.signal_summary}${s.outreach_angle ? `\n  Outreach angle: ${s.outreach_angle}` : ''}`
  }).join('\n')

  const userPrompt = `Identify recent wins and positive developments at ${company.name} that an executive candidate should reference in their interview.
${personaContext(profile?.search_persona)}
COMPANY
Name: ${company.name}${company.sector ? `\nSector: ${company.sector}` : ''}
Pipeline stage: ${company.stage}${company.notes ? `\nIntel / notes: ${company.notes}` : ''}

SIGNALS (last 6 months)
${signalList}

---

Write the brief with these exact sections, using ## for each header:

## Recent Wins
From the signals above, identify the 3-5 most interview-relevant wins: new customers, partnerships, product launches, awards, expansions, leadership moves, or strategic announcements. For each:
- State what happened and when
- Explain why it matters to the company's trajectory
- Give the candidate specific language or a question they can use to reference it naturally in conversation

Format each as:
**[Win title]** ([approximate date])
[3-4 sentences: what it is, why it matters, how to reference it in the room]

## How to Reference Wins in the Room
2-3 coaching notes on the right way to surface these wins in an interview. The distinction between sounding like you did homework versus sounding like you read a briefing document. How to turn each win into a genuine question that opens a conversation.

Tone: coach voice. Specific. No em dashes. No filler.`

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
