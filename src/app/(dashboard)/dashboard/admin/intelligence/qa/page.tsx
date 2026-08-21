import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { Badge, Card, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Intelligence QA Scorecard - Admin' }

type ScorecardRow = {
  id: string
  week_start: string
  generated_at: string
  sample_size: number
  source_coverage_rate: number
  confidence_coverage_rate: number
  avg_confidence: number
  relevance_avg: number
  suppression_rate: number
  stale_rate: number
  false_positive_proxy_rate: number
  by_channel: Record<string, number>
  by_source_kind: Record<string, number>
  notes: string | null
}

export default async function IntelligenceQaScorecardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!hasAdminHeaderAccess(staff)) notFound()

  const admin = createAdminClient()
  const { data } = await admin
    .from('intelligence_qa_weekly_scorecards')
    .select('id, week_start, generated_at, sample_size, source_coverage_rate, confidence_coverage_rate, avg_confidence, relevance_avg, suppression_rate, stale_rate, false_positive_proxy_rate, by_channel, by_source_kind, notes')
    .order('week_start', { ascending: false })
    .limit(12)

  const rows = (data ?? []) as ScorecardRow[]
  const latest = rows[0]

  const latestPass = !!latest && latest.source_coverage_rate >= 95
    && latest.confidence_coverage_rate >= 95
    && latest.false_positive_proxy_rate <= 8

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/intelligence" className="text-[13px] font-semibold text-muted-foreground transition-colors">Intelligence</Link>
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">Intelligence QA Scorecard</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">Weekly Sprint 5 quality loop for coverage, confidence, ranking relevance, and suppression stability.</p>
          </div>
          {latest && (
            <Badge variant={latestPass ? 'success' : 'warning'}>
              {latestPass ? 'PASS' : 'ATTENTION'}
            </Badge>
          )}
        </div>

        {latest && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Source coverage</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.source_coverage_rate.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Confidence coverage</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.confidence_coverage_rate.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">False-positive proxy</p>
              <p className="text-[24px] font-bold text-foreground mt-1">{latest.false_positive_proxy_rate.toFixed(1)}%</p>
            </Card>
          </section>
        )}

        {latest && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold text-foreground mb-3">Channel coverage matrix</h2>
              <div className="space-y-2 text-[13px]">
                {Object.keys(latest.by_channel ?? {}).length === 0 && <p className="text-muted-foreground">No channel data in latest run.</p>}
                {Object.entries(latest.by_channel ?? {}).map(([channel, count], index, arr) => (
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
              <h2 className="text-[13px] font-semibold text-foreground mb-3">Source connector matrix</h2>
              <div className="space-y-2 text-[13px]">
                {Object.keys(latest.by_source_kind ?? {}).length === 0 && <p className="text-muted-foreground">No source data in latest run.</p>}
                {Object.entries(latest.by_source_kind ?? {}).map(([source, count], index, arr) => (
                  <div key={source}>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-muted-foreground">{source}</span>
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
                <TableHead className="px-4 py-2 text-right">Sample</TableHead>
                <TableHead className="px-4 py-2 text-right">Source %</TableHead>
                <TableHead className="px-4 py-2 text-right">Confidence %</TableHead>
                <TableHead className="px-4 py-2 text-right">Relevance</TableHead>
                <TableHead className="px-4 py-2 text-right">Suppression %</TableHead>
                <TableHead className="px-5 py-2 text-right">FP proxy %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-muted-foreground" colSpan={7}>No weekly scorecards yet. Run the intelligence QA automation endpoint to generate one.</TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 py-2 text-muted-foreground">{row.week_start}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.sample_size}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.source_coverage_rate.toFixed(1)}%</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.confidence_coverage_rate.toFixed(1)}%</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.relevance_avg.toFixed(1)}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-muted-foreground">{row.suppression_rate.toFixed(1)}%</TableCell>
                  <TableCell className="px-5 py-2 text-right text-muted-foreground">{row.false_positive_proxy_rate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}

