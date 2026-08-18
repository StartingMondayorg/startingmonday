'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'

type ArchetypeKey =
  | 'kenneth'
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

type CompanyCandidate = {
  name: string
  sector: string
  whyFit: string
  strengths: string[]
}

type BriefRequestPayload = {
  company: string
  role: string
}

type SavedTarget = CompanyCandidate & {
  score: number
  stage: 'Target Identified' | 'Researching' | 'Outreach Ready'
}

const ARCHETYPES: ArchetypeProfile[] = [
  {
    key: 'kenneth',
    label: 'Kenneth Kicia, P.E. (CIO, Florida DOC)',
    defaultRole: 'Enterprise CIO (Next Role)',
    resume:
      'Kenneth Kicia, P.E. | Executive Technology Leader in Transition\n' +
      'Current CIO at Florida Department of Corrections, pursuing next enterprise CIO opportunity.\n' +
      'Known for digital transformation, merger/integration leadership, and modernization across complex organizations.\n' +
      'Active governing and advisory roles across Gartner FL CIO/CISO community, higher education, and government technology boards.',
    linkedin:
      'Kenneth Kicia is a CIO-level executive in transition, focused on modernization leadership, mission-scale execution, and board-ready technology strategy.',
  },
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

const KENNETH_COMPANY_CANDIDATES: CompanyCandidate[] = [
  {
    name: 'Tyler Technologies',
    sector: 'GovTech',
    whyFit: 'State and local government modernization aligns directly with Kenneth\'s public-sector CIO leadership background.',
    strengths: ['public sector', 'mission-critical systems', 'governance discipline'],
  },
  {
    name: 'Leidos',
    sector: 'Government and Defense Technology',
    whyFit: 'Large mission-focused programs and high-accountability operating environments fit Kenneth\'s execution profile.',
    strengths: ['mission environments', 'program scale', 'executive decision support'],
  },
  {
    name: 'Kyndryl',
    sector: 'Enterprise Infrastructure Services',
    whyFit: 'Infrastructure modernization and reliability at scale map well to Kenneth\'s background in complex IT operating models.',
    strengths: ['infrastructure modernization', 'operational resilience', 'enterprise transformation'],
  },
  {
    name: 'CGI',
    sector: 'Public Sector and Enterprise IT Services',
    whyFit: 'Cross-sector transformation and long-cycle stakeholder management align with Kenneth\'s governance and advisory strengths.',
    strengths: ['public-sector delivery', 'stakeholder alignment', 'board-facing communication'],
  },
  {
    name: 'Accenture (Public Service)',
    sector: 'Public Sector Transformation',
    whyFit: 'Public service modernization programs and enterprise change leadership are tightly aligned with Kenneth\'s CIO track record.',
    strengths: ['digital transformation', 'multi-stakeholder delivery', 'execution cadence'],
  },
  {
    name: 'ServiceNow',
    sector: 'Enterprise Workflow Platform',
    whyFit: 'Workflow and operations modernization is a credible extension of Kenneth\'s transformation and governance experience.',
    strengths: ['platform modernization', 'process transformation', 'operating cadence'],
  },
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
  onChunk: (text: string) => void,
  onFirstChunk?: () => void
): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok || !res.body) {
    const details = (await res.text().catch(() => '')).trim()
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      throw new Error(retryAfter ? `Rate limit reached. Retry in ${retryAfter}s.` : 'Rate limit reached. Please retry in a moment.')
    }
    throw new Error(details || 'Request failed')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let gotFirstChunk = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!gotFirstChunk) {
      gotFirstChunk = true
      onFirstChunk?.()
    }
    onChunk(decoder.decode(value, { stream: true }))
  }
}

export function CioPresentationClient() {
  const [companyBriefCompany, setCompanyBriefCompany] = useState('ServiceNow')
  const [companyBriefRole, setCompanyBriefRole] = useState('Enterprise CIO (Next Role)')
  const [companyBrief, setCompanyBrief] = useState('')
  const [companyBriefLoading, setCompanyBriefLoading] = useState(false)
  const [companyBriefError, setCompanyBriefError] = useState('')
  const [companyBriefStatus, setCompanyBriefStatus] = useState('')
  const [companyFirstTokenSlow, setCompanyFirstTokenSlow] = useState(false)
  const [lastCompanyRequest, setLastCompanyRequest] = useState<BriefRequestPayload | null>(null)

  const [archetype, setArchetype] = useState<ArchetypeKey>('kenneth')
  const [tailoredCompany, setTailoredCompany] = useState('ServiceNow')
  const [tailoredRole, setTailoredRole] = useState('Enterprise CIO (Next Role)')
  const [tailoredBrief, setTailoredBrief] = useState('')
  const [tailoredLoading, setTailoredLoading] = useState(false)
  const [tailoredError, setTailoredError] = useState('')
  const [tailoredStatus, setTailoredStatus] = useState('')
  const [tailoredFirstTokenSlow, setTailoredFirstTokenSlow] = useState(false)
  const [lastTailoredRequest, setLastTailoredRequest] = useState<BriefRequestPayload | null>(null)
  const [fitKeywords, setFitKeywords] = useState('public sector modernization, mission-critical operations, governance leadership, enterprise infrastructure, digital transformation')
  const [fitResults, setFitResults] = useState<Array<CompanyCandidate & { score: number }>>([])
  const [targetList, setTargetList] = useState<SavedTarget[]>([])

  const companyBriefRef = useRef<HTMLDivElement>(null)
  const tailoredBriefRef = useRef<HTMLDivElement>(null)

  const activeProfile = useMemo(
    () => ARCHETYPES.find((item) => item.key === archetype) ?? ARCHETYPES[0],
    [archetype]
  )

  async function runCompanyBrief(targetCompany: string, targetRole: string) {
    const trimmedCompany = targetCompany.trim()
    const trimmedRole = targetRole.trim()
    if (!trimmedCompany || !trimmedRole) return
    if (companyBriefLoading) {
      setCompanyBriefStatus('Already generating. Please wait for this run to finish.')
      return
    }

    setCompanyBrief('')
    setCompanyBriefError('')
    setCompanyBriefLoading(true)
    setCompanyBriefStatus('Request sent. Building brief...')
    setCompanyFirstTokenSlow(false)
    setLastCompanyRequest({ company: trimmedCompany, role: trimmedRole })

    const firstTokenTimer = setTimeout(() => {
      setCompanyFirstTokenSlow(true)
      setCompanyBriefStatus('Still working. Warming up the model...')
    }, 3000)

    let full = ''
    try {
      await streamEndpoint(
        '/api/demo-brief',
        { company: trimmedCompany, role: trimmedRole },
        (chunk) => {
          full += chunk
          setCompanyBrief(full)
        },
        () => {
          clearTimeout(firstTokenTimer)
          setCompanyFirstTokenSlow(false)
          setCompanyBriefStatus('Streaming response...')
        }
      )
      if (!full.trim()) {
        setCompanyBriefError('No response returned. Please retry.')
      }
      setCompanyBriefStatus('')
    } catch (err) {
      setCompanyBriefError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setCompanyBriefStatus('')
    } finally {
      clearTimeout(firstTokenTimer)
      setCompanyBriefLoading(false)
      setCompanyFirstTokenSlow(false)
      setTimeout(() => companyBriefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  async function generateCompanyBrief(e: React.FormEvent) {
    e.preventDefault()
    await runCompanyBrief(companyBriefCompany, companyBriefRole)
  }

  async function runTailoredBrief(targetCompany: string, targetRole: string) {
    const trimmedCompany = targetCompany.trim()
    const trimmedRole = targetRole.trim()
    if (!trimmedCompany || !trimmedRole) return
    if (tailoredLoading) {
      setTailoredStatus('Already generating. Please wait for this run to finish.')
      return
    }

    setTailoredBrief('')
    setTailoredError('')
    setTailoredLoading(true)
    setTailoredStatus('Request sent. Building brief...')
    setTailoredFirstTokenSlow(false)
    setLastTailoredRequest({ company: trimmedCompany, role: trimmedRole })

    const firstTokenTimer = setTimeout(() => {
      setTailoredFirstTokenSlow(true)
      setTailoredStatus('Still working. Warming up the model...')
    }, 3000)

    let full = ''
    try {
      await streamEndpoint(
        '/api/demo-brief/tailored',
        {
          company: trimmedCompany,
          role: trimmedRole,
          archetype: activeProfile.key,
          resumeText: activeProfile.resume,
          linkedinSummary: activeProfile.linkedin,
        },
        (chunk) => {
          full += chunk
          setTailoredBrief(full)
        },
        () => {
          clearTimeout(firstTokenTimer)
          setTailoredFirstTokenSlow(false)
          setTailoredStatus('Streaming response...')
        }
      )
      if (!full.trim()) {
        setTailoredError('No response returned. Please retry.')
      }
      setTailoredStatus('')
    } catch (err) {
      setTailoredError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setTailoredStatus('')
    } finally {
      clearTimeout(firstTokenTimer)
      setTailoredLoading(false)
      setTailoredFirstTokenSlow(false)
      setTimeout(() => tailoredBriefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }

  async function generateTailoredBrief(e: React.FormEvent) {
    e.preventDefault()
    await runTailoredBrief(tailoredCompany, tailoredRole)
  }

  async function retryCompanyBrief() {
    if (!lastCompanyRequest || companyBriefLoading) return
    setCompanyBriefCompany(lastCompanyRequest.company)
    setCompanyBriefRole(lastCompanyRequest.role)
    await runCompanyBrief(lastCompanyRequest.company, lastCompanyRequest.role)
  }

  async function retryTailoredBrief() {
    if (!lastTailoredRequest || tailoredLoading) return
    setTailoredCompany(lastTailoredRequest.company)
    setTailoredRole(lastTailoredRequest.role)
    await runTailoredBrief(lastTailoredRequest.company, lastTailoredRequest.role)
  }

  function findCompanyFit(e: React.FormEvent) {
    e.preventDefault()
    const keywords = fitKeywords
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    const scored = KENNETH_COMPANY_CANDIDATES.map((company) => {
      const text = `${company.sector} ${company.whyFit} ${company.strengths.join(' ')}`.toLowerCase()
      const hits = keywords.filter((k) => text.includes(k)).length
      return {
        ...company,
        score: Math.round(((hits + 1) / (keywords.length + 1)) * 100),
      }
    }).sort((a, b) => b.score - a.score)

    setFitResults(scored.slice(0, 4))
  }

  function saveToTargetList(company: CompanyCandidate & { score: number }) {
    setTargetList((prev) => {
      const exists = prev.some((item) => item.name === company.name)
      if (exists) return prev

      const stage: SavedTarget['stage'] =
        company.score >= 85 ? 'Outreach Ready' : company.score >= 70 ? 'Researching' : 'Target Identified'

      return [...prev, { ...company, stage }]
    })
  }

  function loadInBrief(companyName: string) {
    setCompanyBriefCompany(companyName)
    setTailoredCompany(companyName)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-950 border-b border-slate-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:opacity-80 transition-opacity">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/demo/cio/notes" className="text-[13px] text-slate-400 hover:text-white transition-colors">Talking points page</Link>
            <Link href="/mark-demo" className="text-[13px] font-semibold text-white bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors">No-gate demo</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Kenneth transition presentation mode</p>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-slate-900 leading-[1.1] mb-4">
            Executive-in-transition walkthrough tailored to Kenneth
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed mb-5 max-w-3xl">
            Start with Kenneth's target-company context, then run a tailored brief showing how Starting Monday supports executives in transition from search strategy through interview prep and outreach execution.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/demo/cio" className="text-[12px] px-3 py-1.5 rounded border bg-slate-900 text-white border-slate-900">Presentation page</Link>
            <Link href="/demo/cio/notes" className="text-[12px] px-3 py-1.5 rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-100 transition-colors">Talking points page</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[12px] text-slate-700">Transition lens: from current CIO seat to next enterprise CIO role</div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[12px] text-slate-700">Search outcome: stronger target narrative, faster prep, higher-quality outreach</div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[12px] text-slate-700">Credibility signals: transformation wins, governance leadership, advisory footprint</div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Target discovery</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Find best-fit companies for Kenneth</h2>
          <p className="text-[14px] text-slate-600 mb-5">
            Show that Starting Monday is not only prep and outreach. It also helps identify high-fit target companies for executives in transition.
          </p>

          <form onSubmit={findCompanyFit} className="border border-slate-200 rounded p-5 bg-slate-50 flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Fit keywords (comma-separated)</label>
              <input
                value={fitKeywords}
                onChange={(e) => setFitKeywords(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2.5 text-[14px] text-slate-900"
                placeholder="public sector transformation, enterprise modernization"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors self-start"
            >
              Find company matches
            </button>
          </form>

          {fitResults.length > 0 && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {fitResults.map((company) => (
                <div key={company.name} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900 leading-tight">{company.name}</p>
                      <p className="text-[12px] text-slate-500">{company.sector}</p>
                    </div>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Fit score {company.score}</span>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed mb-2">{company.whyFit}</p>
                  <p className="text-[12px] text-slate-500">Signals: {company.strengths.join(', ')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveToTargetList(company)}
                      disabled={targetList.some((item) => item.name === company.name)}
                      className="text-[12px] px-3 py-1.5 rounded border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {targetList.some((item) => item.name === company.name) ? 'Saved' : 'Save to Target List'}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadInBrief(company.name)}
                      className="text-[12px] px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Use in live brief
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Demo pipeline view</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Kenneth target list</h2>
          <p className="text-[14px] text-slate-600 mb-5">
            This shows the handoff from fit discovery into pipeline targets. Saved companies are ready for briefing and outreach planning.
          </p>

          {targetList.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-[13px] text-slate-500 bg-slate-50">
              No saved targets yet. Use Save to Target List on any company match above.
            </div>
          ) : (
            <div className="space-y-3">
              {targetList.map((company) => (
                <div key={company.name} className="border border-slate-200 rounded-xl p-4 bg-white flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">{company.name}</p>
                    <p className="text-[12px] text-slate-500 mb-1">{company.sector}</p>
                    <p className="text-[13px] text-slate-700 leading-relaxed">{company.whyFit}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Fit {company.score}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded">{company.stage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Brief demo</p>
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Generate the company brief on the fly</h2>
          <p className="text-[14px] text-slate-600 mb-5">Use this as a transition scenario: choose Kenneth's target company and target role, then show the brief quality before high-stakes interviews.</p>

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
                placeholder="Enterprise CIO (Next Role)"
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
            {companyBriefStatus && <p className="text-[12px] text-slate-500">{companyBriefStatus}</p>}
            {companyFirstTokenSlow && <p className="text-[12px] text-slate-500">First response chunk is taking longer than usual.</p>}
            {lastCompanyRequest && !companyBriefLoading && (
              <button
                type="button"
                onClick={retryCompanyBrief}
                className="text-[12px] text-slate-600 underline underline-offset-2 hover:text-slate-900 self-start"
              >
                Retry last request
              </button>
            )}
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
          <h2 className="text-[24px] font-bold text-slate-900 leading-tight mb-2">Kenneth transition brief at the named company and role</h2>
          <p className="text-[14px] text-slate-600 mb-5">
            Generate a tailored executive-in-transition brief from Kenneth's profile, showing how his past outcomes map to target-company priorities.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="border border-slate-200 rounded p-4 bg-slate-50">
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-2">Profile snapshot ({activeProfile.label})</p>
              <pre className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">{activeProfile.resume}</pre>
            </div>
            <div className="border border-slate-200 rounded p-4 bg-slate-50">
              <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-2">LinkedIn-style summary</p>
              <p className="text-[12px] text-slate-700 leading-relaxed">{activeProfile.linkedin}</p>
            </div>
          </div>

          <form onSubmit={generateTailoredBrief} className="border border-slate-200 rounded p-5 bg-slate-50 flex flex-col gap-4">
            <div>
              <label htmlFor="demo-archetype" className="block text-[11px] font-bold tracking-[0.07em] uppercase text-slate-400 mb-1.5">Profile source</label>
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
                placeholder="Enterprise CIO (Next Role)"
                required
              />
            </div>
            <button
              type="submit"
              disabled={tailoredLoading || !tailoredCompany.trim() || !tailoredRole.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors self-start"
            >
                  {tailoredLoading ? 'Generating...' : 'Generate Kenneth-tailored brief'}
            </button>
            {tailoredStatus && <p className="text-[12px] text-slate-500">{tailoredStatus}</p>}
            {tailoredFirstTokenSlow && <p className="text-[12px] text-slate-500">First response chunk is taking longer than usual.</p>}
            {lastTailoredRequest && !tailoredLoading && (
              <button
                type="button"
                onClick={retryTailoredBrief}
                className="text-[12px] text-slate-600 underline underline-offset-2 hover:text-slate-900 self-start"
              >
                Retry last request
              </button>
            )}
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

