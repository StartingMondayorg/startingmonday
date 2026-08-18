/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sb = supabase as any
  const { data: suppressions } = await sb
    .from('outreach_suppressions')
    .select('email')
    .eq('user_id', auth.userId)
    .eq('active', true)

  const emails = (suppressions ?? []).map((s: any) => String(s.email).toLowerCase()).filter(Boolean)
  if (emails.length === 0) return NextResponse.json({ ok: true, suppressed: 0, updatedContacts: 0 })

  const { data: updatedRows } = await supabase
    .from('contacts')
    .update({ outreach_status: 'closed' })
    .eq('user_id', auth.userId)
    .in('email', emails)
    .select('id')

  return NextResponse.json({ ok: true, suppressed: emails.length, updatedContacts: updatedRows?.length ?? 0 })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
