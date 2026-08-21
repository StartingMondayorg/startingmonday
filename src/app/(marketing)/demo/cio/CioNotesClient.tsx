'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Toggle, ToggleGroup, ToggleGroupItem } from '@/components/ui'
const TALKING_POINTS = [
  {
    title: 'Voss: Tactical Empathy',
    body: 'You already run a high-scale public mission. It sounds like too much leadership time still goes to context rebuild instead of decision quality.'
  },
  {
    title: 'Voss: Accusation Audit',
    body: 'This may feel like another platform to manage. The demo is designed to prove lower prep friction and clearer weekly execution quickly.'
  },
  {
    title: 'Cialdini: Authority and Proof',
    body: 'Method and evidence are explicit, with denominator and confidence context for every headline claim.'
  },
  {
    title: 'Horstman: Cadence and Clarity',
    body: 'Clear role boundary: platform handles signal capture and cadence discipline; leadership retains judgment, governance, and strategic calls.'
  },
  {
    title: 'Transition Outcome: Target Company Discovery',
    body: 'Starting Monday helps identify and prioritize best-fit target companies, not just prepare for companies already in the pipeline.'
  },
]

const CADENCE_STEPS = [
  'Monday executive cadence review: priorities, risk, and stakeholder map.',
  'Daily signal triage: what changed across talent, market, and mission-critical context.',
  'Pre-conversation brief review: role context, likely objections, and board-ready framing.',
]

const PRESENTER_ANCHORS = [
  { id: 'proof-clarity', label: 'Proof badges' },
  { id: 'pilot-scorecard', label: 'Pilot scorecard' },
  { id: 'hesitation-mode', label: 'Hesitation mode' },
  { id: 'accountability-timeline', label: 'Weekly timeline' },
  { id: 'objection-appendix', label: 'Objections' },
]

const PROOF_METRICS = [
  {
    label: 'Signal lead time',
    value: '1-3 wks',
    denominator: 'Documented timing model',
    confidence: 'Medium confidence',
    note: 'Typical lead on role-shaping signals before broad-market posting; method notes at /references.',
  },
  {
    label: 'Prep brief generation',
    value: '60 sec',
    denominator: 'Product mechanics',
    confidence: 'Verifiable live',
    note: 'Role-specific brief: win thesis, likely objections, peer-level questions.',
  },
  {
    label: 'Career-page scan cadence',
    value: '3x/wk',
    denominator: 'Product mechanics',
    confidence: 'Verifiable live',
    note: 'Automated scans on every tracked target company.',
  },
]

const OBJECTION_APPENDIX = [
  {
    objection: 'We already run governance and operating reviews. Why add this?',
    response:
      'That makes sense. This does not replace your governance process. It compresses context rebuild and makes weekly decisions more evidence-ready.',
  },
  {
    objection: 'My team will not adopt another platform.',
    response:
      'Reasonable concern. Start with two leaders and one cadence checkpoint. If week-1 action and briefing quality do not improve, stop the pilot.',
  },
  {
    objection: 'How do we trust AI output in a public-sector environment?',
    response:
      'Treat output as structured first draft plus prompts for judgment. Metrics include denominator and confidence context; final decisions remain human-owned.',
  },
  {
    objection: 'What about compliance, privacy, and procurement constraints?',
    response:
      'Use a clear trust pack and permissions model. Access boundaries, data-handling rules, and phased rollout criteria are explicit up front.',
  },
  {
    objection: 'Can we prove value quickly without disruption?',
    response:
      'Yes. The 30-day scorecard tracks first signal action, first high-stakes prep brief, and measurable context rebuild reduction.',
  },
]

const HESITATION_SCRIPTS = [
  {
    key: 'need-time',
    label: 'We need to think about it',
    script:
      'It sounds like you want to avoid adding noise to an already complex operation. What would need to be true in two weeks for this to be an obvious yes?',
  },
  {
    key: 'budget',
    label: 'Budget is tight right now',
    script:
      'Seems like sequencing and proof are the issue, not interest. Would it be unreasonable to run a two-leader pilot and decide only from scorecard outcomes?',
  },
  {
    key: 'timing',
    label: 'Not this quarter',
    script:
      'Sounds like timing risk is higher than value risk. If we run a low-lift start now, what milestone would make next-quarter expansion obvious?',
  },
]

const TIMELINE_STEPS = [
  { key: 'mon', label: 'Monday pipeline review complete' },
  { key: 'daily', label: 'Daily signal decision logged' },
  { key: 'brief', label: 'Prep brief reviewed before key conversation' },
  { key: 'retro', label: 'Friday trend and overdue review done' },
]

export function CioNotesClient() {
  const [activeHesitation, setActiveHesitation] = useState(HESITATION_SCRIPTS[0].key)
  const [copiedScript, setCopiedScript] = useState(false)
  const [pilotScorecard, setPilotScorecard] = useState({
    firstSignalAction: false,
    firstPrepBrief: false,
    contextRebuildDrop: false,
  })
  const [timelineChecks, setTimelineChecks] = useState<Record<string, boolean>>({
    mon: false,
    daily: false,
    brief: false,
    retro: false,
  })

  const activeScript = useMemo(
    () => HESITATION_SCRIPTS.find((item) => item.key === activeHesitation) ?? HESITATION_SCRIPTS[0],
    [activeHesitation]
  )
  const pilotCompleted = Object.values(pilotScorecard).filter(Boolean).length
  const pilotCompletionPct = Math.round((pilotCompleted / 3) * 100)
  const timelineCompleted = Object.values(timelineChecks).filter(Boolean).length
  const pilotBarWidthClass =
    pilotCompleted === 0 ? 'w-0' : pilotCompleted === 1 ? 'w-1/3' : pilotCompleted === 2 ? 'w-2/3' : 'w-full'

  async function copyScriptText() {
    try {
      await navigator.clipboard.writeText(activeScript.script)
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 1200)
    } catch {
      setCopiedScript(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted text-foreground font-sans">
      <header className="bg-primary border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground hover:opacity-80 transition-opacity">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/demo/cio" className="text-[13px] text-primary-foreground hover:text-primary-foreground transition-colors">Presentation page</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Card variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-3">Kenneth-specific talking points mode</p>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-foreground leading-[1.1] mb-4">
            Kenneth briefing notes and objection handling in one place
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-5 max-w-3xl">
            Use this page during the conversation for message discipline tailored to Kenneth's public-sector CIO context, then flip back to presentation for live generation.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            <Link href="/demo/cio" className="text-[12px] px-3 py-1.5 rounded border bg-card text-muted-foreground border-border hover:bg-muted transition-colors">Presentation page</Link>
            <Link href="/demo/cio/notes" className="text-[12px] px-3 py-1.5 rounded border bg-primary text-primary-foreground border-border">Talking points page</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {TALKING_POINTS.map((point) => (
              <Card key={point.title} variant="default" className="bg-muted p-4">
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">{point.title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{point.body}</p>
              </Card>
            ))}
          </div>

          <Card variant="default" className="!bg-primary !text-primary-foreground rounded-xl px-4 py-4 mb-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-primary mb-2">Cadence visual (Horstman layer)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CADENCE_STEPS.map((step) => (
                <Card key={step} variant="glass" className="rounded p-3 text-[12px] leading-relaxed">
                  {step}
                </Card>
              ))}
            </div>
          </Card>

          <Card variant="default" className="mt-5 rounded-xl p-3 bg-muted">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Presenter quick jump</p>
            <div className="flex flex-wrap gap-2">
              {PRESENTER_ANCHORS.map((anchor) => (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="text-[12px] px-3 py-1.5 rounded border border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
                >
                  {anchor.label}
                </a>
              ))}
            </div>
          </Card>
        </Card>

        <Card id="proof-clarity" variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Proof clarity</p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight mb-2">Confidence and denominator badges</h2>
          <p className="text-[14px] text-muted-foreground mb-5">Every claim includes denominator and confidence context so proof stays credible under scrutiny.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROOF_METRICS.map((metric) => (
              <Card key={metric.label} variant="default" className="p-4 bg-muted">
                <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-2">{metric.label}</p>
                <p className="text-[28px] font-bold text-foreground leading-none mb-2">{metric.value}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className="!bg-primary !text-primary-foreground rounded">n={metric.denominator}</Badge>
                  <Badge variant="warning" className="rounded">{metric.confidence}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{metric.note}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card id="pilot-scorecard" variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Pilot motion</p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight mb-2">30-day pilot success scorecard</h2>
          <p className="text-[14px] text-muted-foreground mb-4">Use this live during the demo: check boxes as outcomes are met, then decide from evidence.</p>

          <div className="mb-4">
            <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1.5">
              <span>Pilot completion</span>
              <span className="font-semibold text-foreground">{pilotCompleted}/3 ({pilotCompletionPct}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full bg-primary transition-all ${pilotBarWidthClass}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Toggle
              pressed={pilotScorecard.firstSignalAction}
              onPressedChange={(pressed) => setPilotScorecard((prev) => ({ ...prev, firstSignalAction: pressed }))}
              className={`h-auto min-w-0 block w-full text-left border rounded-lg p-4 transition-colors ${pilotScorecard.firstSignalAction ? 'border-success/30 bg-success/10' : 'border-border bg-card hover:bg-muted'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Checkpoint 1</p>
              <p className="text-[13px] text-foreground leading-relaxed whitespace-normal">First signal action in week 1</p>
            </Toggle>
            <Toggle
              pressed={pilotScorecard.firstPrepBrief}
              onPressedChange={(pressed) => setPilotScorecard((prev) => ({ ...prev, firstPrepBrief: pressed }))}
              className={`h-auto min-w-0 block w-full text-left border rounded-lg p-4 transition-colors ${pilotScorecard.firstPrepBrief ? 'border-success/30 bg-success/10' : 'border-border bg-card hover:bg-muted'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Checkpoint 2</p>
              <p className="text-[13px] text-foreground leading-relaxed whitespace-normal">First prep brief used before a high-stakes conversation</p>
            </Toggle>
            <Toggle
              pressed={pilotScorecard.contextRebuildDrop}
              onPressedChange={(pressed) => setPilotScorecard((prev) => ({ ...prev, contextRebuildDrop: pressed }))}
              className={`h-auto min-w-0 block w-full text-left border rounded-lg p-4 transition-colors ${pilotScorecard.contextRebuildDrop ? 'border-success/30 bg-success/10' : 'border-border bg-card hover:bg-muted'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Checkpoint 3</p>
              <p className="text-[13px] text-foreground leading-relaxed whitespace-normal">Context rebuild time reduction documented</p>
            </Toggle>
          </div>
        </Card>

        <Card id="hesitation-mode" variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Negotiation support</p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight mb-2">Late-stage hesitation mode (Voss)</h2>
          <p className="text-[14px] text-muted-foreground mb-5">One-click scripts for the most common late-stage stalls.</p>

          <ToggleGroup
            value={[activeHesitation]}
            onValueChange={(values) => { if (values[0]) setActiveHesitation(values[0]) }}
            className="flex-wrap gap-2 mb-4"
          >
            {HESITATION_SCRIPTS.map((item) => (
              <ToggleGroupItem
                key={item.key}
                value={item.key}
                className={`text-[12px] px-3 py-1.5 rounded border transition-colors ${activeHesitation === item.key ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-border' : 'bg-card text-card-foreground border-border hover:bg-muted'}`}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Card variant="default" className="rounded p-4 bg-muted">
            <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-2">Live script</p>
            <p className="text-[14px] text-foreground leading-relaxed">{activeScript.script}</p>
            <Button
              type="button"
              variant="outline"
              onClick={copyScriptText}
              className="mt-3 text-[12px] px-3 py-1.5 h-auto rounded border-border hover:bg-card"
            >
              {copiedScript ? 'Copied' : 'Copy script'}
            </Button>
          </Card>
        </Card>

        <Card id="accountability-timeline" variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Execution rhythm</p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight mb-2">Weekly accountability timeline</h2>
          <p className="text-[14px] text-muted-foreground mb-5">Make operating cadence visible and measurable every week.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {TIMELINE_STEPS.map((step) => (
              <Toggle
                key={step.key}
                pressed={!!timelineChecks[step.key]}
                onPressedChange={(pressed) =>
                  setTimelineChecks((prev) => ({
                    ...prev,
                    [step.key]: pressed,
                  }))
                }
                className={`h-auto min-w-0 block w-full text-left border rounded-lg p-4 transition-colors ${timelineChecks[step.key] ? 'border-success/30 bg-success/10' : 'border-border bg-card hover:bg-muted'}`}
              >
                <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1">Cadence step</p>
                <p className="text-[13px] text-foreground leading-relaxed whitespace-normal">{step.label}</p>
              </Toggle>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Weekly cadence completion: <span className="font-semibold">{timelineCompleted}/{TIMELINE_STEPS.length}</span>
          </p>
        </Card>

        <Card id="objection-appendix" variant="default" className="rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Objections</p>
          <h2 className="text-[24px] font-bold text-foreground leading-tight mb-2">Objection-handling appendix</h2>
          <p className="text-[14px] text-muted-foreground mb-5">Use these responses when concerns come up in real time during the demo.</p>
          <div className="space-y-3">
            {OBJECTION_APPENDIX.map((item) => (
              <Card key={item.objection} variant="default" className="rounded-lg p-4 bg-muted">
                <p className="text-[12px] font-bold text-foreground mb-1.5">{item.objection}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{item.response}</p>
              </Card>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}

