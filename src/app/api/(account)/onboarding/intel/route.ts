import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { checkBurstLimit } from '@/lib/burst-limit'
import { isRateLimited } from '@/lib/api-usage'
import { anthropic, MODELS } from '@/lib/anthropic'

const PERSONA_LABELS: Record<string, string> = {
  csuite:   'C-suite executive (CIO, CTO, COO)',
  vp:       'VP or SVP targeting a C-suite role',
  director: 'Director targeting VP or above',
  board:    'executive seeking a board or advisory seat',
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  if (!(await checkBurstLimit(userId))) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 })
  }
  const supabase = await createClient()
  if (await isRateLimited(supabase, userId)) {
    return NextResponse.json({ error: 'Monthly token limit reached.' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const companyName = (body.companyName ?? '').trim().slice(0, 200)
  const persona = (body.persona ?? '').trim()

  if (!companyName) {
    return NextResponse.json({ error: 'companyName required' }, { status: 400 })
  }

  const personaLabel = PERSONA_LABELS[persona] ?? 'senior executive'

  const prompt = `You are generating a company intelligence preview for Starting Monday, a platform for executives in active job search.

The user is a ${personaLabel} and has added "${companyName}" as a target company.

Write a 4-paragraph company intelligence snapshot covering:
1. What this company is focused on right now: strategic priorities, growth phase, or transformation agenda
2. Organizational dynamics worth watching: recent leadership changes, restructuring signals, or mandate shifts
3. People and decision-makers shaping the opportunity: what kinds of leaders likely influence the shortlist or backfill path
4. Why a ${personaLabel} should be watching this company: the specific opportunity angle and likely timing window

Rules:
- Be specific and credible. If you are uncertain about a specific fact, speak in patterns ("companies at this stage typically...") rather than fabricating.
- No em dashes. Short sentences. No filler phrases.
- Do not use headers. Plain prose only.
- End with one sentence on timing: when the signal window is likely to open for someone in this role.`

  const stream = await anthropic.messages.stream({
    model: MODELS.haiku,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
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

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
