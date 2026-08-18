import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/require-auth'
import { logEvent } from '@/lib/events'

type Body = {
  briefingFrequency?: 'daily' | 'weekly'
  briefingTime?: string
}

function isValidTime(value: string | undefined): value is string {
  if (!value) return false
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({} as Body))
  const frequency: 'daily' | 'weekly' = body.briefingFrequency === 'weekly' ? 'weekly' : 'daily'

  const updatePayload: { briefing_frequency: 'daily' | 'weekly'; briefing_time?: string } = {
    briefing_frequency: frequency,
  }

  if (frequency === 'daily') {
    if (!isValidTime(body.briefingTime)) {
      return NextResponse.json({ error: 'Invalid briefing time for daily mode' }, { status: 400 })
    }
    updatePayload.briefing_time = body.briefingTime
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_profiles')
    .update(updatePayload)
    .eq('user_id', auth.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logEvent(auth.userId, 'briefing_configured', {
    briefing_frequency: frequency,
    briefing_time: updatePayload.briefing_time ?? null,
  })

  return NextResponse.json({ ok: true })
}
