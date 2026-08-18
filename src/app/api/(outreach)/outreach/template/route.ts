import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { getStaffMember } from '@/lib/staff'
import { createClient } from '@/lib/supabase/server'
import { buildOutreachTemplateDraft, type OutreachTemplateChannel } from '@/lib/outreach/template-draft'

const VALID_CHANNELS = new Set<OutreachTemplateChannel>([
  'executives',
  'search_firms',
  'coaches',
  'outplacement_firms',
])

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const staff = await getStaffMember(data.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const outreachChannel = (body?.outreachChannel ?? '').toString().trim().toLowerCase() as OutreachTemplateChannel

  if (!VALID_CHANNELS.has(outreachChannel)) {
    return NextResponse.json({ error: 'Invalid outreachChannel.' }, { status: 400 })
  }

  const fullName = (body?.fullName ?? '').toString().trim()
  const roleBucket = (body?.roleBucket ?? '').toString().trim()
  const company = (body?.company ?? '').toString().trim()
  const personaFocus = (body?.personaFocus ?? '').toString().trim()
  const templateStep = (body?.templateStep ?? 'first_touch').toString().trim()
  const state = (body?.state ?? '').toString().trim()
  const newsTrigger = (body?.newsTrigger ?? '').toString().trim()
  const postTrigger = (body?.postTrigger ?? '').toString().trim()
  const profileTrigger = (body?.profileTrigger ?? '').toString().trim()

  if (!fullName) {
    return NextResponse.json({ error: 'fullName is required.' }, { status: 400 })
  }

  const draft = buildOutreachTemplateDraft({
    channel: outreachChannel,
    fullName,
    roleLabel: roleBucket || 'Executive',
    company,
    focus: personaFocus || roleBucket || 'senior transition',
    step: templateStep,
    state,
    newsTrigger,
    postTrigger,
    profileTrigger,
  })

  return NextResponse.json({
    ok: true,
    templateSource: draft.templateSource,
    subject: draft.subject,
    body: draft.body,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
