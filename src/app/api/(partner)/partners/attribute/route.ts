import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const referralCode = (body?.referral_code ?? '').toString().trim().toUpperCase()
  if (!referralCode) return NextResponse.json({ error: 'referral_code required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: partner } = await admin
    .from('partners')
    .select('id')
    .eq('referral_code', referralCode)
    .eq('is_active', true)
    .maybeSingle()

  if (!partner) return NextResponse.json({ ok: true }) // silent: bad codes don't error

  // Upsert: if already attributed, do nothing
  await admin.from('referral_attributions').upsert(
    { signup_user_id: user.id, partner_id: partner.id },
    { onConflict: 'signup_user_id', ignoreDuplicates: true }
  )

  return NextResponse.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
