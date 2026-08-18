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

  const body = await request.json().catch(() => ({}))
  const lookbackDays = Math.max(1, Math.min(Number(body?.lookbackDays ?? 4), 30))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 100), 500))

  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, contacted_at, name')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .in('outreach_status', ['reached_out', 'in_conversation'])
    .lte('contacted_at', since)
    .limit(limit)

  let created = 0
  for (const contact of contacts ?? []) {
    const { data: existing } = await supabase
      .from('follow_ups')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('contact_id', contact.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (existing?.id) continue

    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await supabase.from('follow_ups').insert({
      user_id: auth.userId,
      contact_id: contact.id,
      due_date: dueDate,
      action: `Follow up with ${contact.name}`,
      status: 'pending',
    })

    await supabase
      .from('contacts')
      .update({ follow_up_at: `${dueDate}T17:00:00.000Z` })
      .eq('id', contact.id)
      .eq('user_id', auth.userId)

    created++
  }

  return NextResponse.json({ ok: true, evaluated: contacts?.length ?? 0, created })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
