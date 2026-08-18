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

  const body = await request.json().catch(() => ({}))
  const source = (body?.source ?? 'web_form').toString().slice(0, 50)
  const payload = typeof body?.payload === 'object' && body.payload !== null ? body.payload : body
  const sb = supabase as any

  const { data: inserted, error } = await sb
    .from('onboarding_intake_submissions')
    .insert({
      user_id: auth.userId,
      source,
      status: 'received',
      payload,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to store intake submission' }, { status: 500 })

  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  await supabase.from('follow_ups').insert({
    user_id: auth.userId,
    due_date: dueDate,
    action: 'Review onboarding intake submission',
    status: 'pending',
  })

  return NextResponse.json({ ok: true, intakeId: inserted?.id })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
