import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'

type PulseEventBody = {
  section?: string
  action?: string
  target?: string
  pulse_state?: string
}

const ALLOWED_SECTIONS = new Set(['weekly_pulse_support'])
const ALLOWED_ACTIONS = new Set(['why_this_matters_opened', 'email_plan_clicked'])
const ALLOWED_TARGETS = new Set(['inline_explainer', 'mailto'])
const ALLOWED_STATES = new Set(['building', 'steady', 'watch'])

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => null)) as PulseEventBody | null
  if (!body) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const section = typeof body.section === 'string' ? body.section.trim() : ''
  const action = typeof body.action === 'string' ? body.action.trim() : ''
  const target = typeof body.target === 'string' ? body.target.trim() : ''
  const pulseState = typeof body.pulse_state === 'string' ? body.pulse_state.trim() : ''

  if (!ALLOWED_SECTIONS.has(section) || !ALLOWED_ACTIONS.has(action) || !ALLOWED_TARGETS.has(target)) {
    return NextResponse.json({ error: 'invalid_properties' }, { status: 400 })
  }

  const properties: Record<string, string> = {
    section,
    action,
    target,
  }

  if (ALLOWED_STATES.has(pulseState)) {
    properties.pulse_state = pulseState
  }

  await logEvent(auth.userId, 'briefing_action_clicked', properties)
  captureServerEvent(auth.userId, 'briefing_action_clicked', properties)

  return NextResponse.json({ ok: true })
}
