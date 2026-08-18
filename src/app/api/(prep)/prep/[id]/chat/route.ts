import { type NextRequest, NextResponse } from 'next/server'
import { requirePrepAccess } from '@/lib/require-prep-access'
import { anthropic, MODELS } from '@/lib/anthropic'
import { trackApiUsage } from '@/lib/api-usage'
import { apiError } from '@/lib/api-error'
import { PrepChatBodySchema, PrepChatHistoryItemSchema, PrepRouteParamsSchema, firstZodError } from '@/lib/schemas'

const CHAT_SYSTEM = `You are a prep brief assistant helping a senior executive prepare for an upcoming meeting, interview, or networking conversation.

The user has generated a prep brief and wants to ask questions or work through specific scenarios. Answer directly and concisely. Use the brief as context. Draw on what you know about the company.

Rules:
- No corporate speak. No filler. No hedging.
- Short answers unless they ask you to elaborate.
- If they want to role-play a question, give a direct answer frame they can use.
- If they ask about something not in the brief, answer from what you know but say so.
- Never suggest they "reach out to a recruiter" or "consult an expert."
- Max 300 words per response unless they ask for more.`

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

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const parsedBody = PrepChatBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return apiError(firstZodError(parsedBody.error), 400)
  }
  const { message } = parsedBody.data

  const brief = parsedBody.data.brief.slice(0, 8000)
  const companyName = parsedBody.data.companyName.trim()

  const history = parsedBody.data.history
    .slice(-8)
    .map(item => PrepChatHistoryItemSchema.safeParse(item))
    .filter(result => result.success)
    .map(result => result.data)

  // Verify company belongs to user (no data leak across users)
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('user_id', userId)
    .single()
  if (!company) return apiError('Not found', 404)

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...(brief ? [
      { role: 'user' as const, content: `Here is my prep brief for ${companyName || 'this company'}:\n\n${brief}` },
      { role: 'assistant' as const, content: `Got it. I have your brief for ${companyName || 'this company'}. What do you want to work through?` },
    ] : []),
    ...history,
    { role: 'user' as const, content: message },
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = anthropic.messages.stream({
          model: MODELS.haiku,
          max_tokens: 600,
          system: CHAT_SYSTEM,
          messages,
        })
        msgStream.on('text', text => {
          controller.enqueue(encoder.encode(text))
        })
        const final = await msgStream.finalMessage()
        controller.close()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(() => {})
      } catch {
        controller.enqueue(encoder.encode('Unable to answer right now. Try again.'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
