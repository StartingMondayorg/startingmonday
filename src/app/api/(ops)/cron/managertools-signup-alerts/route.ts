/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/slack'

const THRESHOLD_PER_HOUR = Number(process.env.MANAGERTOOLS_ALERT_THRESHOLD_PER_HOUR ?? '25')
const HIGH_VOLUME_MIN_SIGNUPS = THRESHOLD_PER_HOUR * 2
const WINDOW_DAYS = Number(process.env.MANAGERTOOLS_ALERT_WINDOW_DAYS ?? '10')

function campaignWindow() {
  const start = process.env.MANAGERTOOLS_LAUNCH_START_DATE ?? '2026-06-09'
  const startDate = new Date(`${start}T00:00:00-07:00`)
  const endDate = new Date(startDate.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return { startDate, endDate, start }
}

function getQuarterHourWindow(now: Date) {
  const intervalMs = 15 * 60 * 1000
  const endMs = Math.floor(now.getTime() / intervalMs) * intervalMs
  const startMs = endMs - intervalMs
  return {
    slotStart: new Date(startMs),
    slotEnd: new Date(endMs),
  }
}

function buildSlackLine(user: { email: string | null; created_at: string | null; first_company_added_at: string | null }) {
  const created = user.created_at ? new Date(user.created_at).toISOString() : 'unknown'
  const activated = user.first_company_added_at ? 'yes' : 'no'
  return `New Manager Tools signup - ${user.email ?? 'unknown email'} | activated: ${activated} | created: ${created}`
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  const now = new Date()
  const { startDate, endDate, start } = campaignWindow()
  if (now < startDate || now >= endDate) {
    return NextResponse.json({ ok: true, dryRun, skipped: true, reason: 'outside_campaign_window', windowStart: start, windowEnd: endDate.toISOString() })
  }

  const sb = createAdminClient() as any
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  const { count: recentCount, error: volumeError } = await sb
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('signup_source', 'managertools')
    .gte('created_at', twoHoursAgo)

  if (volumeError) {
    return NextResponse.json({ error: volumeError.message }, { status: 500 })
  }

  if ((recentCount ?? 0) >= HIGH_VOLUME_MIN_SIGNUPS) {
    return NextResponse.json({
      ok: true,
      dryRun,
      mode: 'summary_only',
      recentTwoHourSignups: recentCount ?? 0,
      threshold: HIGH_VOLUME_MIN_SIGNUPS,
      detail: 'high-volume mode active; per-user alerts suppressed',
    })
  }

  const { slotStart, slotEnd } = getQuarterHourWindow(now)
  const { data: newUsers, error: usersError } = await sb
    .from('users')
    .select('id, email, created_at, first_company_added_at, signup_source')
    .eq('signup_source', 'managertools')
    .gte('created_at', slotStart.toISOString())
    .lt('created_at', slotEnd.toISOString())
    .order('created_at', { ascending: true })

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const rows = (newUsers ?? []) as Array<{ email: string | null; created_at: string | null; first_company_added_at: string | null }>
  let sent = 0
  const errors: string[] = []

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      mode: 'per_user',
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
      candidates: rows.length,
      wouldSend: rows.length,
      sampleMessages: rows.slice(0, 3).map((row) => buildSlackLine(row)),
    })
  }

  for (const row of rows) {
    const slack = await sendSlackMessage({ text: buildSlackLine(row) })
    if (slack.ok) sent += 1
    else errors.push(slack.error)
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    mode: 'per_user',
    slotStart: slotStart.toISOString(),
    slotEnd: slotEnd.toISOString(),
    candidates: rows.length,
    sent,
    errors,
  })
}
