import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { Badge, Card, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Onboarding QA Scorecard - Admin' }

type ScorecardRow = {
  id: string
  week_start: string
  generated_at: string
  started_users: number
  completed_users: number
  transition_first_completed: number
  median_seconds_to_first_value: number
  under_ten_min_rate: number
  avg_manual_fields_reduction_rate: number
  low_energy_mode_rate: number
  nudge_coverage_rate: number
  channel_mix: Record<string, number>
  persona_mix: Record<string, number>
  notes: string | null
}

function formatMinutes(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A'
  const minutes = (seconds / 60).toFixed(1)
  return `${minutes} min`
}

export default async function OnboardingQaScorecardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) notFound()

  const admin = createAdminClient()
  const { data } = await admin
    .from('onboarding_qa_weekly_scorecards')
    .select('id, week_start, generated_at, started_users, completed_users, transition_first_completed, median_seconds_to_first_value, under_ten_min_rate, avg_manual_fields_reduction_rate, low_energy_mode_rate, nudge_coverage_rate, channel_mix, persona_mix, notes')
    .order('week_start', { ascending: false })
    .limit(12)

  const rows = (data ?? []) as ScorecardRow[]
  const latest = rows[0]

  const latestPass = !!latest
    && latest.under_ten_min_rate >= 70
    && latest.avg_manual_fields_reduction_rate >= 40
    && latest.completed_users >= Math.max(1, Math.floor(latest.started_users * 0.6))

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/metrics" className="text-[13px] font-semibold text-muted-foreground transition-colors">Metrics</Link>
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">Onboarding QA Scorecard</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">Weekly Sprint 6 quality loop for implementation speed, setup defaults, low-energy usage, and completion nudges.</p>
          </div>
          {latest && (
            <Badge variant={latestPass ? 'success' : 'warning'}>
              {latestPass ? 'PASS' : 'ATTENTION'}
            </Badge>
          )}
        </div>

        {latest && (
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">TTFV median</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{formatMinutes(latest.median_seconds_to_first_value)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Under 10 min</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.under_ten_min_rate.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Manual field reduction</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.avg_manual_fields_reduction_rate.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Low-energy adoption</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.low_energy_mode_rate.toFixed(1)}%</p>
            </Card>
          </section>
        )}

        {latest && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold text-foreground mb-3">Channel mix</h2>
              <div className="space-y-2 text-[13px]">
                {Object.keys(latest.channel_mix ?? {}).length === 0 && <p className="text-muted-foreground">No channel mix data in latest run.</p>}
                {Object.entries(latest.channel_mix ?? {}).map(([channel, count], index, arr) => (
                  <div key={channel}>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-muted-foreground">{channel}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                    {index < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-[13px] font-semibold text-foreground mb-3">Persona mix</h2>
              <div className="space-y-2 text-[13px]">
                {Object.keys(latest.persona_mix ?? {}).length === 0 && <p className="text-muted-foreground">No persona data in latest run.</p>}
                {Object.entries(latest.persona_mix ?? {}).map(([persona, count], index, arr) => (
                  <div key={persona}>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-muted-foreground">{persona}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                    {index < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-foreground">Weekly history</h2>
          </div>
          <Table className="text-[13px]">
            <TableHeader className="bg-muted text-muted-foreground">
              <TableRow>
                <TableHead className="px-5 py-2 text-left">Week</TableHead>
                <TableHead className="px-4 py-2 text-right">Started</TableHead>
                <TableHead className="px-4 py-2 text-right">Completed</TableHead>
                <TableHead className="px-4 py-2 text-right">TTFV median</TableHead>
                <TableHead className="px-4 py-2 text-right">Under 10 min %</TableHead>
                <TableHead className="px-4 py-2 text-right">Reduction %</TableHead>
                <TableHead className="px-5 py-2 text-right">Low-energy %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-muted-foreground" colSpan={7}>No weekly scorecards yet. Run the onboarding QA automation endpoint to generate one.</TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 py-2 text-muted-foreground">{row.week_start}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.started_users}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.completed_users}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{formatMinutes(row.median_seconds_to_first_value)}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.under_ten_min_rate.toFixed(1)}%</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.avg_manual_fields_reduction_rate.toFixed(1)}%</TableCell>
                  <TableCell className="px-5 py-2 text-right text-muted-foreground">{row.low_energy_mode_rate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}

