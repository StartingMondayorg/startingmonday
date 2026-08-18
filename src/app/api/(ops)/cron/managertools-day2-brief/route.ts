/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

type CandidateUser = {
  id: string
  email: string | null
  created_at: string | null
  first_company_added_at: string | null
  signup_source: string | null
  subscription_status: string | null
}

function isManagerToolsSource(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'managertools'
}

function buildBriefFromContext(contextPayload: Record<string, any>): string {
  const profile = contextPayload.profile ?? {}
  const companies = Array.isArray(contextPayload.top_companies) ? contextPayload.top_companies : []
  const contacts = Array.isArray(contextPayload.top_contacts) ? contextPayload.top_contacts : []

  const targetTitle = Array.isArray(profile.target_titles) && profile.target_titles.length > 0
    ? profile.target_titles[0]
    : profile.current_title ?? 'next leadership role'

  const topCompany = companies[0]?.name ?? 'your top target company'
  const topContact = contacts[0]?.name ?? 'your strongest connection'

  return [
    `Focus this week on momentum toward ${targetTitle}.`,
    `Start with ${topCompany} and map one concrete outreach move through ${topContact}.`,
    'Primary objective: complete one high-quality outreach sequence and lock one next-step follow-up inside 72 hours.',
  ].join(' ')
}

function buildFallbackBrief(companyName: string | null): string {
  const target = companyName ?? 'your top target company'
  return [
    `Your first brief is ready for ${target}.`,
    'Lead with one concrete business outcome that maps your background to the role.',
    'Ask one sharp question that proves operating depth and advances the conversation.',
  ].join(' ')
}

function hoursSince(timestamp: string | null): number | null {
  if (!timestamp) return null
  const parsed = Date.parse(timestamp)
  if (!Number.isFinite(parsed)) return null
  return (Date.now() - parsed) / (1000 * 60 * 60)
}

async function alreadySent(sb: any, userId: string): Promise<boolean> {
  const { data, error } = await sb
    .from('user_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_name', 'managertools_day2_brief_sent')
    .limit(1)

  if (error) return false
  return Array.isArray(data) && data.length > 0
}

async function markSent(sb: any, userId: string, details: Record<string, unknown>) {
  await sb.from('user_events').insert({
    user_id: userId,
    event_name: 'managertools_day2_brief_sent',
    properties: details,
  })
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry_run') === '1'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
  const sb = createAdminClient() as any

  const launchStart = process.env.MANAGERTOOLS_LAUNCH_START_DATE ?? '2026-06-09'
  const { data: users, error: usersError } = await sb
    .from('users')
    .select('id, email, created_at, first_company_added_at, signup_source, subscription_status')
    .gte('created_at', `${launchStart}T00:00:00Z`)
    .eq('subscription_status', 'trialing')
    .not('first_company_added_at', 'is', null)

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const candidates = (users ?? []).filter((u: CandidateUser) => {
    if (!isManagerToolsSource(u.signup_source)) return false
    const ageHours = hoursSince(u.created_at)
    if (ageHours == null) return false
    return ageHours >= 24 && ageHours <= 72
  })

  let processed = 0
  let sent = 0
  let skipped = 0
  const failures: Array<{ userId: string; reason: string }> = []

  for (const user of candidates as CandidateUser[]) {
    processed += 1

    if (!user.email) {
      skipped += 1
      continue
    }

    const sentBefore = await alreadySent(sb, user.id)
    if (sentBefore) {
      skipped += 1
      continue
    }

    try {
      const { data: firstCompany } = await sb
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const { data: latestSnapshot } = await sb
        .from('onboarding_context_snapshots')
        .select('id, context_payload')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let briefText = buildFallbackBrief(firstCompany?.name ?? null)
      let briefRunId: string | null = null

      if (latestSnapshot?.id) {
        briefText = buildBriefFromContext((latestSnapshot.context_payload ?? {}) as Record<string, any>)

        if (!dryRun) {
          const { data: briefRun, error: briefError } = await sb
            .from('onboarding_brief_runs')
            .insert({
              user_id: user.id,
              context_snapshot_id: latestSnapshot.id,
              status: 'generated',
              brief_text: briefText,
            })
            .select('id')
            .single()

          if (briefError) {
            failures.push({ userId: user.id, reason: `brief_insert_failed: ${briefError.message}` })
            continue
          }

          briefRunId = (briefRun?.id ?? null) as string | null
          await sb
            .from('activation_milestones')
            .upsert({ user_id: user.id, first_brief_at: new Date().toISOString(), status: 'pending' }, { onConflict: 'user_id' })
        }
      }

      if (!dryRun) {
        const companyPath = firstCompany?.id ? `/dashboard/companies/${firstCompany.id}/prep` : '/dashboard/briefing'
        const prepLink = `${appUrl.replace(/\/$/, '')}${companyPath}`
        await sendEmail({
          to: user.email,
          subject: `Your first brief is ready${firstCompany?.name ? ` - ${firstCompany.name}` : ''}`,
          html: `
            <p style="font-family:sans-serif;font-size:14px;color:#0f172a;margin:0 0 12px 0;">Your first brief is ready.</p>
            <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.6;margin:0 0 12px 0;">${briefText}</p>
            <p style="font-family:sans-serif;font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px 0;">Open your brief, tighten the narrative, and run one strong next step today.</p>
            <a href="${prepLink}" style="display:inline-block;background:#f97316;color:#0f172a;font-weight:700;padding:10px 14px;border-radius:6px;text-decoration:none;">Open your brief</a>
            <p style="font-family:sans-serif;font-size:12px;color:#64748b;margin:14px 0 0 0;">Upgrade to Active to unlock full brief generation and campaign workflows.</p>
          `,
        })

        await markSent(sb, user.id, {
          source: 'managertools',
          briefRunId,
          firstCompanyId: firstCompany?.id ?? null,
          sentAt: new Date().toISOString(),
        })
      }

      sent += 1
    } catch (error) {
      failures.push({ userId: user.id, reason: error instanceof Error ? error.message : 'unknown_error' })
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    launchStart,
    candidates: candidates.length,
    processed,
    sent,
    skipped,
    failures,
  })
}
