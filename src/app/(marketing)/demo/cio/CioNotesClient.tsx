'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-950 border-b border-slate-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:opacity-80 transition-opacity">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/demo/cio" className="text-[13px] text-slate-400 hover:text-white transition-colors">Presentation page</Link>
            <Link href="/mark-demo" className="text-[13px] font-semibold text-white bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors">No-gate demo</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Kenneth-specific talking points mode</p>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-slate-900 leading-[1.1] mb-4">
            Kenneth briefing notes and objection handling in one place
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed mb-5 max-w-3xl">
            Use this page during the conversation for message discipline tailored to Kenneth's public-sector CIO context, then flip back to presentation for live generation.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            <Link href="/demo/cio" className="text-[12px] px-3 py-1.5 rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-100 transition-colors">Presentation page</Link>
            <Link href="/demo/cio/notes" className="text-[12px] px-3 py-1.5 rounded border bg-slate-900 text-white border-slate-900">Talking points page</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {TALKING_POINTS.map((point) => (
              <div key={point.title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">{point.title}</p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 text-slate-100 rounded-xl px-4 py-4 mb-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-orange-300 mb-2">Cadence visual (Horstman layer)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CADENCE_STEPS.map((step) => (
                <div key={step} className="text-[12px] leading-relaxed bg-white/5 border border-white/10 rounded p-3">
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border border-slate-200 rounded-xl p-3 bg-slate-50">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-2">Presenter quick jump</p>
            <div className="flex flex-wrap gap-2">
              {PRESENTER_ANCHORS.map((anchor) => (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="text-[12px] px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  {anchor.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="proof-clarity" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Proof clarity</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Confidence and denominator badges</h2>
          <p className="text-[14px] text-slate-600 mb-5">Every claim includes denominator and confidence context so proof stays credible under scrutiny.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROOF_METRICS.map((metric) => (
              <div key={metric.label} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-2">{metric.label}</p>
                <p className="text-[28px] font-bold text-slate-900 leading-none mb-2">{metric.value}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-[11px] bg-slate-900 text-white px-2 py-1 rounded">n={metric.denominator}</span>
                  <span className="text-[11px] bg-orange-100 text-orange-800 px-2 py-1 rounded">{metric.confidence}</span>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{metric.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pilot-scorecard" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Pilot motion</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">30-day pilot success scorecard</h2>
          <p className="text-[14px] text-slate-600 mb-4">Use this live during the demo: check boxes as outcomes are met, then decide from evidence.</p>

          <div className="mb-4">
            <div className="flex items-center justify-between text-[12px] text-slate-600 mb-1.5">
              <span>Pilot completion</span>
              <span className="font-semibold text-slate-900">{pilotCompleted}/3 ({pilotCompletionPct}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-orange-500 transition-all ${pilotBarWidthClass}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPilotScorecard((prev) => ({ ...prev, firstSignalAction: !prev.firstSignalAction }))}
              className={`text-left border rounded-lg p-4 transition-colors ${pilotScorecard.firstSignalAction ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-1">Checkpoint 1</p>
              <p className="text-[13px] text-slate-800 leading-relaxed">First signal action in week 1</p>
            </button>
            <button
              type="button"
              onClick={() => setPilotScorecard((prev) => ({ ...prev, firstPrepBrief: !prev.firstPrepBrief }))}
              className={`text-left border rounded-lg p-4 transition-colors ${pilotScorecard.firstPrepBrief ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-1">Checkpoint 2</p>
              <p className="text-[13px] text-slate-800 leading-relaxed">First prep brief used before a high-stakes conversation</p>
            </button>
            <button
              type="button"
              onClick={() => setPilotScorecard((prev) => ({ ...prev, contextRebuildDrop: !prev.contextRebuildDrop }))}
              className={`text-left border rounded-lg p-4 transition-colors ${pilotScorecard.contextRebuildDrop ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-1">Checkpoint 3</p>
              <p className="text-[13px] text-slate-800 leading-relaxed">Context rebuild time reduction documented</p>
            </button>
          </div>
        </section>

        <section id="hesitation-mode" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Negotiation support</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Late-stage hesitation mode (Voss)</h2>
          <p className="text-[14px] text-slate-600 mb-5">One-click scripts for the most common late-stage stalls.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {HESITATION_SCRIPTS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveHesitation(item.key)}
                className={`text-[12px] px-3 py-1.5 rounded border transition-colors ${activeHesitation === item.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="border border-slate-200 rounded p-4 bg-slate-50">
            <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-2">Live script</p>
            <p className="text-[14px] text-slate-800 leading-relaxed">{activeScript.script}</p>
            <button
              type="button"
              onClick={copyScriptText}
              className="mt-3 text-[12px] px-3 py-1.5 rounded border border-slate-300 hover:bg-white transition-colors"
            >
              {copiedScript ? 'Copied' : 'Copy script'}
            </button>
          </div>
        </section>

        <section id="accountability-timeline" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Execution rhythm</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Weekly accountability timeline</h2>
          <p className="text-[14px] text-slate-600 mb-5">Make operating cadence visible and measurable every week.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {TIMELINE_STEPS.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() =>
                  setTimelineChecks((prev) => ({
                    ...prev,
                    [step.key]: !prev[step.key],
                  }))
                }
                className={`text-left border rounded-lg p-4 transition-colors ${timelineChecks[step.key] ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-1">Cadence step</p>
                <p className="text-[13px] text-slate-800 leading-relaxed">{step.label}</p>
              </button>
            ))}
          </div>
          <p className="text-[13px] text-slate-700">
            Weekly cadence completion: <span className="font-semibold">{timelineCompleted}/{TIMELINE_STEPS.length}</span>
          </p>
        </section>

        <section id="objection-appendix" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 scroll-mt-24">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Objections</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Objection-handling appendix</h2>
          <p className="text-[14px] text-slate-600 mb-5">Use these responses when concerns come up in real time during the demo.</p>
          <div className="space-y-3">
            {OBJECTION_APPENDIX.map((item) => (
              <div key={item.objection} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[12px] font-bold text-slate-900 mb-1.5">{item.objection}</p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{item.response}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

