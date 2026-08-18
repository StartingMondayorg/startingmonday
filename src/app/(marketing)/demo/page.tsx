'use client'
import Link from 'next/link'
import { useState, useRef, Suspense } from 'react'
import { isEnabledFlag } from '@/lib/feature-flags'

const MAX_RUNS = 5

const DEMO_COMPANY = 'Salesforce'

const DEMO_ROLES = [
  'Chief Information Officer',
  'Chief Technology Officer',
  'Chief Information Security Officer',
  'VP of Engineering',
  'VP of Technology',
]

function renderInline(str: string) {
  return str.split(/\*\*(.+?)\*\*/g).map((chunk, index) =>
    index % 2 === 1 ? <strong key={index}>{chunk}</strong> : <span key={index}>{chunk}</span>
  )
}

function renderBrief(text: string, isStreaming: boolean) {
  const lines = text.split('\n')
  const nodes = lines.map((line, i) => {
    if (line.startsWith('# ')) return null
    if (line.trim() === '---' || line.trim() === '***') return null
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-orange-300 mt-8 mb-3 first:mt-0 pb-2 border-b border-white/10">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2.5 text-[14px] text-slate-200 leading-relaxed mb-2.5">
          <span className="text-slate-500 shrink-0 select-none mt-0.5">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    return (
      <p key={i} className="text-[14px] text-slate-200 leading-relaxed mb-2.5">
        {renderInline(line)}
      </p>
    )
  })
  if (isStreaming) {
    nodes.push(<span key="cursor" className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />)
  }
  return nodes
}

type DemoContentProps = {
  bypassGate?: boolean
  initialCompany?: string
  initialRole?: string
  autoGenerate?: boolean
}

export function DemoContent({
  bypassGate: _bypassGate = false,
  initialCompany: _initialCompany = '',
  initialRole: _initialRole = '',
  autoGenerate: _autoGenerate = false,
}: DemoContentProps = {}) {
  const premiumEnabled = isEnabledFlag(process.env.NEXT_PUBLIC_LUXURY_PHASE3_ENABLED)
  const [role, setRole] = useState(DEMO_ROLES[0])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [runCount, setRunCount] = useState(0)
  const briefRef = useRef<HTMLDivElement>(null)

  const runsLeft = MAX_RUNS - runCount
  const exhausted = runCount >= MAX_RUNS

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (loading || exhausted) return

    setContent('')
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: DEMO_COMPANY, role }),
      })

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          setError('Rate limit reached. Please try again in a moment.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      setRunCount(c => c + 1)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setContent(full)
      }

      if (full.startsWith('__ERROR__')) {
        setError('Something went wrong. Please try again.')
        setContent('')
      }

      setTimeout(() => {
        briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50rem] bg-[radial-gradient(ellipse_at_top_left,_rgba(193,127,59,0.16),_transparent_55%)]" />

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition-colors">Log in</Link>
            <Link href="/signup?from=demo" className="text-[13px] font-semibold text-slate-950 bg-orange-500 px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Page: single editorial flow */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <header className="pt-16 sm:pt-24 pb-12 sm:pb-16">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-300 mb-5">Live demo</p>
          <h1 className="font-serif text-[2.6rem] sm:text-[3.5rem] leading-[1.03] tracking-tight text-white mb-6">
            Walk in as a peer.<br className="hidden sm:block" /> Not a candidate.
          </h1>
          <p className="text-[16px] text-slate-300 leading-relaxed">
            A real brief. Generated from a sample executive background against Salesforce&rsquo;s actual business context. Every section specific to the role you choose.
          </p>
          <p className="mt-4 text-[12px] text-slate-400 leading-relaxed">
            Source note: sample brief structure is based on observed prep patterns across pilot cohorts and is displayed for demonstration only.
          </p>
        </header>

        {/* Form - flows directly from hero, no separate section header */}
        <div id="run-demo" ref={briefRef}>

          {runCount > 0 && runsLeft > 0 && (
            <p className="text-[12px] text-slate-500 mb-4">{runsLeft} run{runsLeft !== 1 ? 's' : ''} remaining in this session.</p>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="role-select" className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-400 mb-2">
                Role
              </label>
              <select
                id="role-select"
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={loading}
                aria-label="Demo role selector"
                className="w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-[15px] text-white focus:outline-none focus:border-orange-400/40 focus:ring-1 focus:ring-orange-400/20 backdrop-blur-sm"
              >
                {DEMO_ROLES.map(r => (
                  <option key={r} value={r} className="bg-slate-900">{r}</option>
                ))}
              </select>
            </div>

            {exhausted ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[15px] font-semibold text-white mb-2">Demo limit reached.</p>
                <p className="text-[13px] leading-relaxed text-slate-300 mb-5">
                  You have seen {MAX_RUNS} briefs. Create a free account to generate unlimited briefs for your own companies, with your background woven in.
                </p>
                <Link href="/signup?from=demo" className="inline-flex items-center rounded-full bg-orange-500 px-6 py-2.5 text-[13px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
                  Start free - 30 days, no card
                </Link>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-slate-950 text-[14px] font-semibold px-7 py-3 transition-colors cursor-pointer border-0 disabled:cursor-not-allowed"
              >
                {loading ? 'Building brief...' : content ? 'Regenerate' : 'Generate the brief'}
              </button>
            )}

            {error && <p className="text-[13px] text-red-400">{error}</p>}
          </form>

          {/* Loading indicator */}
          {loading && !content && (
            <div className="flex items-center gap-2.5 py-10">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:300ms]" />
              <span className="text-[13px] text-slate-500 ml-1">Building your brief...</span>
            </div>
          )}

          {/* Brief output */}
          {content && (
            <div className="mt-10 border-t border-white/10 pt-10">
              <div className="mb-6">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-orange-300 mb-1">Your brief</p>
                <p className="text-[13px] text-slate-500">{DEMO_COMPANY} - {role}</p>
              </div>
              <div className="space-y-0">
                {renderBrief(content, loading)}
              </div>
            </div>
          )}

          {/* Post-brief CTA */}
          {content && !loading && (
            <div className="mt-12 pt-10 border-t border-white/10 pb-20">
              <p className="font-serif text-[1.6rem] leading-snug text-white mb-3">
                Ready to walk in with this for your own targets?
              </p>
              <p className="text-[14px] text-slate-400 leading-relaxed mb-7">
                Your account generates briefs from your background, your companies, and current market signals - not a demo profile.
              </p>
              <Link href="/signup?from=demo" className="inline-flex items-center rounded-full bg-orange-500 px-7 py-3 text-[14px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
                Begin free trial
              </Link>
              <p className="mt-3 text-[12px] text-slate-600">30 days free. No credit card.</p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-slate-950/80 px-4 sm:px-6 py-6 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-[12px] text-slate-600 hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/signup?from=demo" className="text-[12px] font-semibold text-orange-400 hover:text-orange-300 transition-colors">Begin free trial {'->'}</Link>
          </div>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoContent />
    </Suspense>
  )
}

