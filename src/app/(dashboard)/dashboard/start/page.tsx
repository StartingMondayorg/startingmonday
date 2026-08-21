import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { getRecruiterToolkit, getRoleLaneTutorials } from '@/lib/role-lane-learning'
import { FirstMileTelemetry } from '@/app/components/FirstMileTelemetry'
import { FirstRunSeenCookie } from './first-run-seen-cookie'
import {
  decisionRoleTargetsForCompany,
  firstNoteDraftForCompany,
  followUpSequenceForWeekOne,
} from '@/app/onboarding/onboarding-helpers'
import { Avatar, AvatarFallback, Button, Card, Progress } from '@/components/ui'
export const metadata = {
  title: 'Get Started',
}

export default async function StartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name, current_title, resume_text, positioning_summary, briefing_time, briefing_timezone, onboarding_completed_at, role_family, role_title')
    .eq('user_id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error(JSON.stringify({ ts: new Date().toISOString(), event: 'start_profile_error', code: profileError.code, message: profileError.message, userId: user.id }))
  } else if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  const [
    { count: companyCount },
    { count: contactCount },
    { count: prepBriefCount },
    { count: followUpCount },
    { data: latestPrepBrief },
    { data: firstCompany },
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('archived_at', null),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('briefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'prep'),
    supabase
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('briefs')
      .select('id, output_text, company_id, created_at')
      .eq('user_id', user.id)
      .eq('type', 'prep')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const hasResume    = (profile?.resume_text?.length ?? 0) >= 200 || (profile?.positioning_summary?.length ?? 0) >= 100
  const hasCompanies = (companyCount ?? 0) >= 1
  const hasPrepBrief = (prepBriefCount ?? 0) >= 1
  const hasContacts  = (contactCount ?? 0) >= 1
  const hasBriefing  = !!profile?.briefing_time
  const hasFollowUp  = (followUpCount ?? 0) >= 1

  const tasks = [
    {
      num: 1,
      done: hasResume,
      title: 'Upload your resume or import LinkedIn',
      body: 'Paste your LinkedIn profile text or upload your resume. This drives every brief, every briefing, and every AI response you get.',
      cta: 'Go to profile',
      href: '/dashboard/profile',
      doneNote: 'Profile complete',
    },
    {
      num: 2,
      done: hasCompanies,
      title: 'Add your first target company',
      body: 'Add the companies you want to work for. Include the career page URL - we\'ll scan it within minutes and alert you when something matching your profile appears.',
      cta: 'Add a company',
      href: '/dashboard/companies/new',
      doneNote: `${companyCount ?? 0} ${(companyCount ?? 0) === 1 ? 'company' : 'companies'} added`,
    },
    {
      num: 3,
      done: hasPrepBrief,
      title: 'Generate your first prep brief',
      body: 'Open a target company and generate the prep brief. It surfaces leadership signals, likely objections, and your best outreach angle - specific to that company and your background.',
      cta: 'Go to companies',
      href: firstCompany?.id ? `/dashboard/companies/${firstCompany.id}/prep` : '/dashboard/companies/new',
      doneNote: 'Prep brief generated',
    },
    {
      num: 4,
      done: hasContacts,
      title: 'Add your first contact',
      body: 'Who do you know at target companies? Who can make a warm introduction? Roles at this level are filled through relationships, not applications.',
      cta: 'Add a contact',
      href: '/dashboard/contacts',
      doneNote: `${contactCount ?? 0} ${(contactCount ?? 0) === 1 ? 'contact' : 'contacts'} added`,
    },
    {
      num: 5,
      done: hasBriefing,
      title: 'Set up your daily briefing',
      body: 'Choose a time and timezone for your morning briefing. Every day: signals from your target companies, actions due, and your momentum score - in your inbox before you start work.',
      cta: 'Configure briefing',
      href: '/dashboard/profile',
      doneNote: 'Briefing configured',
    },
    {
      num: 6,
      done: hasFollowUp,
      title: 'Log your first follow-up reminder',
      body: 'Set a follow-up on a company or contact. The difference between an active search and a passive one is whether the next action is scheduled.',
      cta: 'Go to contacts',
      href: '/dashboard/contacts',
      doneNote: 'Follow-up set',
    },
  ]

  const doneCount = tasks.filter(t => t.done).length
  const allDone = doneCount === tasks.length
  const nextTask = tasks.find((task) => !task.done) ?? null
  const isFirstRunArrival = doneCount <= 2
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const earnedBriefText = latestPrepBrief?.output_text?.trim() ?? ''
  const earnedBriefPreview = earnedBriefText
    ? `${earnedBriefText.slice(0, 220)}${earnedBriefText.length > 220 ? '...' : ''}`
    : null
  const firstCompanyName = firstCompany?.name ?? null
  const weekOnePeople = firstCompanyName
    ? decisionRoleTargetsForCompany(firstCompanyName, 'csuite', profile?.current_title ?? '')
    : []
  const weekOneDraft = firstCompanyName
    ? firstNoteDraftForCompany(firstCompanyName, profile?.current_title ?? '')
    : ''
  const weekOneFollowUps = firstCompanyName ? followUpSequenceForWeekOne(firstCompanyName) : []

  function formatBriefingTime(t: string | null | undefined) {
    if (!t) return null
    const [h, m] = t.split(':').map(Number)
    if (isNaN(h)) return null
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m ?? 0).padStart(2, '0')} ${ampm}`
  }

  const briefingDisplay = formatBriefingTime(profile?.briefing_time)
  const tz = profile?.briefing_timezone ?? null
  const tutorials = getRoleLaneTutorials((profile?.role_family as 'leadership' | 'technical_leadership' | 'delivery_leadership' | null | undefined) ?? null)
  const recruiterToolkit = getRecruiterToolkit(
    (profile?.role_family as 'leadership' | 'technical_leadership' | 'delivery_leadership' | null | undefined) ?? null,
    (profile?.role_title as
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
      | undefined) ?? null,
  )

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">
      <FirstRunSeenCookie />
      {isFirstRunArrival && (
        <FirstMileTelemetry
          eventName="dashboard_first_run_viewed"
          pageName="dashboard_first_run"
          properties={{
            completed_tasks: doneCount,
            total_tasks: tasks.length,
            has_earned_brief: !!earnedBriefPreview,
            has_companies: !!firstCompanyName,
          }}
        />
      )}

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard?focus=main" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Skip to dashboard
            </Link>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
{/* Header */}
        <div className="mb-8">
          {allDone ? (
            <>
              <h1 className="text-[26px] font-bold text-foreground leading-tight mb-2">
                You&rsquo;re set up, {firstName}.
              </h1>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Everything is in place. Head to your dashboard to see what&rsquo;s moving.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[26px] font-bold text-foreground leading-tight mb-2">
                {firstName}, your search is live.
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Focus on one next best action. The list below is your progress tracker, not six things to do right now.
              </p>
            </>
          )}
        </div>

        {isFirstRunArrival && nextTask && (
          <Card variant="glass" className="mb-8 p-5">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-1">Next best action</p>
            <h2 className="text-[20px] font-bold text-foreground leading-tight">Today&rsquo;s one action: {nextTask.title}</h2>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{nextTask.body}</p>
            <Button render={<Link href={nextTask.href} />} className="mt-4">
              {nextTask.cta} &rarr;
            </Button>
          </Card>
        )}

        {(earnedBriefPreview || firstCompanyName) && (
          <Card variant="glass" className="mb-8 p-5">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-1">Value already earned</p>
            {earnedBriefPreview ? (
              <>
                <p className="text-[14px] font-semibold text-foreground">Your latest prep brief is ready.</p>
                <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{earnedBriefPreview}</p>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Your onboarding profile is complete. The next step unlocks your first full prep brief.
              </p>
            )}
          </Card>
        )}

        {isFirstRunArrival && firstCompanyName && (
          <Card variant="glass" className="mb-8 p-5">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-2">Week-one relationship bridge</p>
            <p className="text-[13px] text-muted-foreground mb-3">Seats to map first at {firstCompanyName}</p>
            <div className="space-y-2 mb-3">
              {weekOnePeople.map((seat) => (
                <div key={seat.title} className="rounded border border-border px-3 py-2">
                  <p className="text-[13px] font-semibold text-foreground">{seat.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{seat.why}</p>
                </div>
              ))}
            </div>
            <Link
              href="/prep/relationships"
              className="inline-block mb-4 text-[12px] font-semibold text-primary underline transition-colors"
            >
              Find the actual people in these seats &rarr;
            </Link>
            <p className="text-[12px] font-semibold text-foreground mb-1">First-note draft</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{weekOneDraft}</p>
            <ul className="space-y-1.5">
              {weekOneFollowUps.map((item) => (
                <li key={item} className="text-[12px] text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Next scheduled events */}
        {(briefingDisplay || (companyCount ?? 0) > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {briefingDisplay && (
              <Card variant="glass" className="p-4">
                <p className="text-[13px] font-medium text-muted-foreground mb-1">First briefing</p>
                <p className="text-[16px] font-bold text-foreground">Tomorrow at {briefingDisplay}</p>
                {tz && <p className="text-[13px] text-muted-foreground mt-0.5">{tz}</p>}
              </Card>
            )}
            {(companyCount ?? 0) > 0 && (
              <Card variant="glass" className="p-4">
                <p className="text-[13px] font-medium text-muted-foreground mb-1">Companies watching</p>
                <p className="text-[16px] font-bold text-foreground">{companyCount} {(companyCount ?? 0) === 1 ? 'company' : 'companies'}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Add career page URLs to start scanning</p>
              </Card>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <Progress
            value={(doneCount / tasks.length) * 100}
            className="w-44 shrink-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-muted/60 [&_[data-slot=progress-indicator]]:bg-primary"
          />
          <span className="text-[13px] font-semibold text-muted-foreground shrink-0">
            {doneCount} of {tasks.length} complete
          </span>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-3 mb-8">
          {!allDone && (
            <p className="text-[12px] text-muted-foreground">After you complete today&rsquo;s action, return here for the next one.</p>
          )}
          {tasks.map(task => (
            <Card
              key={task.num}
              variant="glass"
              className={`overflow-hidden ${task.done ? 'opacity-70' : ''}`}
            >
              <div className="px-6 py-5">
                <div className="flex items-start gap-4">
                  {/* Number / check */}
                  <Avatar
                    className={`shrink-0 mt-0.5 text-[13px] font-bold ${
                      task.done ? 'bg-success text-success-foreground' : 'bg-muted/60 text-success-foreground'
                    }`}
                  >
                    <AvatarFallback className="bg-transparent text-inherit">
                      {task.done ? '✓' : task.num}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`text-[15px] font-semibold ${task.done ? 'text-muted-foreground line-through decoration-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      {task.done && (
                        <span className="text-[13px] font-semibold text-success">
                          {task.doneNote}
                        </span>
                      )}
                    </div>
                    {!task.done && (
                      <>
                        <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                          {task.body}
                        </p>
                        <Button render={<Link href={task.href} />}>
                          {task.cta} &rarr;
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 mb-8 grid grid-cols-1 gap-4">
          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-medium text-muted-foreground mb-2">Role lane tutorials</p>
            <p className="text-[13px] text-muted-foreground mb-4">Fast training assets tailored to your current role lane.</p>
            <div className="space-y-3">
              {tutorials.map((asset) => (
                <Link key={asset.title} href={asset.href} className="block rounded border border-border px-3 py-2 transition-colors">
                  <p className="text-[13px] font-semibold text-foreground">{asset.title}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{asset.format.replace('_', ' ')} • {asset.description}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-medium text-muted-foreground mb-2">Recruiter outreach toolkit</p>
            <p className="text-[13px] text-muted-foreground mb-2">{recruiterToolkit.lane}</p>
            <p className="text-[13px] text-muted-foreground mb-3">Use this role-lane toolkit to run targeted recruiter and hiring manager outreach.</p>
            <div className="space-y-3 mb-4">
              {recruiterToolkit.assets.map((asset) => (
                <Link key={asset.title} href={asset.href} className="block rounded border border-border px-3 py-2 transition-colors">
                  <p className="text-[13px] font-semibold text-foreground">{asset.title}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{asset.type.replace('_', ' ')} • {asset.description}</p>
                </Link>
              ))}
            </div>
            <div className="rounded border border-border bg-muted/40 px-3 py-2">
              <p className="text-[13px] font-semibold text-foreground mb-1">Suggested cadence</p>
              <ul className="space-y-1">
                {recruiterToolkit.cadence.map((step) => (
                  <li key={step} className="text-[13px] text-muted-foreground">• {step}</li>
                ))}
              </ul>
            </div>
          </Card>

        </div>

        <div className="text-center">
          <Button render={<Link href="/dashboard" />} size="lg" className="px-8 font-bold">
            {allDone ? 'Go to dashboard ->' : 'Continue to dashboard ->'}
          </Button>
          {!allDone && (
            <p className="text-[12px] text-muted-foreground mt-2">You can finish these any time from your dashboard.</p>
          )}
        </div>

      </main>
    </div>
  )
}
