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

function summaryWindow(now: Date) {
  const intervalMs = 4 * 60 * 60 * 1000
  const endMs = Math.floor(now.getTime() / intervalMs) * intervalMs
  const startMs = endMs - intervalMs
  return {
    start: new Date(startMs),
    end: new Date(endMs),
  }
}

function buildSummaryText(input: {
  startIso: string
  endIso: string
  total: number
  activated: number
  trialing: number
  paid: number
}) {
  return [
    '*Manager Tools signup summary (high-volume mode)*',
    `Window: ${input.startIso} -> ${input.endIso}`,
    `New signups: ${input.total}`,
    `Activated (>=1 target company): ${input.activated}`,
    `Trialing: ${input.trialing}`,
    `Paid (non-trial): ${input.paid}`,
  ].join('\n')
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

  if ((recentCount ?? 0) < HIGH_VOLUME_MIN_SIGNUPS) {
    return NextResponse.json({
      ok: true,
      dryRun,
      skipped: true,
      reason: 'below_high_volume_threshold',
      recentTwoHourSignups: recentCount ?? 0,
      threshold: HIGH_VOLUME_MIN_SIGNUPS,
    })
  }

  const { start: windowStart, end: windowEnd } = summaryWindow(now)
  const { data: users, error: usersError } = await sb
    .from('users')
    .select('id, created_at, first_company_added_at, subscription_status, signup_source')
    .eq('signup_source', 'managertools')
    .gte('created_at', windowStart.toISOString())
    .lt('created_at', windowEnd.toISOString())

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const rows = (users ?? []) as Array<{ first_company_added_at: string | null; subscription_status: string | null }>
  const total = rows.length
  const activated = rows.filter((r) => Boolean(r.first_company_added_at)).length
  const trialing = rows.filter((r) => (r.subscription_status ?? 'trialing') === 'trialing').length
  const paid = rows.filter((r) => (r.subscription_status ?? 'trialing') !== 'trialing').length

  if (total === 0) {
    return NextResponse.json({
      ok: true,
      dryRun,
      skipped: true,
      reason: 'no_new_signups_in_summary_window',
      summaryWindowStart: windowStart.toISOString(),
      summaryWindowEnd: windowEnd.toISOString(),
    })
  }

  const summaryText = buildSummaryText({
    startIso: windowStart.toISOString(),
    endIso: windowEnd.toISOString(),
    total,
    activated,
    trialing,
    paid,
  })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      mode: 'summary',
      recentTwoHourSignups: recentCount ?? 0,
      threshold: HIGH_VOLUME_MIN_SIGNUPS,
      summaryWindowStart: windowStart.toISOString(),
      summaryWindowEnd: windowEnd.toISOString(),
      total,
      activated,
      trialing,
      paid,
      wouldSend: true,
      summaryPreview: summaryText,
    })
  }

  const slack = await sendSlackMessage({
    text: summaryText,
  })

  return NextResponse.json({
    ok: true,
    dryRun,
    mode: 'summary',
    recentTwoHourSignups: recentCount ?? 0,
    threshold: HIGH_VOLUME_MIN_SIGNUPS,
    summaryWindowStart: windowStart.toISOString(),
    summaryWindowEnd: windowEnd.toISOString(),
    total,
    activated,
    trialing,
    paid,
    slack,
  })
}
