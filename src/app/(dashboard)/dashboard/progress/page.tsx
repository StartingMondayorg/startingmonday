import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui'
import { LogoutButton } from '../logout-button'

export const metadata = { title: 'Progress - Starting Monday' }

type CountResult = { count: number | null }

function safeCount(result: CountResult): number {
  return result.count ?? 0
}

export default async function DashboardProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nowMs = new Date().getTime()
  const since70d = new Date(nowMs - 70 * 24 * 60 * 60 * 1000).toISOString()
  const thisMonday = (() => {
    const date = new Date()
    const day = date.getDay()
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  })()

  const [companies, contacts, briefs, followUps, outreachThisWeek] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('archived_at', null),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('briefs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since70d),
    supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since70d),
    supabase.from('briefs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'outreach').gte('created_at', thisMonday),
  ])

  const metrics = [
    { label: 'Tracked companies', value: safeCount(companies), href: '/dashboard#companies' },
    { label: 'Active contacts', value: safeCount(contacts), href: '/dashboard/contacts' },
    { label: 'Briefs generated in 70 days', value: safeCount(briefs), href: '/dashboard/briefing' },
    { label: 'Follow-ups logged in 70 days', value: safeCount(followUps), href: '/dashboard/calendar' },
    { label: 'Outreach briefs this week', value: safeCount(outreachThisWeek), href: '/dashboard/outreach' },
  ]

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-[13px] font-bold uppercase tracking-[0.16em] text-foreground/90">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/dashboard" className="ml-auto text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <LogoutButton label="Sign out" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">Progress</p>
        <h1 className="mt-2 font-serif text-[30px] font-bold leading-tight text-foreground sm:text-[42px]">
          Search activity and operating health.
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          The primary dashboard stays focused on today. This page keeps the quieter activity and progress signals available when you want to review them.
        </p>

        <section aria-labelledby="progress-metrics-heading" className="mt-8">
          <h2 id="progress-metrics-heading" className="sr-only">Progress metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <Link key={metric.label} href={metric.href} className="group block">
                <Card variant="glass" className="h-full p-5 transition-colors group-hover:border-border">
                  <p className="text-[26px] font-bold text-foreground">{metric.value}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{metric.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}