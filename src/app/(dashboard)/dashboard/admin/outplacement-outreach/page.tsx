import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Outplacement Outreach - Admin',
  description: 'Internal-only outplacement outreach strategy, buyer pains, and approved email sequence.',
  robots: { index: false, follow: false },
}

type FilterSet = {
  title: string
  filters: string[]
}

type OutreachStep = {
  title: string
  action: string
}

type SequenceStep = {
  touch: string
  subject: string
  useWhen: string
}

type MessageTemplate = {
  title: string
  context: string
  subject: string
  body: string[]
}

export default async function OutplacementOutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const filters: FilterSet[] = [
    {
      title: 'Buyer Search Filters',
      filters: [
        'Title: practice leader OR managing director OR career transition OR program operations OR outplacement',
        'Company type: outplacement, career transition, talent mobility, executive transition',
        'Geography: United States',
        'Firm size: prioritize 50+ employees for scale buyers; include boutiques with executive transition focus',
        'Recent signal: posted about layoffs, transition support, leadership development, or career mobility',
        'Skip generic HR consultants unless they clearly own outplacement program design or operations.',
      ],
    },
  ]

  const outreachSteps: OutreachStep[] = [
    {
      title: 'Step 1: Prioritize the real buyer',
      action: 'Target practice leaders, program operations directors, counselor leads, and commercial owners before broad HR generalists.',
    },
    {
      title: 'Step 2: Personalize the trigger',
      action: 'Open with something tied to cohort growth, regional expansion, layoffs, transition volume, or delivery complexity.',
    },
    {
      title: 'Step 3: Lead with operating pain',
      action: 'Talk about cohort inconsistency, counselor context rebuild, coordinator cleanup, and no-custom rollout risk.',
    },
    {
      title: 'Step 4: Offer one concrete asset',
      action: 'Use either the 30-day readiness checklist or the pilot operator pack. Do not ask for a meeting in the first touch.',
    },
  ]

  const sequence: SequenceStep[] = [
    {
      touch: 'Initial',
      subject: 'A shared readiness standard for [Company]',
      useWhen: 'Default first touch when you have a concrete trigger and want the broadest buyer fit.',
    },
    {
      touch: 'Follow-up 1',
      subject: 'A shared readiness standard for [Company] cohorts',
      useWhen: 'Use when the buyer likely feels delivery inconsistency but has not engaged yet.',
    },
    {
      touch: 'Follow-up 2',
      subject: 'A no-custom pilot for [Company] cohorts',
      useWhen: 'Use when rollout friction or founder-dependence is the likely hidden objection.',
    },
    {
      touch: 'Follow-up 3',
      subject: 'Close the loop for [Company] readiness?',
      useWhen: 'Use as a direct yes-or-pass close once the prior two notes have had time to land.',
    },
  ]

  const painPoints = [
    'Cohort consistency breaks across regions, counselors, and participant types.',
    'Counselors lose high-value time rebuilding status instead of coaching strategy.',
    'Weekly execution decays after the early workshop phase.',
    'Program operations teams absorb coordinator cleanup work that should be systemized.',
    'Procurement slows down when claims and data boundaries are not board-safe.',
  ]

  const messageTemplates: MessageTemplate[] = [
    {
      title: 'Email 1 - Shared Standard',
      context: 'Default opener. Best overall blend of pain, proof, and low-friction ask.',
      subject: 'A shared readiness standard for [Company]',
      body: [
        'I saw [trigger], and it looked like the kind of growth point where cohort consistency gets harder to hold.',
        'Counselors end up supporting candidates in different ways, and coordinator cleanup rises when there is no shared standard for interview-ready, role-fit, and compensation-ready.',
        'Starting Monday gives outplacement teams one operating layer for readiness, follow-up, and prep visibility so cohorts stay aligned without adding admin work.',
        'Across early 2026 outplacement cases, teams saw faster early outreach momentum when a shared readiness standard was in place. Directional evidence, not a guarantee.',
        'Reply yes and I will send the 30-day cohort readiness checklist. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 2 - Delivery Drift',
      context: 'First follow-up. Use when the likely pain is uneven weekly execution across the cohort.',
      subject: 'A shared readiness standard for [Company] cohorts',
      body: [
        'Strong workshops do not guarantee consistent weekly execution across a cohort.',
        'That is where counselors end up rebuilding status, chasing follow-through, and cleaning up uneven prep before important conversations.',
        'Starting Monday gives counselors one shared view of actions, follow-ups, and prep readiness so strategy time stays high and coordinator cleanup stays lower.',
        'Across early 2026 outplacement cases, teams saw faster early outreach momentum when a shared readiness standard was in place. Directional evidence, not a guarantee.',
        'Reply yes and I will send the cohort readiness checklist. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 3 - No-Custom Pilot',
      context: 'Second follow-up. Best message for practice leaders and operations buyers.',
      subject: 'A no-custom pilot for [Company] cohorts',
      body: [
        'If the concern is rollout overhead, that is the right concern.',
        'Outplacement teams do not need another tool that depends on custom templates, founder support, or unclear escalation rules.',
        'Starting Monday already has a pilot runbook, counselor enablement script, Friday MBR template, and trust-pack path so a team can test this without inventing a new process.',
        'Directional evidence from early 2026 cases points to faster early outreach momentum, not a guarantee.',
        'Reply yes and I will send the pilot operator pack. Reply pass and I will close the loop.',
      ],
    },
    {
      title: 'Email 4 - Close The Loop',
      context: 'Final follow-up. Use only after the earlier messages have had time to work.',
      subject: 'Close the loop for [Company] readiness?',
      body: [
        'I have not heard back, so I will keep this simple.',
        'Starting Monday is built for teams that care about cohort consistency, counselor yield, and a pilot process procurement can review cleanly.',
        'Across early 2026 outplacement cases, teams saw faster early outreach momentum when a shared readiness standard was in place. Directional evidence, not a guarantee.',
        'If that is not a priority right now, reply pass and I will close the loop. If it is, reply yes and I will send the operator pack and readiness checklist.',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
            ← Admin
          </Link>
          <h1 className="text-[18px] font-bold text-foreground">Outplacement Outreach</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Card variant="default" className="p-6 space-y-4">
          <h2 className="text-[18px] font-bold text-foreground">Channel Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] text-muted-foreground leading-relaxed">
            <div>
              <p className="font-semibold text-foreground mb-1">The Buyer</p>
              <p>Practice leaders, program operations owners, counselor leads, and commercial leaders at outplacement and executive transition firms.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">The Wedge</p>
              <p>Shared readiness standards, lower counselor context rebuild, less coordinator cleanup, and a no-custom pilot path procurement can approve.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Current Council Readout</p>
              <p>All four approved default emails currently score 90 EJES with no blockers in the live email council.</p>
            </div>
          </div>
        </Card>

        <Card variant="default" className="p-6 space-y-4">
          <h2 className="text-[18px] font-bold text-foreground">Top Buyer Pain Points</h2>
          <ul className="space-y-2 text-[13px] text-muted-foreground leading-relaxed">
            {painPoints.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="shrink-0 text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="default" className="p-6 space-y-4">
          <h2 className="text-[18px] font-bold text-foreground">Prospect Search Filters</h2>
          {filters.map((filterSet) => (
            <div key={filterSet.title} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <p className="text-[14px] font-semibold text-foreground mb-3">{filterSet.title}</p>
              <ul className="space-y-2">
                {filterSet.filters.map((filter) => (
                  <li key={filter} className="flex gap-3 text-[13px] text-muted-foreground">
                    <span className="shrink-0 text-muted-foreground">•</span>
                    <span>{filter}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>

        <Card variant="default" className="p-6 space-y-4">
          <h2 className="text-[18px] font-bold text-foreground">4-Step Outreach Process</h2>
          <div className="space-y-4 pt-2">
            {outreachSteps.map((step) => (
              <div key={step.title} className="border-l-3 border-primary/30 pl-4">
                <p className="text-[13px] font-bold text-foreground">{step.title}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5">{step.action}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" className="p-6 space-y-4">
          <h2 className="text-[18px] font-bold text-foreground">Default Sequence</h2>
          <div className="mt-4">
            <Table className="text-[12px] text-left">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="font-semibold text-foreground">Touch</TableHead>
                  <TableHead className="font-semibold text-foreground">Subject</TableHead>
                  <TableHead className="font-semibold text-foreground">Use when</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequence.map((item) => (
                  <TableRow key={item.touch}>
                    <TableCell className="text-muted-foreground font-semibold whitespace-normal">{item.touch}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal">{item.subject}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal">{item.useWhen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card variant="default" className="p-6 space-y-6">
          <h2 className="text-[18px] font-bold text-foreground">Approved Message Templates</h2>
          <p className="text-[13px] text-muted-foreground">
            Personalize the trigger, company context, and buyer lens. Keep the pain and proof architecture intact.
          </p>
          <div className="space-y-8 pt-2">
            {messageTemplates.map((template) => (
              <div key={template.title} className="border-t border-border pt-6 first:border-t-0 first:pt-0">
                <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-primary mb-2">{template.title}</p>
                <p className="text-[12px] text-muted-foreground mb-2">{template.context}</p>
                <p className="text-[12px] font-semibold text-foreground mb-4">Subject: {template.subject}</p>
                <ul className="space-y-4">
                  {template.body.map((line) => (
                    <li key={line}>
                      <Card variant="default" className="bg-muted p-3.5 text-[13px] text-muted-foreground leading-relaxed">
                        {line}
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}