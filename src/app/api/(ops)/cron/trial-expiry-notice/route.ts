import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/email'
import { sendSlackDM } from '@/lib/slack'
import {
  TRIAL_EXPIRY_FROM,
  TRIAL_EXPIRY_REPLY_TO,
  buildTrialExpiryEmail,
} from '@/lib/email/trial-expiry-email'

const MS_PER_DAY = 86_400_000

// Day 20 of a 30-day trial is the day 10 days of trial remain. Anchoring on
// trial_ends_at rather than a start date keeps this correct when a trial is
// extended. The window is exactly one day wide and the job runs once a day, so
// each trial falls inside it on exactly one run.
const WINDOW_START_DAYS = 9
const WINDOW_END_DAYS = 10

export const NUDGE_TYPE = 'trial_expiry_10d'

// The re-engagement cron mails inactive trial users from the same log table. A
// user who is both inactive and at trial day 20 would otherwise get two emails
// in the same window, and the re-engagement copy already names the trial end
// date. Suppress this notice if any nudge reached them very recently.
const RECENT_NUDGE_QUIET_DAYS = 3

type TrialUser = {
  id: string
  email: string
  trial_ends_at: string | null
}

// This is outbound customer email, and SMK-465 left us without a usable staging
// Supabase to rehearse against. Sending stays off until TRIAL_EXPIRY_NOTICE_ENABLED
// is set to 'true', so the job can be dispatched against production to report
// exactly who would be emailed before a single message goes out. ?dryRun=1 forces
// the same reporting mode even once sending is live.
function isSendEnabled(): boolean {
  return process.env.TRIAL_EXPIRY_NOTICE_ENABLED === 'true'
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dryRun = !isSendEnabled() || request.nextUrl.searchParams.get('dryRun') === '1'
  const admin = createAdminClient()
  const now = Date.now()
  const windowStart = new Date(now + WINDOW_START_DAYS * MS_PER_DAY).toISOString()
  const windowEnd = new Date(now + WINDOW_END_DAYS * MS_PER_DAY).toISOString()

  const { data: trialUsers, error: usersErr } = await admin
    .from('users')
    .select('id, email, trial_ends_at')
    .eq('subscription_status', 'trialing')
    .is('drip_unsubscribed_at', null)
    .gte('trial_ends_at', windowStart)
    .lt('trial_ends_at', windowEnd)

  if (usersErr) {
    await alertFailure(`trial expiry notice: user query failed -- ${usersErr.message}`)
    return NextResponse.json({ error: usersErr.message }, { status: 500 })
  }

  const users = (trialUsers ?? []) as TrialUser[]
  if (!users.length) return NextResponse.json({ dryRun, sent: 0, skipped: 0, errors: [] })

  const userIds = users.map(u => u.id)

  // inactivity_nudge_logs is not in the generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  const quietSince = new Date(now - RECENT_NUDGE_QUIET_DAYS * MS_PER_DAY).toISOString()

  const [{ data: profiles }, { data: alreadySent }, { data: recentNudges }] = await Promise.all([
    admin.from('user_profiles').select('user_id, full_name').in('user_id', userIds),
    adminAny
      .from('inactivity_nudge_logs')
      .select('user_id')
      .eq('nudge_type', NUDGE_TYPE)
      .in('user_id', userIds),
    adminAny
      .from('inactivity_nudge_logs')
      .select('user_id')
      .in('user_id', userIds)
      .gte('sent_at', quietSince),
  ])

  const nameByUser: Record<string, string> = {}
  for (const p of profiles ?? []) {
    if (p.full_name) nameByUser[p.user_id] = p.full_name.split(' ')[0]
  }

  const notified = new Set(((alreadySent ?? []) as Array<{ user_id: string }>).map(r => r.user_id))
  const recentlyNudged = new Set(
    ((recentNudges ?? []) as Array<{ user_id: string }>).map(r => r.user_id),
  )

  let sent = 0
  let skipped = 0
  const errors: string[] = []
  const wouldSend: string[] = []

  for (const user of users) {
    if (!user.trial_ends_at) {
      skipped++
      continue
    }

    // Exactly-once guard. The window already covers each trial on one run; this
    // also protects manual workflow_dispatch runs and retries.
    if (notified.has(user.id) || recentlyNudged.has(user.id)) {
      skipped++
      continue
    }

    if (dryRun) {
      wouldSend.push(user.email)
      continue
    }

    const firstName = nameByUser[user.id] ?? user.email.split('@')[0]
    const { subject, html } = buildTrialExpiryEmail({
      firstName,
      trialEndsAt: user.trial_ends_at,
      userId: user.id,
    })

    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      from: TRIAL_EXPIRY_FROM,
      replyTo: TRIAL_EXPIRY_REPLY_TO,
      channel: 'general',
      category: 'lifecycle',
    })

    if (result.error) {
      errors.push(`${user.email}: ${(result.error as { message?: string }).message ?? 'send failed'}`)
      continue
    }

    // Policy suppression is not a failure and must not be logged as a send,
    // otherwise the user is permanently marked notified without being emailed.
    if ('suppressed' in result && result.suppressed) {
      skipped++
      continue
    }

    await adminAny.from('inactivity_nudge_logs').insert({
      user_id: user.id,
      nudge_type: NUDGE_TYPE,
      details: {
        trial_ends_at: user.trial_ends_at,
        days_left_on_trial: Math.round((new Date(user.trial_ends_at).getTime() - now) / MS_PER_DAY),
      },
    })
    sent++
  }

  if (errors.length) {
    await alertFailure(
      `Trial expiry notice: ${errors.length} of ${users.length} sends failed.\n${errors.slice(0, 10).join('\n')}`,
    )
  }

  if (dryRun) {
    return NextResponse.json({ dryRun: true, wouldSend, sent: 0, skipped, errors })
  }

  return NextResponse.json({ dryRun: false, sent, skipped, errors })
}

async function alertFailure(text: string) {
  try {
    await sendSlackDM({ text })
  } catch {
    // Alerting must never take the job down.
  }
}
