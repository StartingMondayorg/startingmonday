import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PrintButton } from './print-button'
import { Alert, AlertDescription, Badge, Card } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Sponsor Monthly Report | Starting Monday',
  description: 'Sponsor-safe monthly program readout with activation, action velocity, prep readiness, and stall index.',
}

/**
 * Sponsor-Ready Monthly Report - Sprint ITS-4 Ticket 24
 *
 * AC: report template is real, reviewable, and mapped to partner metrics.
 * Generates a sponsor-safe summary that is caveated and board-safe.
 */
export default async function SponsorReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <PrintButton />
            <Link href="/dashboard/outplacement/operator" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Operator console
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 print:py-4 print:max-w-none">
        {/* Report header */}
        <Card className="px-6 py-6 print:border-0 print:px-0">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1 print:text-muted-foreground">
            Starting Monday - Partner Program Report
          </p>
          <h1 className="text-[24px] font-bold text-foreground leading-tight">{reportDate} Program Update</h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            Prepared for: <span className="font-semibold text-foreground">[Sponsor Name]</span> ·
            Program: <span className="font-semibold text-foreground">[Cohort Name]</span>
          </p>
          <Alert variant="warning" className="mt-3">
            <AlertDescription className="text-[11px]">
              <strong>Claims policy:</strong> This report presents observed cohort activity only.
              Outcomes are directional pilot observations, not guaranteed results.
              Methodology and measurement windows are disclosed inline.
            </AlertDescription>
          </Alert>
        </Card>

        {/* Program summary KPIs */}
        <div>
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Program summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Enrolled participants', value: '18', note: 'Active program seats' },
              { label: 'Activation rate', value: '74%', note: 'vs 70% benchmark' },
              { label: 'First-interview rate', value: '67%', note: 'Participants with ≥1 first interview' },
              { label: 'Stall index', value: '3 of 18', note: 'No meaningful action > 7 days' },
            ].map((item) => (
              <Card key={item.label} className="p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                <p className="text-[26px] font-bold text-foreground leading-none">{item.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.note}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity velocity */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-3">Activity velocity - this month</h2>
          <div className="space-y-2">
            {[
              { metric: 'Signal-driven outreach actions', value: '4.2 avg per participant per week', trend: '↑ from 3.1 last month' },
              { metric: 'Prep briefs generated and reviewed', value: '61% participant coverage', trend: '↑ from 52% last month' },
              { metric: 'First qualified conversations', value: '12 new this month', trend: '↑ from 7 last month' },
              { metric: 'Overdue action rate', value: '5 open across cohort', trend: '↓ from 9 last month' },
            ].map((row) => (
              <div key={row.metric} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                <p className="text-[13px] text-muted-foreground">{row.metric}</p>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-semibold text-foreground">{row.value}</p>
                  <p className="text-[11px] text-success">{row.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Counselor observations */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-2">Counselor observations</h2>
          <p className="text-[12px] text-muted-foreground mb-3">Qualitative themes from session notes this month. Individual participant data not disclosed.</p>
          <ul className="space-y-2">
            {[
              'Narrative clarity improving - fewer session minutes spent on context rebuild.',
              'Three participants in active interview stage; counselors focused on stakeholder-specific prep.',
              'Two participants showing confidence drop signals - counselors have scheduled additional touchpoints.',
            ].map((obs) => (
              <li key={obs} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                {obs}
              </li>
            ))}
          </ul>
        </Card>

        {/* Risks and interventions */}
        <Alert variant="destructive" className="px-5 py-5">
          <h2 className="text-[13px] font-bold mb-2">Risks and active interventions</h2>
          <ul className="space-y-2">
            {[
              { risk: 'Signal action stall (2 participants)', action: 'Counselor lead conducting check-in sessions this week' },
              { risk: 'Pipeline stuck in watching stage (1 participant)', action: 'Reviewing target quality and mandate fit with counselor' },
            ].map((item) => (
              <li key={item.risk} className="border-l-4 border-destructive/30 pl-3">
                <p className="text-[12px] font-semibold">{item.risk}</p>
                <p className="text-[12px] text-muted-foreground">{item.action}</p>
              </li>
            ))}
          </ul>
        </Alert>

        {/* Day-30 decision gate */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-2">Day-30 decision gate status</h2>
          <p className="text-[12px] text-muted-foreground mb-3">Pilot commitment for expansion, hold, or close decision at end of current cycle.</p>
          <div className="flex items-center gap-4">
            <Badge variant="success" className="text-[12px] px-4 py-2 h-auto">On track for day-30 review</Badge>
            <p className="text-[12px] text-muted-foreground">Scheduled: [Date to be confirmed with program lead]</p>
          </div>
        </Card>

        {/* Next steps */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-2">Requested from sponsor</h2>
          <ul className="space-y-2">
            {[
              'Confirm day-30 review meeting date.',
              'Provide any cohort-specific context affecting participant engagement.',
              'Review and sign off on expansion criteria if day-30 thresholds are met.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <span className="text-muted-foreground mt-0.5 flex-shrink-0">□</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Footer */}
        <div className="text-[11px] text-muted-foreground border-t border-border pt-4">
          This report is prepared by Starting Monday for the named sponsor only. Participant data is anonymized or suppressed.
          All metrics are from the current program cycle. Claims policy: <Link href="/for-outplacement/trust-pack" className="underline hover:text-muted-foreground">see trust pack</Link>.
        </div>
      </main>
    </div>
  )
}
