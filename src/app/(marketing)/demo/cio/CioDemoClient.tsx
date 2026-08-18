'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'

type ArchetypeKey =
  | 'cio'
  | 'cto'
  | 'ciso'
  | 'cdo'
  | 'chro'
  | 'cro'
  | 'coo'
  | 'cfo'
  | 'vp_it'
  | 'vp_engineering'
  | 'vp_sales'
  | 'vp_product'

type ArchetypeProfile = {
  key: ArchetypeKey
  label: string
  defaultRole: string
  resume: string
  linkedin: string
}

const ARCHETYPES: ArchetypeProfile[] = [
  {
    key: 'cio',
    label: 'CIO',
    defaultRole: 'Chief Information Officer',
    resume:
      'Bob Barker | Enterprise Technology Executive\n' +
      '20+ years leading enterprise IT strategy, cyber resilience, and modernization programs.\n' +
      'Reduced operating spend while improving service reliability and audit posture.\n' +
      'Led global teams of 200+ across infrastructure, architecture, data, and security operations.',
    linkedin:
      'Bob Barker is a technology executive focused on aligning IT investment to business outcomes with strong operating cadence and governance discipline.',
  },
  {
    key: 'cto',
    label: 'CTO',
    defaultRole: 'Chief Technology Officer',
    resume:
      'Bob Barker | Product and Platform Technology Leader\n' +
      'Scaled B2B SaaS architecture globally with strong reliability and delivery performance.\n' +
      'Led engineering modernization that improved release speed and quality.\n' +
      'Led 150+ engineering organization across platform, application, and reliability teams.',
    linkedin:
      'Bob Barker is a CTO-level leader who connects platform decisions to customer growth, product velocity, and enterprise reliability.',
  },
  {
    key: 'ciso',
    label: 'CISO',
    defaultRole: 'Chief Information Security Officer',
    resume:
      'Bob Barker | Cybersecurity Executive\n' +
      'Built enterprise security programs across identity, cloud, incident response, and third-party risk.\n' +
      'Reduced critical exposure while enabling cloud transformation.\n' +
      'Led security and governance teams with board-level risk reporting.',
    linkedin:
      'Bob Barker is a CISO-level operator focused on resilience, risk reduction, and practical security execution.',
  },
  {
    key: 'cdo',
    label: 'CDO',
    defaultRole: 'Chief Data Officer',
    resume:
      'Bob Barker | Data and Analytics Executive\n' +
      'Built enterprise data governance and modern data platform supporting analytics and AI.\n' +
      'Improved forecast quality and reduced reporting latency.\n' +
      'Led data engineering, analytics, and governance organizations.',
    linkedin:
      'Bob Barker is a CDO-level leader who turns data strategy into measurable operating outcomes.',
  },
  {
    key: 'chro',
    label: 'CHRO',
    defaultRole: 'Chief Human Resources Officer',
    resume:
      'Bob Barker | People Strategy Executive\n' +
      'Led workforce strategy through post-merger and transformation cycles.\n' +
      'Improved executive hiring velocity and reduced regrettable attrition.\n' +
      'Built talent and people analytics systems linked to business outcomes.',
    linkedin:
      'Bob Barker is a CHRO-level executive focused on strategic talent systems and operating alignment.',
  },
  {
    key: 'cro',
    label: 'CRO',
    defaultRole: 'Chief Revenue Officer',
    resume:
      'Bob Barker | Revenue Executive\n' +
      'Scaled enterprise GTM with improved pipeline quality and forecast discipline.\n' +
      'Increased win rates and retention in strategic segments.\n' +
      'Led sales, revops, and customer success organizations globally.',
    linkedin:
      'Bob Barker is a CRO-level leader who combines revenue growth with operational rigor.',
  },
  {
    key: 'coo',
    label: 'COO',
    defaultRole: 'Chief Operating Officer',
    resume:
      'Bob Barker | Enterprise Operations Executive\n' +
      'Led operating model redesign improving cycle time and margin performance.\n' +
      'Managed cross-functional teams with direct P&L accountability.\n' +
      'Built KPI cadence for executive decision-making and delivery control.',
    linkedin:
      'Bob Barker is a COO-level operator focused on execution systems, alignment, and measurable performance.',
  },
  {
    key: 'cfo',
    label: 'CFO',
    defaultRole: 'Chief Financial Officer',
    resume:
      'Bob Barker | Finance and Transformation Executive\n' +
      'Owned enterprise planning, FP&A, and capital allocation during growth and restructuring.\n' +
      'Improved cash efficiency while protecting strategic investment.\n' +
      'Built board-level scenario planning and financial governance cadence.',
    linkedin:
      'Bob Barker is a CFO-level leader blending financial discipline with operating judgment.',
  },
  {
    key: 'vp_it',
    label: 'VP IT',
    defaultRole: 'VP of IT',
    resume:
      'Bob Barker | VP, Information Technology\n' +
      'Led enterprise IT operations with measurable reliability and service improvements.\n' +
      'Managed large IT budget and multi-discipline teams.\n' +
      'Delivered modernization roadmap tied to business continuity outcomes.',
    linkedin:
      'Bob Barker is a VP IT leader focused on reliability, modernization, and execution discipline.',
  },
  {
    key: 'vp_engineering',
    label: 'VP Engineering',
    defaultRole: 'VP of Engineering',
    resume:
      'Bob Barker | VP Engineering\n' +
      'Scaled engineering organization and improved release predictability.\n' +
      'Implemented platform standards that reduced risk and cycle time.\n' +
      'Partnered with product leadership on roadmap and staffing tradeoffs.',
    linkedin:
      'Bob Barker is a VP Engineering leader known for delivery rigor and platform modernization.',
  },
  {
    key: 'vp_sales',
    label: 'VP Sales',
    defaultRole: 'VP of Sales',
    resume:
      'Bob Barker | VP Sales\n' +
      'Led enterprise sales teams with improved conversion and forecast quality.\n' +
      'Built execution cadence and coaching systems across regions.\n' +
      'Aligned GTM plans with product and marketing leadership.',
    linkedin:
      'Bob Barker is a VP Sales operator focused on pipeline quality and enterprise deal execution.',
  },
  {
    key: 'vp_product',
    label: 'VP Product',
    defaultRole: 'VP of Product',
    resume:
      'Bob Barker | VP Product\n' +
      'Owned product strategy for enterprise platform and analytics products.\n' +
      'Improved roadmap execution and adoption outcomes.\n' +
      'Led cross-functional product planning tied to business metrics.',
    linkedin:
      'Bob Barker is a VP Product leader known for prioritization, alignment, and measurable outcomes.',
  },
]

const TALKING_POINTS = [
  {
    title: 'Voss: Tactical Empathy',
    body: 'You already do the hard executive work. It sounds like too much high-value time goes to context rebuild instead of strategy.'
  },
  {
    title: 'Voss: Accusation Audit',
    body: 'This might feel like one more tool to manage. The demo proves it actually reduces prep friction in minutes.'
  },
  {
    title: 'Cialdini: Authority and Proof',
    body: 'Method and evidence are visible: the signal timing model is documented with sources and confidence context, and the workflow is verifiable live in this demo.'
  },
  {
    title: 'Horstman: Cadence and Clarity',
    body: 'Clear role boundary: platform handles signals and operating cadence, coach handles judgment and strategy.'
  },
]

const CADENCE_STEPS = [
  'Monday pipeline review: confirm target companies and active conversations.',
  'Daily signal decision: what changed, who to contact, what to ignore.',
  'Pre-session brief review: walk in with role-specific context and objections pre-handled.',
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
    objection: 'We already have a process. Why add this?',
    response:
      'That makes sense. This does not replace your process. It reduces context rebuild overhead so your existing process runs with better signal and decision speed.',
  },
  {
    objection: 'My team will not adopt another system.',
    response:
      'Reasonable concern. Start with two users and one weekly cadence checkpoint. If week-1 action and prep quality do not improve, stop the pilot.',
  },
  {
    objection: 'How do we trust the AI output?',
    response:
      'Treat the output as a first draft plus prompts for judgment. Metrics include denominator and confidence context, and final strategy remains human-owned.',
  },
  {
    objection: 'What about privacy and governance?',
    response:
      'Use the trust pack and permissions model. Access boundaries and data-handling rules are explicit before rollout.',
  },
  {
    objection: 'Can we prove ROI quickly?',
    response:
      'Yes. The 30-day scorecard tracks first signal action, first prep brief before a high-stakes conversation, and context rebuild time reduction.',
  },
]

const HESITATION_SCRIPTS = [
  {
    key: 'need-time',
    label: 'We need to think about it',
    script:
      'It sounds like you want to avoid adding noise to an already busy system. What would have to be true in the first two weeks for this to feel like a clear yes?',
  },
  {
    key: 'budget',
    label: 'Budget is tight right now',
    script:
      'Seems like priority and proof are the issue, not interest. Would it be unreasonable to run a two-client pilot and decide only from the scorecard outcomes?',
  },
  {
    key: 'timing',
    label: 'Not this quarter',
    script:
      'Sounds like timing risk is higher than value risk. If we did a low-lift start now, what milestone would make next-quarter expansion an obvious decision?',
  },
]

const TIMELINE_STEPS = [
  { key: 'mon', label: 'Monday pipeline review complete' },
  { key: 'daily', label: 'Daily signal decision logged' },
  { key: 'brief', label: 'Prep brief reviewed before key conversation' },
  { key: 'retro', label: 'Friday trend and overdue review done' },
]

const PRESENTER_ANCHORS = [
  { id: 'proof-clarity', label: 'Proof badges' },
  { id: 'pilot-scorecard', label: 'Pilot scorecard' },
  { id: 'hesitation-mode', label: 'Hesitation mode' },
  { id: 'accountability-timeline', label: 'Weekly timeline' },
  { id: 'objection-appendix', label: 'Objections' },
]

function renderInline(str: string) {
  return str.split(/\*\*(.+?)\*\*/g).map((chunk, index) => (
    index % 2 === 1 ? <strong key={index}>{chunk}</strong> : <span key={index}>{chunk}</span>
  ))
}

function renderBrief(text: string, isStreaming: boolean) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('# ')) return null
    if (line.trim() === '---' || line.trim() === '***') return null
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mt-8 mb-3 first:mt-0 pb-2 border-b border-slate-100">
          {line.slice(3)}
        </h3>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2.5 text-[14px] text-slate-700 leading-relaxed mb-2">
          <span className="text-slate-300 shrink-0 select-none mt-0.5">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    return (
      <p
        key={i}
        className="text-[14px] text-slate-700 leading-relaxed mb-2"
      >
        {renderInline(line)}
      </p>
    )
  }).concat(
    isStreaming
      ? [<span key="cursor" className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />]
      : []
  )
}

async function streamEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok || !res.body) throw new Error('Request failed')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}

export function CioDemoClient() {
  const [companyBriefCompany, setCompanyBriefCompany] = useState('ServiceNow')
  const [companyBriefRole, setCompanyBriefRole] = useState('Chief Information Officer')
  const [companyBrief, setCompanyBrief] = useState('')
  const [companyBriefLoading, setCompanyBriefLoading] = useState(false)
  const [companyBriefError, setCompanyBriefError] = useState('')

  const [archetype, setArchetype] = useState<ArchetypeKey>('cio')
  const [tailoredCompany, setTailoredCompany] = useState('ServiceNow')
  const [tailoredRole, setTailoredRole] = useState('Chief Information Officer')
  const [tailoredBrief, setTailoredBrief] = useState('')
  const [tailoredLoading, setTailoredLoading] = useState(false)
  const [tailoredError, setTailoredError] = useState('')
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

  const companyBriefRef = useRef<HTMLDivElement>(null)
  const tailoredBriefRef = useRef<HTMLDivElement>(null)

  const activeProfile = useMemo(
    () => ARCHETYPES.find((item) => item.key === archetype) ?? ARCHETYPES[0],
    [archetype]
  )
  const activeScript = useMemo(
    () => HESITATION_SCRIPTS.find((item) => item.key === activeHesitation) ?? HESITATION_SCRIPTS[0],
    [activeHesitation]
  )
  const pilotCompleted = Object.values(pilotScorecard).filter(Boolean).length
  const pilotCompletionPct = Math.round((pilotCompleted / 3) * 100)
  const timelineCompleted = Object.values(timelineChecks).filter(Boolean).length
  const pilotBarWidthClass =
    pilotCompleted === 0 ? 'w-0' : pilotCompleted === 1 ? 'w-1/3' : pilotCompleted === 2 ? 'w-2/3' : 'w-full'

  async function generateCompanyBrief(e: React.FormEvent) {
    e.preventDefault()
    if (!companyBriefCompany.trim() || !companyBriefRole.trim() || companyBriefLoading) return

    setCompanyBrief('')
    setCompanyBriefError('')
    setCompanyBriefLoading(true)

    let full = ''
    try {
      await streamEndpoint(
        '/api/demo-brief',
        { company: companyBriefCompany.trim(), role: companyBriefRole.trim() },
        (chunk) => {
          full += chunk
          setCompanyBrief(full)
        }
      )
    } catch {
      setCompanyBriefError('Something went wrong. Please try again.')
    } finally {
      setCompanyBriefLoading(false)
      setTimeout(() => companyBriefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  async function generateTailoredBrief(e: React.FormEvent) {
    e.preventDefault()
    if (!tailoredCompany.trim() || !tailoredRole.trim() || tailoredLoading) return

    setTailoredBrief('')
    setTailoredError('')
    setTailoredLoading(true)

    let full = ''
    try {
      await streamEndpoint(
        '/api/demo-brief/tailored',
        {
          company: tailoredCompany.trim(),
          role: tailoredRole.trim(),
          archetype: activeProfile.key,
          resumeText: activeProfile.resume,
          linkedinSummary: activeProfile.linkedin,
        },
        (chunk) => {
          full += chunk
          setTailoredBrief(full)
        }
      )
    } catch {
      setTailoredError('Something went wrong. Please try again.')
    } finally {
      setTailoredLoading(false)
      setTimeout(() => tailoredBriefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

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
            <Link href="/demo/presenter" className="text-[13px] text-slate-400 hover:text-white transition-colors">Presenter mode</Link>
            <Link href="/mark-demo" className="text-[13px] font-semibold text-white bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors">No-gate demo</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">CIO demo</p>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-slate-900 leading-[1.1] mb-4">
            Keep the talking points, show the brief, then pivot live.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed mb-5 max-w-3xl">
            Start with the concise talking points below. Then run a company brief on the fly. Then ask the custom question: what does fake user Bob Barker&apos;s interview brief look like for the company and role you just named?
          </p>
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
          <div className="text-[12px] text-slate-500 leading-relaxed">
            Reciprocity and commitment close: run this with two clients for 30 days, then decide using a weekly scorecard (first signal action, first prep brief before high-stakes conversation, context-rebuild time reduction).
            <span className="inline-block ml-2">
              <Link href="/references" className="underline underline-offset-2 hover:text-slate-800">References</Link>
              {' · '}
              <Link href="/evidence-hub" className="underline underline-offset-2 hover:text-slate-800">Evidence Hub</Link>
            </span>
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

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Brief demo</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Generate the company brief on the fly</h2>
          <p className="text-[14px] text-slate-600 mb-5">Type the company and role he names, click generate, and narrate the first section aloud.</p>

          <form onSubmit={generateCompanyBrief} className="border border-slate-200 rounded p-5 bg-slate-50 flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Company</label>
              <input
                value={companyBriefCompany}
                onChange={(e) => setCompanyBriefCompany(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
                placeholder="ServiceNow"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Role</label>
              <input
                value={companyBriefRole}
                onChange={(e) => setCompanyBriefRole(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
                placeholder="Chief Information Officer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={companyBriefLoading || !companyBriefCompany.trim() || !companyBriefRole.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors self-start"
            >
              {companyBriefLoading ? 'Generating...' : 'Generate company brief'}
            </button>
            {companyBriefError && <p className="text-[13px] text-red-600">{companyBriefError}</p>}
          </form>

          {(companyBriefLoading || companyBrief) && (
            <div ref={companyBriefRef} className="mt-5 border border-slate-200 rounded p-6 bg-white">
              {renderBrief(companyBrief, companyBriefLoading)}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Tailored brief demo</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Bob Barker at the named company and role</h2>
          <p className="text-[14px] text-slate-600 mb-5">
            Pick a fake C-suite or VP profile, then generate a tailored brief from fake resume plus fake LinkedIn summary. This is the exact move when he asks: what does Bob Barker&apos;s interview brief look like for this role?
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="border border-slate-200 rounded p-4 bg-slate-50">
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-2">Fake resume ({activeProfile.label})</p>
              <pre className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">{activeProfile.resume}</pre>
            </div>
            <div className="border border-slate-200 rounded p-4 bg-slate-50">
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-2">Fake LinkedIn summary</p>
              <p className="text-[12px] text-slate-700 leading-relaxed">{activeProfile.linkedin}</p>
            </div>
          </div>

          <form onSubmit={generateTailoredBrief} className="border border-slate-200 rounded p-5 bg-slate-50 flex flex-col gap-4">
            <div>
              <label htmlFor="demo-archetype" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Fake profile archetype</label>
              <select
                id="demo-archetype"
                value={archetype}
                onChange={(e) => {
                  const selected = e.target.value as ArchetypeKey
                  setArchetype(selected)
                  const profile = ARCHETYPES.find((item) => item.key === selected)
                  if (profile) setTailoredRole(profile.defaultRole)
                }}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
              >
                {ARCHETYPES.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Company</label>
              <input
                value={tailoredCompany}
                onChange={(e) => setTailoredCompany(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
                placeholder="ServiceNow"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Role</label>
              <input
                value={tailoredRole}
                onChange={(e) => setTailoredRole(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
                placeholder="Chief Information Officer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={tailoredLoading || !tailoredCompany.trim() || !tailoredRole.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors self-start"
            >
              {tailoredLoading ? 'Generating...' : 'Generate Bob Barker tailored brief'}
            </button>
            {tailoredError && <p className="text-[13px] text-red-600">{tailoredError}</p>}
          </form>

          {(tailoredLoading || tailoredBrief) && (
            <div ref={tailoredBriefRef} className="mt-5 border border-slate-200 rounded p-6 bg-white">
              {renderBrief(tailoredBrief, tailoredLoading)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}


