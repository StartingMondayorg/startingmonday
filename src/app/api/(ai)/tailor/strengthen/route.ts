import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODELS } from '@/lib/anthropic'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { TailorStrengthenBodySchema, firstZodError } from '@/lib/schemas'
import { appendWatermarkToStream } from '@/lib/watermark'

const SYSTEM_PROMPT = `You are an expert executive resume writer. You will rewrite specific weak bullets in a resume to be stronger, more specific, and metrics-driven.

Instructions:
- Identify each weak bullet in the resume by matching the first 10+ words to the WEAK BULLETS list provided
- Rewrite ONLY those bullets: add specific metrics, use strong action verbs, make business impact explicit
- Keep ALL other resume content word-for-word identical
- Output ONLY the complete resume text with the weak bullets replaced
- No preamble, no headers, no "Strengthened Resume:" label - just the resume text
- Preserve the exact formatting style (bullet style, capitalization, spacing) of the original`

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'resume_tailor')
  if (!access.ok) return access.response
  const { userId } = access

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = TailorStrengthenBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { tailoredResume, weakBullets, jobDescription = '', companyName = '' } = parsed.data

  const context = companyName ? `Company: ${companyName}\n\n` : ''
  const userMessage = `${context}WEAK BULLETS TO STRENGTHEN:
${weakBullets}

JOB DESCRIPTION (for context):
${jobDescription.slice(0, 4000)}

RESUME TO REWRITE:
${tailoredResume.slice(0, 12000)}`

  const stream = await anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
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
      } finally {
        controller.close()
      }
    },
  })

  return new Response(appendWatermarkToStream(readable, userId), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
