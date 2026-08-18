import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'

async function requireStaff(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true as const }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireStaff(request)
  if (!check.ok) return check.response
  const { id } = await params
  const admin = createAdminClient()
  await admin.from('social_posts').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireStaff(request)
  if (!check.ok) return check.response
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if ('draft_text' in body) {
    const draftText = body.draft_text
    if (typeof draftText !== 'string' || !draftText.trim()) {
      return NextResponse.json({ error: 'draft_text cannot be empty' }, { status: 400 })
    }
    updates.draft_text = draftText.trim()
  }

  if ('notes' in body) {
    const notes = body.notes
    updates.notes = typeof notes === 'string' && notes.trim() ? notes.trim() : null
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('social_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
