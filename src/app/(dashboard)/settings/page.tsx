import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SearchControlsPanel } from '@/app/(dashboard)/settings/_components/SearchControlsPanel'
import { EmailPreferencesPanel } from '@/app/(dashboard)/settings/_components/EmailPreferencesPanel'
import { DashboardActivitySnooze } from '../dashboard/_components/activity-snooze'
import { Button, Card } from '@/components/ui'
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
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-foreground/90">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Card variant="glass" className="mb-6 px-5 py-5 shadow-xl">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary/90 mb-1">Settings</p>
          <h1 className="text-[26px] font-bold leading-tight text-foreground">Your search, on your terms</h1>
          <p className="mt-2 text-[13px] text-foreground">
            Briefing schedule, pause controls, and activity nudges all live here.
          </p>
        </Card>

        <Card variant="glass" className="mb-6 p-5 shadow-xl">
          <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Account</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-foreground">{profile?.full_name ?? 'Unnamed account'}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Briefing email: {user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" render={<Link href="/dashboard/profile" />}>Profile</Button>
              <Button variant="outline" render={<Link href="/settings/billing" />}>Billing</Button>
              <Button variant="outline" render={<Link href="/settings/security" />}>Security</Button>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
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
