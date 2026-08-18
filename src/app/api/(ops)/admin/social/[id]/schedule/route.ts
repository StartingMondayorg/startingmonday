import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { getNoteToken, hashDraftText } from '@/lib/social-council-check'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  void request
  const { id } = await params
  const admin = createAdminClient()

  const { data: post, error: fetchError } = await admin
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const dryRunMode = process.env.SOCIAL_DRY_RUN_MODE === 'true'

  const councilPass = getNoteToken(post.notes, 'council_pass') === 'true'
  const councilHash = getNoteToken(post.notes, 'council_text_hash')
  const draftHash = hashDraftText((post.draft_text ?? '').trim())
  const emotionalAngle = getNoteToken(post.notes, 'emotional_angle')

  if (!dryRunMode && (!councilPass || !councilHash || councilHash !== draftHash || !emotionalAngle)) {
    return NextResponse.json({
      error: 'Council check required before posting',
      detail: 'Run the short-form council check and pass with current draft and emotional angle.',
    }, { status: 412 })
  }

  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL
  if (!makeWebhookUrl) {
    return NextResponse.json({ error: 'MAKE_WEBHOOK_URL not configured' }, { status: 500 })
  }

  const postTarget = process.env.LINKEDIN_POST_TARGET ?? 'personal'
  const companyUrn = process.env.LINKEDIN_COMPANY_URN ?? null

  const makeRes = await fetch(makeWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: post.draft_text,
      post_date: post.post_date,
      pillar: post.pillar,
      post_target: postTarget,
      company_urn: companyUrn,
    }),
  })

  if (!makeRes.ok) {
    const errText = await makeRes.text().catch(() => '')
    console.error('[social/schedule] Make.com webhook error', { status: makeRes.status, body: errText })
    return NextResponse.json(
      {
        ok: false,
        error: 'Make.com webhook error',
        detail: errText,
        upstreamStatus: makeRes.status,
      },
      { status: 200 }
    )
  }

  if (dryRunMode) {
    return NextResponse.json({ post, dryRunMode: true })
  }

  const { data: updated, error: updateError } = await admin
    .from('social_posts')
    .update({ is_posted: true, posted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ post: updated })
}
