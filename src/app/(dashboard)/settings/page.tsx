import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SearchControlsPanel } from '@/app/(dashboard)/settings/_components/SearchControlsPanel'
import { EmailPreferencesPanel } from '@/app/(dashboard)/settings/_components/EmailPreferencesPanel'
import { DashboardActivitySnooze } from '../dashboard/_components/activity-snooze'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, briefing_time, briefing_frequency')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('users')
      .select('subscription_status, drip_unsubscribed_at')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-white/90">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] font-semibold text-slate-300 hover:text-white transition-colors">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Card variant="glass" className="mb-6 px-5 py-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-1">Settings</p>
          <h1 className="text-[26px] font-bold leading-tight text-white">Your search, on your terms</h1>
          <p className="mt-2 text-[13px] text-slate-200">
            Briefing schedule, pause controls, and activity nudges all live here.
          </p>
        </Card>

        <Card variant="glass" className="mb-6 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Account</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-white">{profile?.full_name ?? 'Unnamed account'}</p>
              <p className="text-[13px] text-slate-300 mt-0.5">Briefing email: {user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" render={<Link href="/dashboard/profile" />}>Profile</Button>
              <Button variant="outline" render={<Link href="/settings/billing" />}>Billing</Button>
              <Button variant="outline" render={<Link href="/settings/security" />}>Security</Button>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-slate-400">
            To change the email address briefings are sent to, update your login email under Security.
          </p>
        </Card>

        <SearchControlsPanel
          initialFrequency={profile?.briefing_frequency === 'weekly' ? 'weekly' : 'daily'}
          initialBriefingTime={profile?.briefing_time ?? null}
          isPaused={userRow?.subscription_status === 'paused'}
        />

        <EmailPreferencesPanel initialEnabled={!userRow?.drip_unsubscribed_at} />

        <DashboardActivitySnooze />
      </main>
    </div>
  )
}
