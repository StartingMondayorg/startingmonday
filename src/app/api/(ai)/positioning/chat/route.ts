import { type NextRequest } from 'next/server'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { anthropic, MODELS, TEMP } from '@/lib/anthropic'
import { streamErrorMessage } from '@/lib/stream-error'
import { recordTraceError } from '@/lib/trace'
import type Anthropic from '@anthropic-ai/sdk'

type Context = {
  currentTitle?: string
  currentCompany?: string
  targetTitles?: string[]
  resumeText?: string
  positioningSummary?: string
  beyondResume?: string
}

const SYSTEM = `You are a senior executive coach specializing in positioning senior leaders for career transitions. Your job is to help this executive articulate their story precisely and credibly.

Help with:
- Pivot framing: moving across industries or functions
- Level jump: VP to CXO, director to VP - building the executive narrative
- Gap coaching: employment gaps, non-linear paths, unconventional backgrounds
- Positioning refinement: sharpening or tightening a draft positioning statement

Rules:
- No corporate jargon. No motivational language. No em dashes.
- Every statement you write must be specific to this person. Never generic.
- When you write a positioning statement, format it as 2-3 sentences:
  Sentence 1: [Title] with [X years] of [core expertise] in [industry or sector].
  Sentence 2: Known for [most differentiating, specific achievement - a real outcome, not a platitude].
  Sentence 3: Targeting [specific role types] at [specific company types or sectors].
- When coaching, name the single most important gap or fix. Not a list of 5 things.
- Ask for specifics when you need them to write something credible. One question at a time.`

export async function POST(request: NextRequest) {
  const auth = await requireFeatureAccess(request, 'positioning_coach')
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await request.json().catch(() => ({}))
  const messages = (body.messages ?? []) as Anthropic.MessageParam[]
  const ctx = (body.context ?? {}) as Context

  const profileLines = [
    ctx.currentTitle        ? `Current/recent title: ${ctx.currentTitle}` : '',
    ctx.currentCompany      ? `Current company: ${ctx.currentCompany}` : '',
    ctx.targetTitles?.length ? `Target titles: ${ctx.targetTitles.join(', ')}` : '',
    ctx.positioningSummary  ? `Current positioning statement:\n${ctx.positioningSummary}` : '',
    ctx.beyondResume        ? `Context beyond resume:\n${ctx.beyondResume}` : '',
    ctx.resumeText          ? `\nResume (first 4000 chars):\n${ctx.resumeText.slice(0, 4000)}` : '',
  ].filter(Boolean).join('\n')

  const system = profileLines
    ? `${SYSTEM}\n\nCANDIDATE PROFILE:\n${profileLines}`
    : `${SYSTEM}\n\nNo profile data provided. Start by asking about their background, current title, and what they are targeting.`

  const stream = await anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 1024,
    temperature: TEMP.balanced,
    system,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        recordTraceError({ feature: 'positioning_chat', userId, error: err instanceof Error ? err.message : String(err) })
        controller.enqueue(encoder.encode(streamErrorMessage(err, { feature: 'positioning_chat', userId })))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
