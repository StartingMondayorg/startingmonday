import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarItemClient } from './calendar-item'
import { LogoutButton } from '../logout-button'
import { Button, Card } from '@/components/ui'
export const metadata = { title: 'Calendar' }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay() // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatHeader(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

function formatMonthYear(mondayStr: string, sundayStr: string): string {
  const m = new Date(mondayStr + 'T00:00:00Z')
  const s = new Date(sundayStr + 'T00:00:00Z')
  const mLabel = m.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const sLabel = s.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return mLabel === sLabel ? mLabel : `${m.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} – ${sLabel}`
}

type FollowUp = {
  id: string
  action: string
  due_date: string
  google_event_url: string | null
  company_id: string | null
  contact_id: string | null
  companies: { id: string; name: string } | null
  contacts: { id: string; name: string } | null
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('briefing_timezone')
    .eq('user_id', user.id)
    .single()

  const tz = profile?.briefing_timezone ?? 'UTC'
  const nowInTz = new Date().toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
  const todayISO = nowInTz

  const monday = mondayOf(week ?? todayISO)
  const sunday = addDays(monday, 6)
  const prevMonday = addDays(monday, -7)
  const nextMonday = addDays(monday, 7)

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const [{ data: rawFollowUps }, { data: overdueRaw }] = await Promise.all([
    supabase
      .from('follow_ups')
      .select('id, action, due_date, google_event_url, company_id, contact_id, companies(id, name), contacts(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('due_date', monday)
      .lte('due_date', sunday)
      .order('due_date', { ascending: true }),
    supabase
      .from('follow_ups')
      .select('id, action, due_date, google_event_url, company_id, contact_id, companies(id, name), contacts(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('due_date', monday)
      .order('due_date', { ascending: true })
      .limit(20),
  ])

  const followUps = (rawFollowUps ?? []) as unknown as FollowUp[]
  const overdue   = (overdueRaw   ?? []) as unknown as FollowUp[]

  const byDate: Record<string, FollowUp[]> = {}
  for (const fu of followUps) {
    if (!byDate[fu.due_date]) byDate[fu.due_date] = []
    byDate[fu.due_date].push(fu)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="min-h-[44px] border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
{/* Header + week nav */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">Calendar</h1>
            <p className="text-[13px] text-muted-foreground mt-1">{formatMonthYear(monday, sunday)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-border bg-muted/40 text-[12px] font-semibold text-foreground hover:bg-muted/60"
              render={<Link href={`/dashboard/calendar?week=${prevMonday}`} />}
            >
              &larr; Prev
            </Button>
            <Button
              className="text-[12px] font-semibold text-foreground"
              render={<Link href={`/dashboard/calendar?week=${mondayOf(todayISO)}`} />}
            >
              Today
            </Button>
            <Button
              variant="outline"
              className="border-border bg-muted/40 text-[12px] font-semibold text-foreground hover:bg-muted/60"
              render={<Link href={`/dashboard/calendar?week=${nextMonday}`} />}
            >
              Next &rarr;
            </Button>
          </div>
        </div>

        {/* Overdue section */}
        {overdue.length > 0 && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 overflow-hidden shadow-xl backdrop-blur-md">
            <div className="px-5 py-3 border-b border-destructive/20 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-destructive">
                Overdue
              </span>
              <span className="text-[12px] font-semibold text-destructive">
                {overdue.length} {overdue.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="divide-y divide-border">
              {overdue.map(fu => (
                <CalendarItemClient
                  key={fu.id}
                  id={fu.id}
                  action={fu.action}
                  dueDate={fu.due_date}
                  googleEventUrl={fu.google_event_url}
                  today={todayISO}
                  overdue
                  label={fu.companies?.name ?? fu.contacts?.name ?? ''}
                />
              ))}
            </div>
          </div>
        )}

        {/* Week grid - desktop */}
        <div className="hidden sm:grid sm:grid-cols-7 gap-3">
          {weekDates.map((date, i) => {
            const items = byDate[date] ?? []
            const isToday = date === todayISO
            const isPast  = date < todayISO
            return (
              <div key={date} className={`rounded-2xl border overflow-hidden shadow-xl backdrop-blur-md ${isToday ? 'border-primary/40 bg-muted/60' : 'border-border bg-muted/40'}`}>
                <div className={`px-3 py-2 border-b ${isToday ? 'border-primary/30 bg-primary/10' : 'border-border bg-background/30'}`}>
                  <div className={`text-[10px] font-bold tracking-[0.1em] uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {DAYS[i]}
                  </div>
                  <div className={`text-[15px] font-bold ${isToday ? 'text-foreground' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {formatHeader(date).split(' ')[1]}
                  </div>
                </div>
                <div className="p-2 min-h-[120px]">
                  {items.length === 0 ? null : (
                    <div className="flex flex-col gap-1.5">
                      {items.map(fu => (
                        <CalendarChip key={fu.id} fu={fu} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Week list - mobile */}
        <div className="sm:hidden flex flex-col gap-4">
          {weekDates.map((date, i) => {
            const items = byDate[date] ?? []
            const isToday = date === todayISO
            const isPast  = date < todayISO
            if (items.length === 0 && isPast) return null
            return (
              <div key={date} className="rounded-2xl border border-border bg-muted/40 overflow-hidden shadow-xl backdrop-blur-md">
                <div className={`px-5 py-3 border-b flex items-center gap-2 ${isToday ? 'border-primary/30 bg-primary/10' : 'border-border bg-background/30'}`}>
                  <span className={`text-[10px] font-bold tracking-[0.12em] uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{DAYS[i]}</span>
                  <span className={`text-[13px] font-semibold ${isToday ? 'text-foreground' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>{formatHeader(date)}</span>
                  {items.length > 0 && (
                    <span className="ml-auto text-[11px] font-semibold text-muted-foreground">{items.length}</span>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="divide-y divide-border">
                    {items.map(fu => (
                      <CalendarItemClient
                        key={fu.id}
                        id={fu.id}
                        action={fu.action}
                        dueDate={fu.due_date}
                        googleEventUrl={fu.google_event_url}
                        today={todayISO}
                        overdue={false}
                        label={fu.companies?.name ?? fu.contacts?.name ?? ''}
                      />
                    ))}
                  </div>
                )}
                {items.length === 0 && (
                  <div className="px-5 py-4 text-[13px] text-muted-foreground">Nothing due.</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {followUps.length === 0 && overdue.length === 0 && (
          <div className="mt-8 text-center py-16 rounded-2xl border border-border bg-muted/40 shadow-xl backdrop-blur-md">
            <p className="text-[14px] text-muted-foreground">No actions scheduled this week.</p>
            <p className="text-[13px] text-muted-foreground mt-2">Add follow-ups from a company or contact to see them here.</p>
          </div>
        )}

      </main>
    </div>
  )
}

function CalendarChip({ fu }: { fu: FollowUp }) {
  const href = fu.companies?.id
    ? `/dashboard/companies/${fu.companies.id}`
    : fu.contacts?.id
      ? `/dashboard/contacts`
      : '#'

  const label = fu.companies?.name ?? fu.contacts?.name ?? ''

  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-background/60 px-2.5 py-2 hover:bg-card transition-colors"
    >
      <p className="text-[11px] font-semibold leading-tight truncate">{fu.action}</p>
      {label && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</p>
      )}
    </Link>
  )
}


