import { type NextRequest, NextResponse } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { anthropic, MODELS } from '@/lib/anthropic'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTrace, recordTraceError } from '@/lib/trace'
import { encodeUserId } from '@/lib/watermark'
import { trackApiUsage } from '@/lib/api-usage'
import { apiError } from '@/lib/api-error'
import { PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'
import { getSearchIntake, intakeOptionLabel, TRANSITION_TYPE_OPTIONS, URGENCY_OPTIONS } from '@/lib/search-intake'

const STYLE_GUIDELINES = `- Maximum 3 sentences. Do not exceed this.
- Do not use em dashes anywhere
- Do not use phrases like "I hope this finds you well", "I wanted to reach out", "touch base", or "circle back"
- Sound like a real senior executive, not a template
- No greeting or sign-off. Just the message body.
- Be specific to this company. Generic outreach is noise.`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const routeParams = PrepRouteParamsSchema.safeParse(await params)
  if (!routeParams.success) {
    return apiError(firstZodError(routeParams.error), 400)
  }
  const { id: companyId } = routeParams.data

  const access = await requirePrepAccess(request)
  if (!access.ok) return access.response
  const { userId, supabase } = access

  // Fetch everything in parallel
  const [
    { data: company },
    { data: profile },
    { data: signals },
    { data: lastBrief },
    { data: contacts },
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('name, notes')
      .eq('id', companyId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_profiles')
      .select('full_name, positioning_summary, target_titles, role_type, role_context')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('company_signals')
      .select('signal_type, signal_summary, outreach_angle, signal_date')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .neq('signal_type', 'pattern_alert')
      .order('signal_date', { ascending: false })
      .limit(3),
    supabase
      .from('briefs')
      .select('output_text')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('type', 'prep')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('contacts')
      .select('name, title')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1),
  ])

  if (!company) {
    return apiError('Company not found', 404)
  }

  const contactName = contacts?.[0]?.name ?? null
  const contactTitle = contacts?.[0]?.title ?? null

  const signalLines = (signals ?? [])
    .map((s: { signal_type: string; signal_summary: string; outreach_angle: string | null }) =>
      `- ${s.signal_type.replace(/_/g, ' ')}: ${s.signal_summary}${s.outreach_angle ? ` (angle: ${s.outreach_angle})` : ''}`)
    .join('\n')

  const briefExcerpt = lastBrief?.output_text
    ? lastBrief.output_text.slice(0, 1200)
    : null

  const intake = getSearchIntake(profile?.role_context)
  const transitionType = intakeOptionLabel(TRANSITION_TYPE_OPTIONS, intake?.transition_type)
  const urgency = intakeOptionLabel(URGENCY_OPTIONS, intake?.urgency)

  const prompt = `You are drafting a 3-sentence outreach message from a senior executive to a target company.

SENDER:
${profile?.full_name ? `Name: ${profile.full_name}` : ''}
${profile?.positioning_summary ? `Background: ${profile.positioning_summary}` : ''}
${profile?.target_titles ? `Target roles: ${profile.target_titles}` : ''}
${transitionType ? `Transition type: ${transitionType} (match the message's discretion and tone to this)` : ''}
${urgency ? `Search timing: ${urgency}` : ''}
${intake?.search_hypothesis ? `Search hypothesis: ${intake.search_hypothesis}` : ''}

TARGET COMPANY: ${company.name}
${company.notes ? `Company notes: ${company.notes}` : ''}

${signalLines ? `RECENT SIGNALS:\n${signalLines}` : ''}

${briefExcerpt ? `PREP BRIEF EXCERPT (use for context and specificity):\n${briefExcerpt}` : ''}

${contactName ? `RECIPIENT: ${contactName}${contactTitle ? `, ${contactTitle}` : ''}` : 'RECIPIENT: Unknown (write without naming a specific person)'}

Write a 3-sentence outreach message grounded in the company context above. Use a specific signal or insight from the brief if available. The message should feel like it comes from someone who genuinely knows this company, not a mass outreach campaign.

${STYLE_GUIDELINES}`

  const startMs = Date.now()
  const stream = await anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  let outputBuffer = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
            if (outputBuffer.length < 2000) outputBuffer += chunk.delta.text
          }
        }
        controller.enqueue(encoder.encode(encodeUserId(userId)))
      } catch (err) {
        const errStr = err instanceof Error ? err.message : 'Unknown error'
        recordTraceError({ feature: 'prep_outreach', userId, model: MODELS.sonnet, latencyMs: Date.now() - startMs, error: errStr })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'prep_outreach', userId })))
      } finally {
        controller.close()
        const final = await stream.finalMessage().catch(() => null)
        const promptTokens = final?.usage.input_tokens ?? 0
        const completionTokens = final?.usage.output_tokens ?? 0
        trackApiUsage(supabase, userId, promptTokens + completionTokens).catch(() => {})
        recordTrace({
          supabase, userId, feature: 'prep_outreach', model: MODELS.sonnet,
          promptTokens, completionTokens,
          latencyMs: Date.now() - startMs,
          inputSnapshot: { company: company.name, hasSignals: (signals?.length ?? 0) > 0, hasBrief: !!briefExcerpt },
          outputSnapshot: outputBuffer,
        })
      }
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
