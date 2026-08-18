import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'

/**
 * Safe dry-run publish endpoint for production automation verification.
 *
 * Configure MAKE_WEBHOOK_URL to this endpoint with a token query param:
 * /api/admin/social/mock-publish?token=...
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = request.nextUrl.searchParams.get('token')
  const expected = process.env.SOCIAL_DRY_RUN_WEBHOOK_TOKEN

  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => null)

    const postUrn = `urn:li:ugcPost:dryrun-${Date.now()}`

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'social_mock_publish',
      dryRunMode: true,
      post_date: body?.post_date ?? null,
      pillar: body?.pillar ?? null,
      audience: body?.audience ?? null,
      post_target: body?.post_target ?? null,
      has_text: typeof body?.text === 'string' && body.text.length > 0,
    }))

    return NextResponse.json({
      ok: true,
      dryRunMode: true,
      linkedin_post_urn: postUrn,
    })
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'admin/social/mock-publish' } })
    return NextResponse.json({ error: 'Mock publish failed.' }, { status: 500 })
  }
}
