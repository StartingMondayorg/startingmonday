import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { apiError } from '@/lib/api-error'

type Outcome = 'advanced' | 'rejected' | 'offer'

function parseOutcome(value: unknown): Outcome | null {
  if (value === 'advanced' || value === 'rejected' || value === 'offer') return value
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  const outcome = parseOutcome((body as Record<string, unknown> | null)?.outcome)
  if (!outcome) {
    return apiError('Outcome must be one of: advanced, rejected, offer', 400)
  }

  const { id } = await params
  const now = new Date().toISOString()
  const supabase = await createClient()

  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('id, user_id, company_id')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (briefError || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('briefs')
    .update({
      lifecycle_state: 'used',
      reviewed_at: now,
      used_at: now,
      lifecycle_updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', auth.userId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to store outcome' }, { status: 500 })
  }

  const typedSupabase = supabase as any
  const { error: outcomeError } = await typedSupabase
    .from('prep_brief_outcomes')
    .upsert(
      {
        user_id: auth.userId,
        brief_id: id,
        company_id: brief.company_id,
        outcome,
        outcome_recorded_at: now,
      },
      { onConflict: 'brief_id' },
    )

  if (outcomeError) {
    return NextResponse.json({ error: 'Failed to write dedicated outcome record' }, { status: 500 })
  }

  await logEvent(auth.userId, 'prep_outcome_logged', {
    brief_id: id,
    outcome,
  })
  captureServerEvent(auth.userId, 'prep_outcome_logged', {
    brief_id: id,
    outcome,
  })

  return NextResponse.json({ ok: true, outcome })
}
