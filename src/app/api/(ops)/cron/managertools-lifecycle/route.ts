/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'

type LifecycleUser = {
  id: string
  email: string | null
  created_at: string | null
  trial_ends_at: string | null
  subscription_status: string | null
  signup_source: string | null
  first_company_added_at: string | null
}

type LifecycleEventName =
  | 'managertools_welcome_sent'
  | 'managertools_day7_feedback_sent'
  | 'managertools_day30_conversion_sent'

const LIFECYCLE_EVENT_NAMES: LifecycleEventName[] = [
  'managertools_welcome_sent',
  'managertools_day7_feedback_sent',
  'managertools_day30_conversion_sent',
]

const WINDOW_DAYS = Number(process.env.MANAGERTOOLS_LIFECYCLE_WINDOW_DAYS ?? '45')

function isManagerToolsSource(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'managertools'
}

function campaignWindow() {
  const start = process.env.MANAGERTOOLS_LAUNCH_START_DATE ?? '2026-06-09'
  const startDate = new Date(`${start}T00:00:00-07:00`)
  const endDate = new Date(startDate.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return { startDate, endDate, start }
}

function hoursSince(timestamp: string | null): number | null {
  if (!timestamp) return null
  const parsed = Date.parse(timestamp)
  if (!Number.isFinite(parsed)) return null
  return (Date.now() - parsed) / (1000 * 60 * 60)
}

function daysSince(timestamp: string | null): number | null {
  const hours = hoursSince(timestamp)
  if (hours == null) return null
  return hours / 24
}

function firstNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'there'
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  const token = cleaned.split(' ')[0] || 'there'
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function welcomeHtml(firstName: string): string {
  return `
    <p style="font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.7;margin:0 0 12px 0;">
      Welcome from the Manager Tools community, ${firstName}.
    </p>
    <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.7;margin:0 0 12px 0;">
      You now have a 60-day window to run a disciplined executive search rhythm: target list, signal timing, and prep briefs tied to real opportunities.
    </p>
    <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.7;margin:0 0 16px 0;">
      Start with one target company today and generate your first prep brief. That single action usually creates momentum fast.
    </p>
    <a href="${APP_URL}/dashboard/companies/new" style="display:inline-block;background:#f97316;color:#111827;font-weight:700;padding:10px 14px;border-radius:6px;text-decoration:none;">Add a target company</a>
    <p style="font-family:sans-serif;font-size:12px;color:#64748b;line-height:1.6;margin:16px 0 0 0;">
      We are collecting feedback from this cohort. Reply to this email with what is working and what is not.
    </p>
  `
}

function day7Html(firstName: string): string {
  return `
    <p style="font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.7;margin:0 0 12px 0;">
      One week in, ${firstName}. What are you seeing?
    </p>
    <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.7;margin:0 0 12px 0;">
      Quick pulse check from Rich on the Manager Tools cohort. Three short questions:
    </p>
    <ol style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.8;margin:0 0 16px 18px;padding:0;">
      <li>What has been most useful so far?</li>
      <li>What is missing or slowing you down?</li>
      <li>Would you recommend this to another executive in transition?</li>
    </ol>
    <a href="mailto:rich@startingmonday.app?subject=Manager%20Tools%20cohort%20feedback" style="display:inline-block;background:#0f172a;color:#ffffff;font-weight:700;padding:10px 14px;border-radius:6px;text-decoration:none;">Reply with feedback</a>
  `
}

function day30Html(firstName: string): string {
  return `
    <p style="font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.7;margin:0 0 12px 0;">
      You are halfway through your trial, ${firstName}. Keep your momentum running.
    </p>
    <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.7;margin:0 0 12px 0;">
      Your Manager Tools cohort trial is at the day-30 midpoint of your 60 free days. If the pipeline and brief workflow have been helping, you can lock in continuity now by upgrading to Active.
    </p>
    <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.7;margin:0 0 16px 0;">
      Active is $199/month and keeps your signal history, prep context, and operating cadence intact.
    </p>
    <a href="${APP_URL}/settings/billing" style="display:inline-block;background:#f97316;color:#111827;font-weight:700;padding:10px 14px;border-radius:6px;text-decoration:none;">Upgrade to Active</a>
    <p style="font-family:sans-serif;font-size:12px;color:#64748b;line-height:1.6;margin:16px 0 0 0;">
      Not converting yet? Reply with one reason why, so we can improve the cohort experience.
    </p>
  `
}

function shouldSendWelcome(daysOld: number): boolean {
  return daysOld >= 0 && daysOld <= 2
}

function shouldSendDay7(daysOld: number): boolean {
  return daysOld >= 7 && daysOld <= 10
}

function shouldSendDay30(daysOld: number): boolean {
  return daysOld >= 29 && daysOld <= 34
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  const now = new Date()
  const { startDate, endDate, start } = campaignWindow()
  if (now < startDate || now >= endDate) {
    return NextResponse.json({
      ok: true,
      dryRun,
      skipped: true,
      reason: 'outside_campaign_window',
      windowStart: start,
      windowEnd: endDate.toISOString(),
    })
  }

  const sb = createAdminClient() as any
  const { data: users, error: usersError } = await sb
    .from('users')
    .select('id, email, created_at, trial_ends_at, subscription_status, signup_source, first_company_added_at, drip_unsubscribed_at')
    .eq('signup_source', 'managertools')
    .gte('created_at', `${start}T00:00:00Z`)
    .is('drip_unsubscribed_at', null)

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const cohort = (users ?? []).filter((u: LifecycleUser) => isManagerToolsSource(u.signup_source)) as LifecycleUser[]
  const userIds = cohort.map((u) => u.id)

  let sentWelcome = 0
  let sentDay7 = 0
  let sentDay30 = 0
  let skipped = 0
  const failures: Array<{ userId: string; reason: string }> = []
  const dryRunActions: Array<{ userId: string; action: LifecycleEventName; email: string }> = []

  const sentMap = new Set<string>()
  if (userIds.length > 0) {
    const { data: sentEvents } = await sb
      .from('user_events')
      .select('user_id, event_name')
      .in('user_id', userIds)
      .in('event_name', LIFECYCLE_EVENT_NAMES)

    for (const row of sentEvents ?? []) {
      sentMap.add(`${row.user_id}:${row.event_name}`)
    }
  }

  for (const user of cohort) {
    if (!user.email) {
      skipped += 1
      continue
    }

    const daysOld = daysSince(user.created_at)
    if (daysOld == null) {
      skipped += 1
      continue
    }

    const firstName = firstNameFromEmail(user.email)

    const planned: Array<{ action: LifecycleEventName; subject: string; html: string; allowed: boolean }> = [
      {
        action: 'managertools_welcome_sent',
        subject: 'Welcome from the Manager Tools community',
        html: welcomeHtml(firstName),
        allowed: shouldSendWelcome(daysOld),
      },
      {
        action: 'managertools_day7_feedback_sent',
        subject: 'One week in - what are you seeing?',
        html: day7Html(firstName),
        allowed: shouldSendDay7(daysOld),
      },
      {
        action: 'managertools_day30_conversion_sent',
        subject: 'Halfway through your trial - keep your momentum',
        html: day30Html(firstName),
        allowed: shouldSendDay30(daysOld) && (user.subscription_status ?? 'trialing') === 'trialing',
      },
    ]

    for (const plan of planned) {
      if (!plan.allowed) continue
      if (sentMap.has(`${user.id}:${plan.action}`)) continue

      if (dryRun) {
        dryRunActions.push({ userId: user.id, action: plan.action, email: user.email })
        continue
      }

      const sendResult = await sendEmail({
        to: user.email,
        subject: plan.subject,
        html: plan.html,
      })

      if (sendResult.error) {
        failures.push({ userId: user.id, reason: `${plan.action}: ${sendResult.error.message ?? 'send_failed'}` })
        continue
      }

      await sb.from('user_events').insert({
        user_id: user.id,
        event_name: plan.action,
        properties: {
          source: 'managertools',
          sentAt: new Date().toISOString(),
          subscriptionStatus: user.subscription_status,
          hasCompany: Boolean(user.first_company_added_at),
        },
      })

      if (plan.action === 'managertools_welcome_sent') sentWelcome += 1
      if (plan.action === 'managertools_day7_feedback_sent') sentDay7 += 1
      if (plan.action === 'managertools_day30_conversion_sent') sentDay30 += 1
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    windowStart: start,
    windowEnd: endDate.toISOString(),
    cohortSize: cohort.length,
    sentWelcome,
    sentDay7,
    sentDay30,
    skipped,
    failures,
    dryRunActions: dryRun ? dryRunActions.slice(0, 100) : undefined,
  })
}
