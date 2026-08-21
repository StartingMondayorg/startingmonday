import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button, Card } from '@/components/ui'
import { OutreachHubClient } from './outreach-hub-client'
import { getStaffMember } from '@/lib/staff'
import { getRecruiterMessagePacks, getRecruiterToolkit } from '@/lib/role-lane-learning'
import {
  buildExecutiveCompanySizeLookup,
  buildExecutiveFitLookup,
  buildStandardizedDraft,
  ClientRow,
  ContactStatusRow,
  combineExecutiveSources,
  executivePersonaFit,
  inferEmailConfidence,
  mergeFirstTouch,
  normalizeFitTier,
  normalizeStatus,
  dedupeOutreachRows,
  followUpSentByEmail,
  prioritizeCuratedRows,
  readOutreachCsv,
  statusByEmail,
} from './outreach-data'

export const metadata = {
  title: 'Outreach Hub - Starting Monday',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeEmail(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase()
}

export default async function OutreachHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const buildVersion = (process.env.RAILWAY_GIT_COMMIT_SHA
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? process.env.NEXT_PUBLIC_BUILD_SHA
    ?? 'local').slice(0, 8)
  const staff = await getStaffMember(user.email ?? '')
  // Outreach Hub is a staff-only operations surface. Regular users can still
  // reach this URL from shared links, so send them to their contacts workflow
  // instead of rendering a dead-end 404.
  if (!staff) redirect('/dashboard/contacts')

  const { data: roleProfile } = await supabase
    .from('user_profiles')
    .select('role_family, role_title')
    .eq('user_id', user.id)
    .single()

  const roleFamily = (roleProfile?.role_family as 'leadership' | 'technical_leadership' | 'delivery_leadership' | null | undefined) ?? null
  const roleTitle = (roleProfile?.role_title as
    | 'manager'
    | 'senior_manager'
    | 'director'
    | 'senior_director'
    | 'avp'
    | 'vp'
    | 'executive'
    | 'technical_lead'
    | 'senior_technical_lead'
    | 'principal'
    | 'senior_principal'
    | 'architect'
    | 'senior_architect'
    | 'project_manager'
    | 'senior_project_manager'
    | 'program_manager'
    | 'senior_program_manager'
    | 'tpm'
    | 'senior_tpm'
    | null
    | undefined) ?? null
  const recruiterToolkit = getRecruiterToolkit(roleFamily, roleTitle)
  const recruiterMessagePacks = getRecruiterMessagePacks(roleFamily, roleTitle)

  const [executiveRaw, executiveStrict100, executiveStrict50, executiveStrict31, executiveStrict21, executiveBatch1, executiveBatch1Strict, executiveBatch2Strict, executiveBatch3Personalized, executiveBatch4Personalized, providerSendReady, providerFollowups, executiveTargetSlate, firstTouch, searchFirmRaw, coachRaw, outplacementRaw, searchFirmCurated, coachCurated, day1CoachTargetList, rawContactStatuses, rawLiveSentLogs] = await Promise.all([
    readOutreachCsv('executives_prospecting_midmarket_strong_medium.csv'),
    readOutreachCsv('prospecting_combined_strict_100.csv'),
    readOutreachCsv('prospecting_combined_strict_50_personalized.csv'),
    readOutreachCsv('prospecting_combined_strict_31_personalized.csv'),
    readOutreachCsv('prospecting_combined_strict_21_personalized.csv'),
    readOutreachCsv('prospecting_batch_001.csv'),
    readOutreachCsv('prospecting_batch_001_strict_roles.csv'),
    readOutreachCsv('prospecting_batch_002_strict_roles.csv'),
    readOutreachCsv('prospecting_batch_003_personalized_real_10.csv'),
    readOutreachCsv('prospecting_batch_004_personalized_real_19.csv'),
    readOutreachCsv('provider_priority_send_ready.csv'),
    readOutreachCsv('provider_priority_followups.csv'),
    readOutreachCsv('us-senior-executive-target-slate.csv'),
    readOutreachCsv('send_ready_emails_first_10.csv'),
    readOutreachCsv('search_firms_prospecting_100.csv'),
    readOutreachCsv('coaches_prospecting_100.csv'),
    readOutreachCsv('outplacement_firms_prospecting_100.csv'),
    readOutreachCsv('search_firms_prospecting_curated_top25.csv'),
    readOutreachCsv('coaches_prospecting_curated_top25.csv'),
    readOutreachCsv('day1_coach_target_list_60.csv'),
    supabase
      .from('contacts')
      .select('email, outreach_status')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    (supabase as any)
      .from('outreach_logs')
      .select('recipient_email, delivery_status, sent_at, outreach_channel')
      .eq('user_id', user.id)
      .eq('send_mode', 'live')
      .not('recipient_email', 'is', null)
      .not('sent_at', 'is', null),
  ])
  const executiveUniverse = combineExecutiveSources([
    executiveRaw,
    executiveStrict100,
    executiveStrict50,
    executiveStrict31,
    executiveStrict21,
    executiveBatch1,
    executiveBatch1Strict,
    executiveBatch2Strict,
    executiveBatch3Personalized,
    executiveBatch4Personalized,
    providerSendReady,
    providerFollowups,
  ])
  const executives = mergeFirstTouch(executiveUniverse, firstTouch)
  const executiveFitLookup = buildExecutiveFitLookup(executiveTargetSlate.rows)
  const executiveCompanySizeLookup = buildExecutiveCompanySizeLookup(executiveTargetSlate.rows)
  const prioritizedSearchFirms = prioritizeCuratedRows(searchFirmRaw, searchFirmCurated)
  const prioritizedCoaches = prioritizeCuratedRows(coachRaw, coachCurated)
  const sentLiveRows = (rawLiveSentLogs?.data ?? []) as Array<{ recipient_email: string | null; delivery_status: string | null; sent_at: string | null; outreach_channel: string | null }>
  const sentLiveEmails = new Set(
    sentLiveRows
      .filter((row) => row.delivery_status !== 'send_failed' && !!row.sent_at)
      .map((row) => normalizeEmail(row.recipient_email)),
  )
  const sentCoachEmails = new Set(
    sentLiveRows
      .filter((row) => row.outreach_channel === 'coaches' && row.delivery_status !== 'send_failed' && !!row.sent_at)
      .map((row) => normalizeEmail(row.recipient_email)),
  )

  const day1CoachRows: ClientRow[] = day1CoachTargetList.rows.reduce<ClientRow[]>((acc, row) => {
    const fullName = (row.full_name ?? '').trim()
    const email = (row.email ?? '').trim().toLowerCase()
    if (!fullName || !email) return acc

    const coachRole = (row.title ?? '').trim() || 'Executive Coach'
    const coachFocus = (row.persona ?? '').trim() || 'Executive transitions'
    const draft = buildStandardizedDraft(
      {
        ...row,
        role_bucket: coachRole,
        persona_focus: coachFocus,
      },
      'coaches',
      { forceTemplate: true },
    )

    acc.push({
      fullName,
      roleBucket: row.title ?? 'Executive Coach',
      company: row.company ?? '',
      email,
      emailConfidence: inferEmailConfidence(row),
      status: normalizeStatus(row.status),
      followUpSent: false,
      hasLiveOutreach: false,
      emailOpening: row.email_opening ?? '',
      emailBodyCore: draft.body,
      defaultSubject: draft.subject,
      defaultBody: draft.body,
      outreachChannel: 'coaches' as const,
      fitTier: 'strong',
      personaFocus: 'Executive transition coaches in the Day 1 sprint target batch',
      campaignTag: 'coach_day1_60' as const,
    })

    return acc
  }, [])

  const mappedStatuses = statusByEmail((rawContactStatuses.data ?? []) as ContactStatusRow[])
  const mappedFollowUpSent = followUpSentByEmail((rawContactStatuses.data ?? []) as ContactStatusRow[])
  const executivePersonaRows: ClientRow[] = executives.rows
    .map((row): ClientRow | null => {
      const personaFit = executivePersonaFit(row, executiveFitLookup, executiveCompanySizeLookup)
      if (!personaFit) return null
      const standardizedDraft = buildStandardizedDraft(row, 'executives', { forceTemplate: true })

      return {
        fullName: row.full_name ?? '',
        roleBucket: row.role_bucket ?? 'Executive',
        company: row.company ?? '',
        email: (row.email_guess ?? row.email ?? '').trim().toLowerCase(),
        emailConfidence: inferEmailConfidence(row),
        status: normalizeStatus(row.status),
        followUpSent: false,
        hasLiveOutreach: false,
        emailOpening: row.email_opening ?? '',
        emailBodyCore: row.email_body_core ?? '',
        defaultSubject: standardizedDraft.subject,
        defaultBody: standardizedDraft.body,
        outreachChannel: 'executives' as const,
        fitTier: personaFit,
        personaFocus: row.persona_focus ?? row.role_bucket ?? 'C-suite transitions',
      }
    })
    .filter((row): row is ClientRow => row !== null)

  const allRows: ClientRow[] = [
    ...executivePersonaRows,
    ...prioritizedSearchFirms.rows.map((row) => ({
      ...(() => {
        const draft = buildStandardizedDraft(row, 'search_firms', { forceTemplate: true })
        return {
          defaultSubject: draft.subject,
          defaultBody: draft.body,
        }
      })(),
      fullName: row.full_name ?? '',
      roleBucket: row.role_bucket ?? 'Partner',
      company: row.company ?? '',
      email: (row.email_guess ?? row.email ?? '').trim().toLowerCase(),
      emailConfidence: inferEmailConfidence(row),
      status: normalizeStatus(row.status),
      followUpSent: false,
      hasLiveOutreach: false,
      emailOpening: row.email_opening ?? '',
      emailBodyCore: row.email_body_core ?? '',
      outreachChannel: 'search_firms' as const,
      fitTier: normalizeFitTier(row.fit_tier),
      personaFocus: row.persona_focus ?? 'CFO, COO, CIO, CHRO, CRO searches',
    })),
    ...day1CoachRows,
    ...prioritizedCoaches.rows.map((row) => ({
      ...(() => {
        const draft = buildStandardizedDraft(row, 'coaches', { forceTemplate: true })
        return {
          defaultSubject: draft.subject,
          defaultBody: draft.body,
        }
      })(),
      fullName: row.full_name ?? '',
      roleBucket: row.role_bucket ?? 'Executive Coach',
      company: row.company ?? '',
      email: (row.email_guess ?? row.email ?? '').trim().toLowerCase(),
      emailConfidence: inferEmailConfidence(row),
      status: normalizeStatus(row.status),
      followUpSent: false,
      hasLiveOutreach: false,
      emailOpening: row.email_opening ?? '',
      emailBodyCore: row.email_body_core ?? '',
      outreachChannel: 'coaches' as const,
      fitTier: normalizeFitTier(row.fit_tier),
      personaFocus: row.persona_focus ?? 'CIO, CTO, CISO, COO, CFO transitions',
      campaignTag: undefined,
    })),
    ...outplacementRaw.rows.map((row) => ({
      ...(() => {
        const draft = buildStandardizedDraft(row, 'outplacement_firms', { forceTemplate: true })
        return {
          defaultSubject: draft.subject,
          defaultBody: draft.body,
        }
      })(),
      fullName: row.full_name ?? '',
      roleBucket: row.role_bucket ?? 'Outplacement Partner',
      company: row.company ?? '',
      email: (row.email_guess ?? row.email ?? '').trim().toLowerCase(),
      emailConfidence: inferEmailConfidence(row),
      status: normalizeStatus(row.status),
      followUpSent: false,
      hasLiveOutreach: false,
      emailOpening: row.email_opening ?? '',
      emailBodyCore: row.email_body_core ?? '',
      outreachChannel: 'outplacement_firms' as const,
      fitTier: normalizeFitTier(row.fit_tier),
      personaFocus: row.persona_focus ?? 'Executive transition and career mobility programs',
      campaignTag: undefined,
    })),
  ].filter(row => !!row.fullName && !!row.email)

  const normalizedRows = allRows.map((row) => {
    const dbStatus = mappedStatuses.get(row.email)
    const status = sentCoachEmails.has(row.email) && (dbStatus ?? row.status) === 'prospect'
      ? 'reached_out'
      : (dbStatus ?? row.status)

    return {
      ...row,
      status,
      followUpSent: mappedFollowUpSent.has(row.email),
      hasLiveOutreach: sentLiveEmails.has(row.email),
    }
  })

  const clientRows = dedupeOutreachRows(normalizedRows)
  const executiveCount = clientRows.filter(r => r.outreachChannel === 'executives').length
  const searchFirmCount = clientRows.filter(r => r.outreachChannel === 'search_firms').length
  const coachCount = clientRows.filter(r => r.outreachChannel === 'coaches').length
  const day1CoachCount = clientRows.filter(r => r.campaignTag === 'coach_day1_60').length
  const outplacementCount = clientRows.filter(r => r.outreachChannel === 'outplacement_firms').length
  const strongCount = clientRows.filter(r => r.fitTier === 'strong').length
  const mediumCount = clientRows.filter(r => r.fitTier === 'medium').length

  const fromAddressLabel = 'Richard Rothschild <richard@startingmonday.app>'

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Button
            variant="outline"
            render={<Link href="/dashboard" />}
            className="min-h-[44px] border-border text-[13px] text-muted-foreground hover:text-primary-foreground"
          >
            ← Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-10 space-y-6">
<div>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Outreach Hub</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Run one high-quality outreach block: choose a lane, send deliberate notes, and keep follow-through visible.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" render={<Link href="/dashboard/admin/social#content-checker" />}>
              Content Checker
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard#start-here" />}>
              Back to Start Here
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/plan" />}>
              Open weekly plan
            </Button>
          </div>
        </div>

        <section id="outreach-snapshot" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Total Prospects</p>
            <p className="text-[24px] font-bold text-foreground">{clientRows.length}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Deduped across all channels</p>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">By Channel</p>
            <p className="text-[13px] font-semibold text-foreground mt-1">Executives: {executiveCount}</p>
            <p className="text-[13px] font-semibold text-foreground">Search Firms: {searchFirmCount}</p>
            <p className="text-[13px] font-semibold text-foreground">Coaches: {coachCount}</p>
            <p className="text-[13px] font-semibold text-foreground">Outplacement Firms: {outplacementCount}</p>
            <p className="text-[13px] text-primary font-semibold mt-2">Day 1 Coach Sprint List: {day1CoachCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Fit Priority</p>
            <p className="text-[13px] font-semibold text-foreground mt-1">Strong fit: {strongCount}</p>
            <p className="text-[13px] font-semibold text-foreground">Medium fit: {mediumCount}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Strong-fit rows should be worked first</p>
          </Card>
        </section>

        <Card className="p-5 border-primary/30">
          <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-primary mb-2">New Section: Day 1 Coach Sprint</p>
          <h2 className="text-[18px] font-bold text-foreground leading-tight">Run the 60-target coach list with prefilled outreach drafts</h2>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-3xl">
            Use the <span className="font-semibold text-foreground">Day 1 Coach List (60)</span> button in the outreach workbench channel bar.
            It filters to the Day 1 targets and preloads each contact with the Day 1 sprint email copy from the coach traction plan.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button render={<a href="#outreach-workbench" />}>
              Open Outreach Workbench
            </Button>
            <Button variant="outline" render={<a href="#outreach-cadence" />}>
              View Cadence Checklist
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Role-family recruiter toolkit</p>
          <h2 className="text-[18px] font-bold text-foreground leading-tight">{recruiterToolkit.lane}</h2>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-3xl">
            Ship role-specific recruiter and hiring-manager messaging packs with a strict cadence that prioritizes quality over volume.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {recruiterMessagePacks.map((pack) => (
              <Card key={pack.audience} variant="default" className="p-4 bg-muted">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">
                  {pack.audience === 'recruiter' ? 'Recruiter pack' : 'Hiring manager pack'}
                </p>
                <p className="text-[13px] font-semibold text-foreground mb-1">Subject: {pack.subject}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">{pack.opening}</p>
                <ul className="space-y-1">
                  {pack.proofPoints.map((point) => (
                    <li key={point} className="text-[12px] text-muted-foreground">- {point}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-4 rounded border border-border bg-muted px-4 py-3">
            <p className="text-[12px] font-semibold text-foreground mb-1">Cadence guide</p>
            <ol className="list-decimal ml-4 space-y-1 text-[12px] text-muted-foreground">
              {recruiterToolkit.cadence.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button render={<a href="#outreach-workbench" />}>
              Open Workbench with pack guidance
            </Button>
            <Button variant="outline" render={<a href="#outreach-cadence" />}>
              Review cadence checklist
            </Button>
          </div>
        </Card>

        <section id="outreach-workbench">
          <h2 className="sr-only">Outreach workbench</h2>
          <OutreachHubClient rows={clientRows} fromAddressLabel={fromAddressLabel} buildVersion={buildVersion} />
        </section>

        <Card className="overflow-hidden" id="outreach-cadence">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-[16px] font-bold text-foreground">Operating Cadence</h2>
              <p className="text-[13px] text-muted-foreground">Run this every week to keep outbound moving.</p>
            </div>
            <Button render={<a href="/calendar/starting-monday-outreach-reminders.ics" download />}>
              Download Reminder Calendar
            </Button>
          </div>
          <ol className="px-5 py-4 text-[13px] text-muted-foreground list-decimal ml-5 space-y-2">
            <li>Monday: send first-touch notes to your active batch.</li>
            <li>Wednesday: send follow-up 1 for non-responders (day 3).</li>
            <li>Friday: send follow-up 2 for non-responders (day 7).</li>
            <li>Friday: review replies, meetings booked, and next-week list.</li>
          </ol>
        </Card>

        <section id="outreach-links" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/calendar">
            <Card className="p-5 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground mb-1">In-App Calendar</p>
              <p className="text-[13px] text-muted-foreground">Manage date-based follow-ups alongside the outreach routine.</p>
            </Card>
          </Link>
          <Link href="/dashboard/contacts">
            <Card className="p-5 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground mb-1">Contacts</p>
              <p className="text-[13px] text-muted-foreground">Update statuses: first sent, follow-up sent, replied, meeting booked.</p>
            </Card>
          </Link>
        </section>
      </main>
    </div>
  )
}

