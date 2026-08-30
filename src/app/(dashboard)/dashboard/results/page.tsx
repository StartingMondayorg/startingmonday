import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Results - Dashboard' }

type CompanyRow = {
  id: string
  stage: string
}

type BriefRow = {
  type: string
  created_at: string
}

type ContactRow = {
  created_at: string
}

type SignalRow = {
  signal_date: string
}

type ProfileRow = {
  full_name: string | null
  search_started_at: string | null
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function safeWeekLabel(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function DashboardResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const nowMs = now.getTime()
  const since14d = new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const since42dIso = new Date(nowMs - 42 * 24 * 60 * 60 * 1000).toISOString()
  const todayIso = now.toISOString().slice(0, 10)

  const [
    { data: profileRaw },
    { data: companiesRaw },
    { data: contactsRaw },
    { data: briefsRaw },
    { data: signalsRaw },
    { count: signals14dCount },
    { count: draftReady14dCount },
    { count: overdueFollowUps },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, search_started_at')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('companies')
      .select('id, stage')
      .eq('user_id', user.id)
      .is('archived_at', null),
    supabase
      .from('contacts')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('created_at', since42dIso),
    supabase
      .from('briefs')
      .select('type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since42dIso),
    supabase
      .from('company_signals')
      .select('signal_date')
      .eq('user_id', user.id)
      .gte('signal_date', since42dIso.slice(0, 10)),
    supabase
      .from('company_signals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('signal_date', since14d),
    supabase
      .from('company_signals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('outreach_draft', 'is', null)
      .gte('signal_date', since14d),
    supabase
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lte('due_date', todayIso),
  ])

  const profile = (profileRaw ?? null) as ProfileRow | null
  const companies = (companiesRaw ?? []) as CompanyRow[]
  const contacts = (contactsRaw ?? []) as ContactRow[]
  const briefs = (briefsRaw ?? []) as BriefRow[]
  const signals = (signalsRaw ?? []) as SignalRow[]

  const totalCompanies = companies.length
  const activePipeline = companies.filter((company) => ['applied', 'interviewing', 'offer'].includes(company.stage)).length
  const prepBriefs42d = briefs.filter((brief) => brief.type === 'prep').length
  const outreachBriefs42d = briefs.filter((brief) => brief.type === 'outreach').length
  const contactAdds42d = contacts.length
  const signals42d = signals.length

  const signals14 = signals14dCount ?? 0
  const draftReady14 = draftReady14dCount ?? 0
  const signalToDraftPct = pct(draftReady14, signals14)
  const contactsPerCompany = totalCompanies > 0 ? (contactAdds42d / totalCompanies).toFixed(1) : '0.0'
  const activePipelinePct = pct(activePipeline, totalCompanies)
  const dueNow = overdueFollowUps ?? 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const daysInMarket = profile?.search_started_at
    ? Math.max(0, Math.floor((nowMs - new Date(profile.search_started_at).getTime()) / 86400000))
    : null

  const weeklyRows = Array.from({ length: 6 }, (_, offset) => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() - (offset * 7))

    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const contactsWeek = contacts.filter((row) => {
      const ts = new Date(row.created_at).getTime()
      return ts >= start.getTime() && ts <= end.getTime()
    }).length

    const briefsWeek = briefs.filter((row) => {
      const ts = new Date(row.created_at).getTime()
      return ts >= start.getTime() && ts <= end.getTime() && row.type === 'outreach'
    }).length

    const signalsWeek = signals.filter((row) => {
      const ts = new Date(`${row.signal_date}T12:00:00Z`).getTime()
      return ts >= start.getTime() && ts <= end.getTime()
    }).length

    return {
      label: safeWeekLabel(start.toISOString()),
      contactsWeek,
      briefsWeek,
      signalsWeek,
    }
  }).reverse()

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-7">
          <h1 className="text-[28px] font-bold text-foreground leading-tight">Results</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Real performance rollup for {firstName}{daysInMarket !== null ? ` · Day ${daysInMarket + 1} of search` : ''}
          </p>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card variant="glass" className="p-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Pipeline active</p>
            <p className="text-[24px] font-bold text-foreground mt-1">{activePipelinePct}%</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Contacts per company</p>
            <p className="text-[24px] font-bold text-foreground mt-1">{contactsPerCompany}</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Signal → draft (14d)</p>
            <p className="text-[24px] font-bold text-foreground mt-1">{signalToDraftPct}%</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Due now</p>
            <p className="text-[24px] font-bold text-foreground mt-1">{dueNow}</p>
          </Card>
        </section>

        <Card variant="glass" className="overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-foreground">42-day production totals</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Companies</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{totalCompanies}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Contact adds</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{contactAdds42d}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Prep briefs</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{prepBriefs42d}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Outreach drafts</p>
              <p className="text-[20px] font-bold text-foreground mt-1">{outreachBriefs42d}</p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-foreground">Weekly trend (last 6 weeks)</h2>
          </div>
          <Table className="text-[13px]">
            <TableHeader className="bg-muted/40 border-b border-border text-muted-foreground">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="px-5 py-2 text-left text-muted-foreground">Week</TableHead>
                <TableHead className="px-4 py-2 text-right text-muted-foreground">Signals</TableHead>
                <TableHead className="px-4 py-2 text-right text-muted-foreground">Contact adds</TableHead>
                <TableHead className="px-5 py-2 text-right text-muted-foreground">Outreach drafts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyRows.map((row) => (
                <TableRow key={row.label} className="border-border hover:bg-muted/40">
                  <TableCell className="px-5 py-2 text-foreground whitespace-normal">{row.label}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.signalsWeek}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.contactsWeek}</TableCell>
                  <TableCell className="px-5 py-2 text-right text-muted-foreground">{row.briefsWeek}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-5 py-3 border-t border-border text-[12px] text-muted-foreground">
            Signals observed: {signals42d} in last 42 days.
          </div>
        </Card>
      </main>
    </div>
  )
}