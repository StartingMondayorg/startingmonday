import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/posthog-server'

const requestSchema = z.object({
  queryId: z.string().uuid(),
  rating: z.enum(['helpful', 'not_helpful']),
  note: z.string().max(600).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback payload.' }, { status: 400 })
  }

  const supabase = await createClient()

  const insertResult = await (supabase as any).from('guide_chat_feedback').insert({
    user_id: auth.userId,
    guide_chat_query_id: parsed.data.queryId,
    rating: parsed.data.rating,
    note: parsed.data.note?.trim() || null,
  })

  if (insertResult.error) {
    return NextResponse.json({ error: 'Could not submit feedback.' }, { status: 500 })
  }

  captureServerEvent(auth.userId, 'guide_chat_feedback_submitted', {
    rating: parsed.data.rating,
    has_note: !!parsed.data.note,
  })

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
