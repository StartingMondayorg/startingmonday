import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

const VALID_SOURCES = new Set(['manual', 'unsubscribe', 'bounce', 'complaint', 'system'])

function normalizeEmail(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return email.includes('@')
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  const reason = (body?.reason ?? 'manual').toString().trim() || 'manual'
  const source = (body?.source ?? 'manual').toString().trim() || 'manual'

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  }
  if (!VALID_SOURCES.has(source)) {
    return NextResponse.json({ error: 'Invalid source.' }, { status: 400 })
  }

  const sb = supabase as any

  const { error } = await sb
    .from('outreach_suppressions')
    .upsert({
      user_id: userId,
      email,
      reason,
      source,
      active: true,
    }, { onConflict: 'user_id,email' })

  if (error) {
    return NextResponse.json({ error: 'Failed to update suppression list.' }, { status: 500 })
  }

  // Keep contacts aligned with suppression state.
  await supabase
    .from('contacts')
    .update({ outreach_status: 'closed' })
    .eq('user_id', userId)
    .eq('email', email)

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
