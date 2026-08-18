import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { trackApiUsage } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'
import { STRATEGY_SYSTEM } from '@/lib/prompts'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTraceError } from '@/lib/trace'

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'strategy_brief')
  if (!access.ok) return access.response

  const { userId, supabase } = access

  const body = await request.json().catch(() => null)
  if (!body?.brief || !body?.question) {
    return NextResponse.json({ error: 'Missing brief or question' }, { status: 400 })
  }

  const { brief, question } = body as { brief: string; question: string }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODELS.sonnet,
          max_tokens: 1000,

          system: STRATEGY_SYSTEM,
          messages: [
            {
              role: 'user',
              content: `You previously produced this Search Strategy Brief:\n\n<brief>\n${brief}\n</brief>\n\nThe candidate has a follow-up question:\n\n${question}\n\nAnswer directly and specifically. Reference the brief where relevant. Keep it tight.`,
            },
          ],
        })
        stream.on('text', text => controller.enqueue(encoder.encode(text)))
        const final = await stream.finalMessage()
        controller.close()
        const tokens = (final.usage.input_tokens ?? 0) + (final.usage.output_tokens ?? 0)
        trackApiUsage(supabase, userId, tokens).catch(err => Sentry.captureException(err, { extra: { route: 'strategy-followup', userId } }))
      } catch (err) {
        recordTraceError({ feature: 'strategy_followup', userId, error: err instanceof Error ? err.message : String(err) })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'strategy_followup', userId })))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
