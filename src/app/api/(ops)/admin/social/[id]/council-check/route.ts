import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import {
  ALLOWED_EMOTIONAL_ANGLES,
  type EmotionalAngle,
  evaluateShortFormCouncilCheck,
  getNoteToken,
  setNoteToken,
} from '@/lib/social-council-check'

type SocialPostRow = {
  id: string
  post_date: string
  draft_text: string
  notes: string | null
}

async function requireStaff(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  void request
  return { ok: true as const }
}

function normalizeAngle(value: unknown): EmotionalAngle | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_')
  return (ALLOWED_EMOTIONAL_ANGLES as readonly string[]).includes(normalized)
    ? (normalized as EmotionalAngle)
    : null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await requireStaff(request)
  if (!check.ok) return check.response

  const { id } = await params

  let body: { draftText?: string; emotionalAngle?: string }
  try {
    body = await request.json() as { draftText?: string; emotionalAngle?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const emotionalAngle = normalizeAngle(body.emotionalAngle)
  if (!emotionalAngle) {
    return NextResponse.json({
      error: 'Invalid or missing emotionalAngle',
      allowed: ALLOWED_EMOTIONAL_ANGLES,
    }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: post, error: fetchError } = await admin
    .from('social_posts')
    .select('id, post_date, draft_text, notes')
    .eq('id', id)
    .single<SocialPostRow>()

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const draftText = (body.draftText ?? post.draft_text ?? '').trim()
  if (!draftText) {
    return NextResponse.json({ error: 'draftText cannot be empty' }, { status: 400 })
  }

  const { data: previous } = await admin
    .from('social_posts')
    .select('id, notes, post_date')
    .lt('post_date', post.post_date)
    .order('post_date', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; notes: string | null; post_date: string }>()

  const previousEmotionalAngle = normalizeAngle(getNoteToken(previous?.notes, 'emotional_angle'))

  const result = evaluateShortFormCouncilCheck(draftText, emotionalAngle, previousEmotionalAngle)

  let notes = post.notes
  notes = setNoteToken(notes, 'emotional_angle', emotionalAngle)
  notes = setNoteToken(notes, 'council_checked_at', new Date().toISOString())
  notes = setNoteToken(notes, 'council_version', 'human-writing-synthetic-council-v3')
  notes = setNoteToken(notes, 'council_score', String(result.score))
  notes = setNoteToken(notes, 'council_pass', result.councilPass ? 'true' : 'false')
  notes = setNoteToken(notes, 'council_text_hash', result.textHash)

  const { data: updated, error: updateError } = await admin
    .from('social_posts')
    .update({
      draft_text: draftText,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, post_date, notes, draft_text')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    result,
    post: updated,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
