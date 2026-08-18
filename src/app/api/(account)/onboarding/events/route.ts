import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logEvent, type UserEventName } from '@/lib/events'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueueOnboardingVideoRunForMilestoneEvent } from '@/lib/onboarding-video-queue'

const ALLOWED_EVENTS: UserEventName[] = [
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_nudge_shown',
  'onboarding_low_energy_enabled',
  'onboarding_first_value_ready',
  'emi_assessment_started',
  'emi_assessment_completed',
  'emi_onboarding_started',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as {
    eventName?: UserEventName
    properties?: Record<string, string | number | boolean | null>
  }

  const eventName = body.eventName
  if (!eventName || !ALLOWED_EVENTS.includes(eventName)) {
    return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
  }

  await logEvent(user.id, eventName, body.properties ?? {})

  if (
    eventName === 'onboarding_started'
    || eventName === 'onboarding_step_completed'
    || eventName === 'onboarding_first_value_ready'
  ) {
    try {
      const admin = createAdminClient() as unknown as any
      await enqueueOnboardingVideoRunForMilestoneEvent(admin, {
        userId: user.id,
        eventName,
        properties: body.properties ?? {},
      })
    } catch {
      // Milestone auto-enqueue is best-effort and must not fail event ingestion.
    }
  }

  // Keep canonical EMI event names populated even when UI emits legacy onboarding names.
  if (eventName === 'onboarding_started') {
    await Promise.all([
      logEvent(user.id, 'emi_assessment_started', body.properties ?? {}),
      logEvent(user.id, 'emi_onboarding_started', body.properties ?? {}),
    ])
  }

  if (eventName === 'onboarding_first_value_ready') {
    await logEvent(user.id, 'emi_assessment_completed', body.properties ?? {})
  }

  return NextResponse.json({ ok: true })
}
