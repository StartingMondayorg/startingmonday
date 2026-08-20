import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { getNextSocialPostDays, getSocialPlanForDate, isSocialPostDay } from '@/lib/social-posting-plan'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Allow ?date=YYYY-MM-DD override (defaults to today UTC)
  const dateParam = request.nextUrl.searchParams.get('date')
  const targetDate = dateParam ? new Date(dateParam + 'T12:00:00Z') : new Date()
  const dateStr = targetDate.toISOString().split('T')[0]

  if (!isSocialPostDay(targetDate)) {
    return NextResponse.json({ isPostDay: false, dateStr, nextPostDays: getNextSocialPostDays(targetDate) })
  }

  const plan = getSocialPlanForDate(targetDate)
  if (!plan) return NextResponse.json({ isPostDay: false, dateStr, nextPostDays: getNextSocialPostDays(targetDate) })

  const admin = createAdminClient()

  // Return existing draft if one exists
  const { data: existing } = await admin
    .from('social_posts')
    .select('*')
    .eq('post_date', dateStr)
    .maybeSingle()

  if (existing) {
    // Keep posted historical rows unchanged, but enforce the new schedule for active draft rows.
    if (!existing.is_posted && (existing.draft_text ?? '') !== plan.draftText) {
      const { data: updated } = await admin
        .from('social_posts')
        .update({ pillar: plan.pillar, draft_text: plan.draftText, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (updated) {
        return NextResponse.json({
          isPostDay: true,
          dateStr,
          pillar: plan.pillar,
          pillarLabel: plan.pillarLabel,
          audience: plan.audience,
          audienceLabel: plan.audienceLabel,
          recommendedTimeCt: plan.recommendedTimeCt,
          post: updated,
        })
      }
    }

    return NextResponse.json({
      isPostDay: true,
      dateStr,
      pillar: plan.pillar,
      pillarLabel: plan.pillarLabel,
      audience: plan.audience,
      audienceLabel: plan.audienceLabel,
      recommendedTimeCt: plan.recommendedTimeCt,
      post: existing,
    })
  }

  const { data: created, error } = await admin
    .from('social_posts')
    .insert({ post_date: dateStr, pillar: plan.pillar, draft_text: plan.draftText })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    isPostDay: true,
    dateStr,
    pillar: plan.pillar,
    pillarLabel: plan.pillarLabel,
    audience: plan.audience,
    audienceLabel: plan.audienceLabel,
    recommendedTimeCt: plan.recommendedTimeCt,
    post: created,
  })
}
