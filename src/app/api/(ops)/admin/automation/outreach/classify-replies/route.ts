/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

type Label = 'interested' | 'not_interested' | 'neutral'

function classify(body: string): { label: Label; confidence: number; meetingSignal: boolean } {
  const text = body.toLowerCase()
  const interested = ['interested', 'sounds good', 'let us talk', 'book time', 'meet', 'calendar']
  const notInterested = ['not interested', 'remove me', 'stop', 'unsubscribe', 'no thanks']

  if (notInterested.some((k) => text.includes(k))) {
    return { label: 'not_interested', confidence: 90, meetingSignal: false }
  }
  if (interested.some((k) => text.includes(k))) {
    return { label: 'interested', confidence: 85, meetingSignal: true }
  }
  return { label: 'neutral', confidence: 60, meetingSignal: false }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 200), 1000))
  const sb = supabase as any

  const { data: inbox } = await sb
    .from('outreach_reply_inbox')
    .select('id, body')
    .eq('user_id', auth.userId)
    .is('classified_at', null)
    .order('received_at', { ascending: true })
    .limit(limit)

  const counts: Record<Label, number> = { interested: 0, not_interested: 0, neutral: 0 }

  for (const msg of inbox ?? []) {
    const result = classify(msg.body ?? '')
    counts[result.label] += 1
    await sb
      .from('outreach_reply_inbox')
      .update({
        classified_label: result.label,
        classification_confidence: result.confidence,
        meeting_signal: result.meetingSignal,
        classified_at: new Date().toISOString(),
      })
      .eq('id', msg.id)
      .eq('user_id', auth.userId)
  }

  return NextResponse.json({ ok: true, processed: inbox?.length ?? 0, counts })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
