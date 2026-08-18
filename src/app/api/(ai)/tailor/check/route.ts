import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODELS } from '@/lib/anthropic'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { TailorCheckBodySchema, firstZodError } from '@/lib/schemas'
import { appendWatermarkToStream } from '@/lib/watermark'

const SYSTEM_PROMPT = `You are a senior executive recruiter and hiring manager with 20 years placing C-suite and VP-level technology leaders. You evaluate resumes with ruthless precision.

You will receive a tailored resume and the job description it was tailored for. Score it across five dimensions.

Output format - use these exact headers and follow the format precisely:

## ATS SCORE
[number 0-100 only, nothing else on this line]

## ATS NOTES
Present: [comma-separated JD keywords found in the resume]
Missing: [comma-separated important JD keywords absent from the resume]

## RECRUITER GRADE
[single letter A/B/C/D/F only, nothing else on this line]

## RECRUITER NOTES
[2-4 bullets. Be specific and line-level where possible. What would make a recruiter pause, skip, or call immediately?]

## HIRING MANAGER GRADE
[single letter A/B/C/D/F only, nothing else on this line]

## HIRING MANAGER NOTES
[2-4 bullets. What gaps or strengths will a hiring manager focus on? What will they probe in the first 10 minutes?]

## WEAK BULLETS
[List only the weak bullets - those with no metric, vague scope, or passive construction. Format each as:]
BULLET: [first 8-10 words of the bullet]
FIX: [one sentence on what specifically to add or change]
[blank line between each]

## VERBAL COVER
[2-4 items the JD requires that the resume cannot address on paper. These need to be covered in conversation. Format as bullets.]

## SIX SECOND TEST
[single letter A/B/C/D/F only, nothing else on this line]

## SIX SECOND NOTES
[What does a recruiter see in the first 6 seconds - name, current title, first 2 bullets of most recent role. Does it earn the call? One short paragraph.]`

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'resume_tailor')
  if (!access.ok) return access.response
  const { userId } = access

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = TailorCheckBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { tailoredResume, jobDescription, companyName } = parsed.data

  const context = companyName ? `Company: ${companyName}\n\n` : ''
  const userMessage = `${context}Job Description:\n${jobDescription.slice(0, 8000)}\n\nTailored Resume:\n${tailoredResume.slice(0, 12000)}`

  const stream = await anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 2000,
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
