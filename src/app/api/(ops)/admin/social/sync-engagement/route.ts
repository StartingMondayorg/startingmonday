import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Syncs LinkedIn engagement (likes, comments) for all posted social_posts that have a
 * linkedin_post_urn set. Called daily by the worker's sync-linkedin-engagement cron job.
 *
 * LinkedIn REST API: GET /v2/socialActions/{encodedUrn}
 * Required scope: r_member_social (personal) or r_organization_social (company page)
 * Env: LINKEDIN_ACCESS_TOKEN
 */
async function fetchLinkedInEngagement(
  postUrn: string,
  accessToken: string,
): Promise<{ like_count: number; comment_count: number } | null> {
  const encodedUrn = encodeURIComponent(postUrn)
  const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })
  } catch (err) {
    console.error('[sync-engagement] fetch error', { postUrn, err: String(err) })
    return null
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[sync-engagement] LinkedIn API error', { postUrn, status: res.status, body })
    return null
  }
  const data = await res.json().catch(() => null)
  if (!data) return null
  return {
    like_count: (data?.likesSummary?.totalLikes as number | undefined) ?? 0,
    comment_count:
      (data?.commentsSummary?.totalFirstLevelComments as number | undefined) ??
      (data?.commentsSummary?.aggregatedTotalComments as number | undefined) ??
      0,
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dryRunMode = process.env.SOCIAL_DRY_RUN_MODE === 'true'
  if (dryRunMode) {
    return NextResponse.json({ ok: true, synced: 0, errors: 0, total: 0, reason: 'Dry-run mode enabled' })
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: 'LINKEDIN_ACCESS_TOKEN not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data: rawPosts, error } = await admin
    .from('social_posts')
    .select('id, linkedin_post_urn')
    .eq('is_posted', true)
    .not('linkedin_post_urn', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[sync-engagement] DB error', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
  const posts = (rawPosts ?? []) as unknown as { id: string; linkedin_post_urn: string | null }[]
  if (!posts.length) {
    return NextResponse.json({ ok: true, synced: 0, reason: 'No posts with URN' })
  }
  let synced = 0
  let errors = 0
  for (const post of posts) {
    if (!post.linkedin_post_urn) continue
    const engagement = await fetchLinkedInEngagement(post.linkedin_post_urn, accessToken)
    if (!engagement) {
      errors++
      continue
    }
    await admin
      .from('social_posts')
      .update({ ...engagement, engagement_synced_at: new Date().toISOString() })
      .eq('id', post.id)
    synced++
  }

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'linkedin_engagement_synced',
      synced,
      errors,
      total: posts.length,
    }),
  )

  return NextResponse.json({ ok: true, synced, errors, total: posts.length })
}
