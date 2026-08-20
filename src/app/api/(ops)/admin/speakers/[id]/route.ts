import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'

const VALID_STATUSES = ['not_started', 'contacted', 'responded', 'converted', 'not_interested', 'skip']

// PATCH: update outreach fields for a single speaker
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as {
    outreach_status?: string
    outreach_date?: string | null
    outreach_notes?: string | null
    priority?: number
    notes?: string | null
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.outreach_status !== undefined) {
    if (!VALID_STATUSES.includes(body.outreach_status)) {
      return NextResponse.json({ error: 'Invalid outreach_status' }, { status: 400 })
    }
    update.outreach_status = body.outreach_status
    if (body.outreach_status === 'contacted' && !body.outreach_date) {
      update.outreach_date = new Date().toISOString().split('T')[0]
    }
  }
  if (body.outreach_date !== undefined) update.outreach_date = body.outreach_date
  if (body.outreach_notes !== undefined) update.outreach_notes = body.outreach_notes
  if (body.priority !== undefined) {
    const p = Number(body.priority)
    if (p < 1 || p > 3) return NextResponse.json({ error: 'priority must be 1-3' }, { status: 400 })
    update.priority = p
  }
  if (body.notes !== undefined) update.notes = body.notes

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('conference_speakers')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return withAuthCookies(NextResponse.json({ speaker: data }), auth)
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
