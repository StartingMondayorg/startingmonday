import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

// Toggles trial/marketing email nudges for the authenticated user.
// enabled=true clears drip_unsubscribed_at; enabled=false sets it (emails off).
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Expected { enabled: boolean }' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ drip_unsubscribed_at: body.enabled ? null : new Date().toISOString() })
    .eq('id', auth.userId)

  if (error) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'email_nudges_toggle_error', error: error.message }))
    return NextResponse.json({ error: 'Could not save your preference. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, enabled: body.enabled })
}
