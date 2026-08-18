'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/form-utils'
import { anthropic, MODELS } from '@/lib/ai/anthropic'
import { captureServerEvent } from '@/lib/posthog-server'
import { logEvent } from '@/lib/events'

const MAX_ON_DEMAND_SCAN_COMPANIES = 40

function withScanStatus(returnTo: string | null, status: 'started' | 'unavailable' | 'failed') {
  const safeReturnTo = returnTo && returnTo.startsWith('/dashboard/signals') ? returnTo : '/dashboard/signals'
  const [path, query = ''] = safeReturnTo.split('?')
  const sp = new URLSearchParams(query)
  sp.set('scan', status)
  const qs = sp.toString()
  return `${path}${qs ? `?${qs}` : ''}`
}

export async function generateSignalOutreach(formData: FormData) {
  const signalId = str(formData, 'signal_id')
  if (!signalId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const [{ data: signal }, { data: profile }] = await Promise.all([
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, outreach_angle, company_id, companies(name)')
      .eq('id', signalId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_profiles')
      .select('full_name, current_title, positioning_summary')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!signal) return

  const co = signal.companies as { name: string }[] | { name: string } | null
  const companyName = (Array.isArray(co) ? co[0] : co)?.name ?? 'this company'
  const candidate = [profile?.full_name, profile?.current_title].filter(Boolean).join(', ')
  const positioning = profile?.positioning_summary ? `\nCandidate positioning: ${profile.positioning_summary}` : ''
  const angle = signal.outreach_angle ? `\nSuggested angle: ${signal.outreach_angle}` : ''

  const prompt = `Write a brief message a senior executive would send to someone they already know at ${companyName}, using a recent company development as the reason to reconnect now.

Signal (reason to reconnect): [${signal.signal_type.replace(/_/g, ' ').toUpperCase()}] ${signal.signal_summary}${angle}
Sender: ${candidate || 'senior executive'}${positioning}

Rules:
- This is a reconnect to someone the sender knows, not a cold introduction to a stranger.
- 2-3 sentences maximum. Do not exceed this.
- Reference the specific signal naturally, not mechanically. It is context, not the pitch.
- No em dashes, no "I hope this finds you well", no "I wanted to reach out", no "touch base"
- Sound like a real person writing to someone they know.
- No greeting or sign-off. Body only.
- Write as the sender in first person.`

  try {
    const msg = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    const body = (msg.content[0] as { type: string; text: string }).text.trim()
    const subject = `${companyName} - ${signal.signal_type.replace(/_/g, ' ')}`

    await supabase
      .from('company_signals')
      .update({ outreach_draft: { subject, body } })
      .eq('id', signalId)
      .eq('user_id', user.id)

    captureServerEvent(user.id, 'signal_outreach_generated', { signal_type: signal.signal_type })
    await logEvent(user.id, 'signal_outreach_generated', { signal_type: signal.signal_type })
  } catch { /* fail silently; user can retry */ }

  revalidatePath('/dashboard/signals')
  revalidatePath('/dashboard')
}

export async function addSignalFollowUp(formData: FormData) {
  const companyName = str(formData, 'company_name')
  const signalSummary = str(formData, 'signal_summary') ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const action = companyName
    ? `Follow up re: ${companyName}${signalSummary ? ': ' + signalSummary.slice(0, 80) : ''}`
    : `Signal follow-up${signalSummary ? ': ' + signalSummary.slice(0, 80) : ''}`

  await supabase.from('follow_ups').insert({
    user_id: user.id,
    action,
    due_date: dueDate,
    status: 'pending',
  })

  revalidatePath('/dashboard/signals')
  revalidatePath('/dashboard')
}

export async function requestSignalRefresh(formData: FormData) {
  const returnTo = str(formData, 'return_to')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workerUrl = process.env.WORKER_URL?.trim()
  const workerSecret = process.env.WORKER_SECRET?.trim()
  if (!workerUrl || !workerSecret) {
    redirect(withScanStatus(returnTo, 'unavailable'))
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, career_page_url')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .limit(MAX_ON_DEMAND_SCAN_COMPANIES)

  const scannableCompanyIds = (companies ?? [])
    .filter((company) => Boolean(company.career_page_url))
    .map((company) => company.id)

  const headers = {
    'Content-Type': 'application/json',
    'x-worker-secret': workerSecret,
  }

  try {
    await Promise.allSettled(scannableCompanyIds.map((companyId) => fetch(`${workerUrl}/trigger-scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ companyId, userId: user.id }),
      cache: 'no-store',
    })))

    const signalRefreshResponse = await fetch(`${workerUrl}/trigger-signals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: user.id }),
      cache: 'no-store',
    })

    if (!signalRefreshResponse.ok) {
      throw new Error(`trigger-signals failed with status ${signalRefreshResponse.status}`)
    }

    await logEvent(user.id, 'signals_scan_requested_on_demand', {
      scannable_company_count: scannableCompanyIds.length,
    })
  } catch {
    redirect(withScanStatus(returnTo, 'failed'))
  }

  revalidatePath('/dashboard/signals')
  redirect(withScanStatus(returnTo, 'started'))
}
