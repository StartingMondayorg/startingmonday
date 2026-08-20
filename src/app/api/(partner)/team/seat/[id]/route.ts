import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const { id } = await params
  const admin = createAdminClient()

  // Fetch seat and verify ownership before deleting
  const { data: seat, error: fetchError } = await admin
    .from('team_seats')
    .select('id, owner_id, member_user_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !seat) return NextResponse.json({ error: 'Seat not found' }, { status: 404 })
  if (seat.owner_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Downgrade the member back to free if they had been granted access via this seat
  if (seat.member_user_id && seat.status === 'accepted') {
    await admin
      .from('users')
      .update({ subscription_tier: 'free', subscription_status: 'inactive' })
      .eq('id', seat.member_user_id)
  }

  await admin.from('team_seats').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
