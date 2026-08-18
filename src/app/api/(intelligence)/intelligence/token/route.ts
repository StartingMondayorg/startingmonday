import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { createAccessToken } from '@/lib/intelligence'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { slug, label, expiresInDays } = body as {
    slug: string
    label: string
    expiresInDays?: number | null
  }

  if (!slug || !label) {
    return NextResponse.json({ error: 'slug and label are required' }, { status: 400 })
  }

  try {
    const tokenId = await createAccessToken(slug, user.id, label, expiresInDays ?? 30)
    return NextResponse.json({ tokenId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create token'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
