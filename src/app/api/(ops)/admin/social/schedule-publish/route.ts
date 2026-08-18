import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { requireAuth } from '@/lib/require-auth'

export async function POST(request: NextRequest) {
  const sessionAuth = await requireAuth(request)
  if (!sessionAuth.ok) return sessionAuth.response
  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response
  const admin = createAdminClient()

  // Fetch unscheduled posts
  const { data: unscheduledPosts, error: fetchError } = await admin
    .from('social_posts')
    .select('id, post_date, pillar, draft_text')
    .is('buffer_scheduled_at', null)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Schedule posts
  const now = new Date()
  const updates = unscheduledPosts.map((post, index) => {
    const scheduleDate = new Date(now.getTime() + index * 60 * 60 * 1000) // Schedule hourly
    return {
      id: post.id,
      buffer_scheduled_at: scheduleDate.toISOString(),
    }
  })

  for (const update of updates) {
    const { error: updateError } = await admin
      .from('social_posts')
      .update({ buffer_scheduled_at: update.buffer_scheduled_at })
      .eq('id', update.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, scheduled: updates.length })
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
