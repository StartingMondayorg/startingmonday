import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODELS } from '@/lib/anthropic'
import { requireFeatureAccess } from '@/lib/require-feature-access'
import { appendWatermarkToStream } from '@/lib/watermark'
import { TailorBodySchema, firstZodError } from '@/lib/schemas'

const SYSTEM_PROMPT = `You are an executive resume writer specializing in senior technology leaders (CIO, CTO, VP Engineering, COO, CDO). You rewrite resumes to match specific job descriptions without losing the candidate's authentic voice.

Rules:
- No em dashes. Replace with periods, commas, or restructure. This is the most reliable signal of AI-generated text.
- No filler phrases: "results-driven", "proven track record", "dynamic leader", "passionate about", "leverage", "spearheaded", "orchestrated"
- Achievement bullets need a number. If the resume has "Improved team performance" rewrite it as "Raised on-time delivery from 71% to 93%". If no figures are available, write the bullet to invite the question rather than inventing data.
- One outcome per bullet. Not "built the team, scaled the platform, and cut costs by 40%."
- Match the job description language without keyword-stuffing. Use their exact phrases where natural.
- Preserve the candidate's voice. Read the original resume for sentence rhythm, vocabulary level, and formality. Match it.
- Reorder sections and bullets by relevance to this specific role.
- Cut anything that does not serve this application.

Formatting rules (absolute):
- NEVER use ** or * for bold or italic. The candidate's name is plain text. All text is plain text.
- NEVER use --- or ___ for horizontal rules.
- NEVER use # or ## for headers inside the resume body.
- Section headers (EXPERIENCE, EDUCATION, CORE CAPABILITIES, etc.) in ALL CAPS, nothing else.
- Bullet points use a hyphen and space: "- " not "* " or "-".
- Blank line between sections. That is all the formatting there is.

Output format - use these exact headers:

## TAILORED RESUME
[Full tailored resume text, ready to copy and use]

## KEYWORD ANALYSIS
Present: [comma-separated list of key JD terms that appear in the tailored version]
Missing: [comma-separated list of important JD terms not in the resume - things the candidate should address verbally]

## KEY CHANGES
[3-5 bullets describing what changed and why - concrete, not generic]`

export async function POST(request: NextRequest) {
  const access = await requireFeatureAccess(request, 'resume_tailor')
  if (!access.ok) return access.response
  const { userId } = access

  let raw: unknown
  try { raw = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = TailorBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }
  const { resumeText, jobDescription, companyName, targetTitle } = parsed.data

  const contextLines = [
    companyName  && `Company: ${companyName}`,
    targetTitle  && `Target title: ${targetTitle}`,
  ].filter(Boolean).join('\n')

  const userMessage = [
    contextLines,
    `Job Description:\n${jobDescription.slice(0, 8000)}`,
    `Resume:\n${resumeText.slice(0, 12000)}`,
  ].filter(Boolean).join('\n\n')

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
