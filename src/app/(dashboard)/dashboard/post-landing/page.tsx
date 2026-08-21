import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { LIFECYCLE_TEMPLATES } from '@/lib/executive-lifecycle'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, Badge, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Post-Landing - 30/60/90 Plan | Starting Monday',
  description: 'Onboarding narrative, stakeholder trust map, early-win planner, and first-90-day milestones.',
}

/**
 * Post-Landing 30/60/90 Mode - Sprint ITS-3 Ticket 19
 *
 * AC:
 * - Distinct executive lifecycle state from active search
 * - 30/60/90 mode available with saved artifacts
 * - First-quarter relationship strategy
 * - Stakeholder trust map
 * - Early-win story planner
 * - Advisor-supported onboarding narrative
 */
export default async function PostLandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, placement_company, placed_at')
    .eq('user_id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const company = profile?.placement_company ?? 'your new organization'
  const placedAt = profile?.placed_at ? new Date(profile.placed_at) : null

  // Calculate days since placement
  const daysSincePlacement = placedAt
    ? Math.floor((Date.now() - placedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const currentPhase =
    daysSincePlacement === null ? null
    : daysSincePlacement <= 30 ? '30'
    : daysSincePlacement <= 60 ? '60'
    : '90'

  const template = LIFECYCLE_TEMPLATES.find(
    (t) => t.state === 'post_landing' && t.persona === 'post_landing_new',
  )!

  const PHASES = [
    {
      id: '30',
      label: 'Days 1–30',
      theme: 'Listen, learn, and build trust',
      goals: [
        'Complete structured stakeholder introductions (all key relationships mapped)',
        'Understand the real mandate - what success looks like in 90 days',
        'Identify the one visible win you can deliver in the first month',
        'Establish your communication cadence with your manager and team',
      ],
      artifacts: [
        'Stakeholder introduction map (who, meeting date, relationship quality, next step)',
        'Mandate clarity document (what I was hired to do, what good looks like)',
        'Day-30 early win: specific, named, and deliverable',
      ],
    },
    {
      id: '60',
      label: 'Days 31–60',
      theme: 'Build credibility and deliver early wins',
      goals: [
        'Complete the first visible win and document it clearly',
        'Identify two more high-value moves in the next 30 days',
        'Run a stakeholder trust check - where do you have credit? Where is it thin?',
        'Begin shaping the narrative of your impact for the 90-day review',
      ],
      artifacts: [
        'Early win story (situation → action → measured outcome)',
        'Stakeholder trust assessment (scored 1–5 per relationship)',
        'Day-60 momentum memo (what has changed since day 30)',
      ],
    },
    {
      id: '90',
      label: 'Days 61–90',
      theme: 'Establish authority and build long-horizon optionality',
      goals: [
        'Articulate your 90-day impact narrative in one paragraph',
        'Define your mandate for the next 6 months',
        'Identify the three external relationships to stay warm (keep optionality alive)',
        'Capture proof points while they are fresh - your future search will need them',
      ],
      artifacts: [
        '90-day impact narrative (for internal reviews and future positioning)',
        'Six-month mandate definition',
        'Proof base: three outcomes with measurable evidence',
        'Optionality warmth list: three external relationships with warmth plan',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-semibold text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Mode header */}
        <Card className="border-success/30 px-6 py-6">
          <p className="text-[13px] font-semibold text-success mb-2">
            Post-Landing - 30/60/90 Mode
          </p>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">
            {firstName}&apos;s first 90 days at {company}
          </h1>
          {daysSincePlacement !== null && (
            <p className="text-[13px] text-muted-foreground mt-2">
              Day {daysSincePlacement} · Currently in the{' '}
              <span className="font-semibold text-success">Days {currentPhase === '30' ? '1–30' : currentPhase === '60' ? '31–60' : '61–90'}</span> phase
            </p>
          )}
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed max-w-xl">
            The goal now is strong early credibility, documented wins, and laying the foundation for long-horizon optionality.
          </p>
        </Card>

        {/* Onboarding narrative frame */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-3">Onboarding narrative</h2>
          <p className="text-[13px] text-muted-foreground mb-3">
            The same three-layer structure from your search narrative applies here. Legacy from your last role → inflection into this one → what you are building now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'What I bring from my last role', placeholder: 'The proven operating model, team relationships, and credibility you arrive with.' },
              { label: 'Why this mandate is the right next step', placeholder: 'The scope, timing, and fit that made this the right move.' },
              { label: 'What I am building here', placeholder: 'The specific value I will add in the first 6–12 months.' },
            ].map(({ label, placeholder }) => (
              <div key={label} className="rounded-lg bg-muted border border-border p-3">
                <Label className="text-[13px] font-semibold text-muted-foreground mb-2">{label}</Label>
                <Textarea
                  rows={3}
                  placeholder={placeholder}
                  className="w-full bg-card text-[13px] focus-visible:border-success/30 resize-none"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Stakeholder trust map */}
        <Card className="px-5 py-5">
          <h2 className="text-[13px] font-bold text-foreground mb-1">Stakeholder trust map</h2>
          <p className="text-[13px] text-muted-foreground mb-4">
            Who are the 5–8 people whose trust determines your first-quarter success? Rate your current relationship quality (1–5) and identify what each one needs to see from you.
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table className="text-[13px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  {['Name / role', 'Trust (1–5)', 'What they need to see', 'Your next move'].map((h) => (
                    <TableHead key={h} className="text-[13px] font-semibold text-muted-foreground">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="bg-card">
                    <TableCell><Input className="w-full border-0 bg-transparent text-[13px] focus-visible:ring-0 placeholder:text-muted-foreground" placeholder="e.g. CFO" /></TableCell>
                    <TableCell><Input type="number" min="1" max="5" title="Trust score 1-5" placeholder="3" className="w-12 text-[13px] focus-visible:border-success/30" /></TableCell>
                    <TableCell><Input className="w-full border-0 bg-transparent text-[13px] focus-visible:ring-0 placeholder:text-muted-foreground" placeholder="Quick wins on cost..." /></TableCell>
                    <TableCell><Input className="w-full border-0 bg-transparent text-[13px] focus-visible:ring-0 placeholder:text-muted-foreground" placeholder="Coffee this week" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 30/60/90 phase cards */}
        <Card className="py-0 divide-y divide-border">
          <Accordion
            multiple
            defaultValue={currentPhase === null ? PHASES.map((p) => p.id) : [currentPhase]}
          >
            {PHASES.map((phase) => (
              <AccordionItem key={phase.id} value={phase.id} className="px-5">
                <AccordionTrigger className={`py-4 hover:no-underline ${phase.id === currentPhase ? 'bg-success/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-[13px] font-bold ${
                      phase.id === currentPhase
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-foreground'
                    }`}>{phase.id}</span>
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{phase.label}</p>
                      <p className="text-[13px] text-muted-foreground">{phase.theme}</p>
                    </div>
                  </div>
                  {phase.id === currentPhase && (
                    <Badge variant="success" className="mr-2">Current</Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="text-[13px] font-semibold text-muted-foreground mt-4 mb-2">Goals</h4>
                    <ul className="space-y-1.5">
                      {phase.goals.map((g) => (
                        <li key={g} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                          <span className="text-success mt-0.5 flex-shrink-0">→</span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-muted-foreground mb-2">Artifacts to create</h4>
                    <ul className="space-y-1.5">
                      {phase.artifacts.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                          <span className="text-muted-foreground mt-0.5 flex-shrink-0">□</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Early win planner */}
                  {phase.id === '30' && (
                    <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-2">
                      <p className="text-[11px] font-bold text-success uppercase tracking-wider">Early win planner</p>
                      {[
                        { label: 'Situation', placeholder: 'What problem or opportunity is visible now?' },
                        { label: 'Action', placeholder: 'What specific action can you take in 30 days?' },
                        { label: 'Measurable outcome', placeholder: 'What is the visible, specific result?' },
                      ].map(({ label, placeholder }) => (
                        <div key={label}>
                          <Label className="block text-[10px] font-semibold text-success mb-1">{label}</Label>
                          <Textarea
                            rows={2}
                            placeholder={placeholder}
                            className="w-full border-success/30 text-[12px] resize-none bg-card"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Long-horizon optionality reminder */}
        <Alert variant="warning">
          <AlertTitle>Keep optionality alive</AlertTitle>
          <AlertDescription>
            {template.weeklyFocus.find((f) => f.includes('external'))}
          </AlertDescription>
        </Alert>

        {/* Session opening prompts */}
        <Card className="bg-muted px-5 py-5">
          <h2 className="text-[13px] font-bold text-muted-foreground mb-3">Coach session opening prompts</h2>
          <ul className="space-y-2">
            {template.sessionOpeningPrompts.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[13px] text-muted-foreground italic">
                <span className="text-muted-foreground mt-0.5 not-italic flex-shrink-0">?</span>
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  )
}
