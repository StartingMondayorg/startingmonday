'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

const ALLOWED_TARGETS = new Set([
  '/dashboard/signals',
  '/dashboard',
  '/dashboard/follow-ups',
  '/dashboard/briefing?note_saved=1',
])

export async function logBriefingAction(formData: FormData): Promise<void> {
  const target = String(formData.get('target') ?? '').trim()
  const section = String(formData.get('section') ?? '').trim()
  const action = String(formData.get('action') ?? '').trim()
  const pulseState = String(formData.get('pulse_state') ?? '').trim()

  const safeTarget = ALLOWED_TARGETS.has(target) ? target : '/dashboard/briefing'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const properties = {
      section: section || 'unknown',
      action: action || 'cta_click',
      target: safeTarget,
      ...(pulseState ? { pulse_state: pulseState } : {}),
    }

    await logEvent(user.id, 'briefing_action_clicked', properties)
    captureServerEvent(user.id, 'briefing_action_clicked', properties)
  }

  redirect(safeTarget)
}

export async function saveBriefingDailyNote(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const pulseState = String(formData.get('pulse_state') ?? '').trim()

  if (!body) {
    redirect('/dashboard/briefing?error=note-empty')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const noteDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(now)

  const { error } = await supabase
    .from('briefing_daily_notes')
    .upsert(
      {
        user_id: user.id,
        note_date: noteDate,
        source: 'briefing',
        title: title || null,
        body,
        metadata: pulseState ? { pulse_state: pulseState } : {},
      },
      { onConflict: 'user_id,note_date' },
    )

  if (error) {
    redirect('/dashboard/briefing?error=note-save-failed')
  }

  const properties = {
    section: 'weekly_pulse_support',
    action: 'save_daily_note',
    target: 'briefing_daily_notes',
    ...(pulseState ? { pulse_state: pulseState } : {}),
  }

  await logEvent(user.id, 'briefing_action_clicked', properties)
  captureServerEvent(user.id, 'briefing_action_clicked', properties)

  redirect('/dashboard/briefing?note_saved=1')
}
