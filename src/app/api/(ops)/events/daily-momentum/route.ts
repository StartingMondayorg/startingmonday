import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logEvent, type UserEventName } from '@/lib/events'

const ALLOWED_EVENTS: UserEventName[] = [
  'emi_daily_loop_loaded',
  'emi_action_completed',
  'emi_daily_reflection_submitted',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as {
    eventName?: UserEventName
    properties?: Record<string, string | number | boolean | null>
  }

  if (!body.eventName || !ALLOWED_EVENTS.includes(body.eventName)) {
    return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
  }

  await logEvent(user.id, body.eventName, body.properties ?? {})
  return NextResponse.json({ ok: true })
}