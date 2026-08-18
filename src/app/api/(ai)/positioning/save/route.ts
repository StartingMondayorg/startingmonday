import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { captureServerEvent } from '@/lib/posthog-server'
import { logEvent } from '@/lib/events'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const positioning = (body.positioning ?? '').toString().trim().slice(0, 500)
  if (!positioning) return NextResponse.json({ error: 'Positioning text required.' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_profiles')
    .update({ positioning_summary: positioning })
    .eq('user_id', auth.userId)
  if (error) return NextResponse.json({ error: 'Save failed.' }, { status: 500 })

  captureServerEvent(auth.userId, 'positioning_saved', { length: positioning.length })
  await logEvent(auth.userId, 'positioning_saved', { length: positioning.length })

  return NextResponse.json({ ok: true })
}
