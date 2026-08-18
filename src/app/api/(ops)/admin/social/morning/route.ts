import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSocialPlanForDate, isSocialPostDay } from '@/lib/social-posting-plan'
import { getNoteToken, hashDraftText } from '@/lib/social-council-check'

function isApprovedForPublish(notes: unknown): boolean {
  if (typeof notes !== 'string') return false
  return notes.includes('approval_status=approved')
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  if (!isSocialPostDay(today)) {
    return NextResponse.json({ ok: true, sent: false, reason: 'Not a post day' })
  }

  const plan = getSocialPlanForDate(today)
  if (!plan) return NextResponse.json({ ok: true, sent: false, reason: 'No plan' })

  const dateStr = today.toISOString().split('T')[0]
  const admin = createAdminClient()

  // Fetch or generate draft
  let { data: post } = await admin
    .from('social_posts')
    .select('*')
    .eq('post_date', dateStr)
    .maybeSingle()

  if (!post) {
    const { data: created } = await admin
      .from('social_posts')
      .insert({ post_date: dateStr, pillar: plan.pillar, draft_text: plan.draftText })
      .select()
      .single()
    post = created
  } else if (!post.is_posted && post.draft_text !== plan.draftText) {
    const { data: updated } = await admin
      .from('social_posts')
      .update({ pillar: plan.pillar, draft_text: plan.draftText, updated_at: new Date().toISOString() })
      .eq('id', post.id)
      .select()
      .single()
    post = updated ?? post
  }

  if (!post) return NextResponse.json({ error: 'Failed to prepare post' }, { status: 500 })

  const dryRunMode = process.env.SOCIAL_DRY_RUN_MODE === 'true'

  // Skip if already posted
  if (post.is_posted) {
    return NextResponse.json({ ok: true, sent: false, reason: 'Already posted', pillar: post.pillar, dateStr })
  }

  const autoPublishEnabled = process.env.SOCIAL_AUTO_PUBLISH_ENABLED === 'true'
  if (!autoPublishEnabled) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: 'Manual publish mode enabled',
      dateStr,
      postId: post.id,
    })
  }

  const requiresApprovedQueue = (process.env.SOCIAL_REQUIRE_APPROVED_QUEUE ?? 'true') !== 'false'
  if (!dryRunMode && requiresApprovedQueue && !isApprovedForPublish(post.notes)) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: 'Post is not from approved queue handoff',
      dateStr,
      postId: post.id,
    })
  }

  const councilPass = getNoteToken(post.notes, 'council_pass') === 'true'
  const councilHash = getNoteToken(post.notes, 'council_text_hash')
  const draftHash = hashDraftText((post.draft_text ?? '').trim())
  const emotionalAngle = getNoteToken(post.notes, 'emotional_angle')

  if (!dryRunMode && (!councilPass || !councilHash || councilHash !== draftHash || !emotionalAngle)) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: 'Council check required before auto-post',
      dateStr,
      postId: post.id,
    })
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
      post_date: dateStr,
      pillar: plan.pillar,
      audience: plan.audience,
      post_target: postTarget,
      company_urn: companyUrn,
    }),
  })

  if (!makeRes.ok) {
    const errText = await makeRes.text().catch(() => '')
    console.error('[social/morning] Make.com webhook error', { status: makeRes.status, body: errText })
    return NextResponse.json(
      {
        ok: false,
        sent: false,
        error: 'Make.com webhook error',
        detail: errText,
        upstreamStatus: makeRes.status,
        dateStr,
        postId: post.id,
      },
      { status: 200 }
    )
  }

  // Try to capture the LinkedIn post URN from Make.com's response body.
  // Configure your Make.com scenario to return { "linkedin_post_urn": "urn:li:ugcPost:..." }
  // or { "postUrn": "..." } in its HTTP response module for engagement sync to work.
  let linkedinPostUrn: string | null = null
  try {
    const makeData = await makeRes.json()
    linkedinPostUrn =
      (makeData?.linkedin_post_urn as string | undefined) ??
      (makeData?.postUrn as string | undefined) ??
      (makeData?.urn as string | undefined) ??
      null
  } catch {
    // Make.com returned non-JSON or empty body - URN not available, sync will be skipped
  }

  if (!dryRunMode) {
    await admin
      .from('social_posts')
      .update({
        is_posted: true,
        posted_at: new Date().toISOString(),
        ...(linkedinPostUrn ? { linkedin_post_urn: linkedinPostUrn } : {}),
      })
      .eq('id', post.id)
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'social_auto_posted',
    dryRunMode,
    pillar: plan.pillar,
    pillarLabel: plan.pillarLabel,
    audience: plan.audience,
    audienceLabel: plan.audienceLabel,
    dateStr,
    postId: post.id,
    linkedinPostUrn,
  }))

  return NextResponse.json({
    ok: true,
    sent: true,
    dryRunMode,
    pillar: plan.pillar,
    pillarLabel: plan.pillarLabel,
    audience: plan.audience,
    audienceLabel: plan.audienceLabel,
    dateStr,
    linkedinPostUrn,
  })
}
