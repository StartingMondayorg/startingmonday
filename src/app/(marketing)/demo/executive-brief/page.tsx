'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Button, Card, Input, Label } from '@/components/ui'
function renderInline(str: string) {
  return str.split(/\*\*(.+?)\*\*/g).map((chunk, index) => (
    index % 2 === 1 ? <strong key={index}>{chunk}</strong> : <span key={index}>{chunk}</span>
  ))
}

function renderBrief(text: string, isStreaming: boolean) {
  const lines = text.split('\n')
  const nodes = lines.map((line, i) => {
    if (line.startsWith('# ')) return null
    if (line.trim() === '---' || line.trim() === '***') return null
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary mt-10 mb-4 first:mt-0 pb-2 border-b border-border">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2.5 text-[14px] text-foreground leading-relaxed mb-2.5">
          <span className="text-muted-foreground shrink-0 select-none mt-0.5">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    return (
      <p
        key={i}
        className="text-[14px] text-foreground leading-relaxed mb-2.5"
      >
        {renderInline(line)}
      </p>
    )
  })
  if (isStreaming) {
    nodes.push(
      <span key="cursor" className="inline-block w-0.5 h-4 bg-muted animate-pulse ml-0.5 align-middle" />
    )
  }
  return nodes
}

async function streamPreloadedBrief(onChunk: (text: string) => void): Promise<void> {
  const res = await fetch('/api/demo-brief/executive-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

async function streamCustomBrief(
  company: string,
  role: string,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch('/api/demo-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, role }),
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

export default function ExecutiveBriefDemoPage() {
  // Pre-loaded brief state
  const [preContent,  setPreContent]  = useState('')
  const [preLoading,  setPreLoading]  = useState(true)
  const [preError,    setPreError]    = useState(false)

  // Custom brief state
  const [company,     setCompany]     = useState('')
  const [role,        setRole]        = useState('')
  const [content,     setContent]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const customRef = useRef<HTMLDivElement>(null)

  // Auto-stream the Salesforce/VP of IT brief on mount
  useEffect(() => {
    let cancelled = false
    let full = ''
    setPreLoading(true)
    streamPreloadedBrief(chunk => {
      if (cancelled) return
      full += chunk
      if (full.startsWith('__ERROR__')) return
      setPreContent(full)
    }).catch(() => {
      if (!cancelled) setPreError(true)
    }).finally(() => {
      if (!cancelled) setPreLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim() || loading) return
    setContent('')
    setError('')
    setLoading(true)
    let full = ''
    try {
      await streamCustomBrief(company.trim(), role.trim(), chunk => {
        full += chunk
        setContent(full)
      })
      if (full.startsWith('__ERROR__')) {
        setError('Something went wrong. Please try again.')
        setContent('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
    setTimeout(() => customRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const inputCls  = 'border-border bg-muted/[0.04] text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50'
  const labelCls  = 'text-[11px] font-bold tracking-[0.07em] uppercase text-muted-foreground mb-1.5'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">

      <nav className="bg-background sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/demo/presenter" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Presenter mode
            </Link>
            <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-primary-foreground bg-primary px-4 py-1.5 rounded hover:bg-primary/90 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
{/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-3">For executive search listeners</p>
          <h1 className="text-[28px] font-bold text-foreground leading-tight mb-3">
            The prep brief. Before the interview.
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Search as a project needs fast research infrastructure. Below is a live brief for a VP of IT candidate at Salesforce.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            ['~1 minute', 'Typical prep brief generation window before a live conversation'],
            ['3 layers', 'Company context, likely objections, and peer-level questions in one artifact'],
            ['0 uploads required', 'The live example below is generated without a manual brief-writing workflow'],
          ].map(([value, label]) => (
            <Card key={value} variant="glass" className="!border-border !bg-muted/[0.03] p-4">
              <p className="text-[22px] font-bold text-foreground mb-1">{value}</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{label}</p>
            </Card>
          ))}
        </section>

        <Card variant="glass" className="mb-10 !border-success/25 !bg-success/10 p-5">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-success mb-2">Trust and use boundary</p>
          <p className="text-[13px] text-foreground leading-relaxed mb-2">
            This demo uses generated sample material for evaluation only. Customer searches and prep data remain private to account owners and invited collaborators.
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Verification path: review this example, generate your own brief, then compare prep time before a real interview.
          </p>
        </Card>

        {/* Pre-loaded brief: Salesforce / VP of IT */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Live example</span>
            <span className="text-muted-foreground text-[11px]">|</span>
            <span className="text-[12px] text-muted-foreground">Michael Torres - VP of IT candidate at Salesforce</span>
            {preLoading && (
              <span className="text-[11px] text-muted-foreground italic">generating...</span>
            )}
          </div>

          <Card variant="glass" className="!rounded !border-border !bg-muted/[0.03] p-6 sm:p-8 min-h-[120px]">
            {preError ? (
              <p className="text-[14px] text-destructive">Failed to load. Refresh to try again.</p>
            ) : preContent ? (
              renderBrief(preContent, preLoading)
            ) : (
              <div className="flex items-center gap-2 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:300ms]" />
              </div>
            )}
          </Card>
        </div>

        {/* Context note after brief */}
        {!preLoading && preContent && !preError && (
          <Card variant="glass" className="mb-12 !rounded !border-border !bg-muted/[0.03] px-5 py-4">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              In a full account this brief is generated automatically for every company in the pipeline, updates as new signals come in, and feeds the daily morning briefing. The user never has to build this from scratch.
            </p>
          </Card>
        )}

        {/* Divider */}
        <div className="border-t border-border mb-10" />

        {/* Generate your own */}
        <div ref={customRef}>
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Try it yourself</p>
          <h2 className="text-[20px] font-bold text-foreground mb-2">Generate a brief for any company and role.</h2>
          <p className="text-[13px] text-muted-foreground mb-6">
            Enter any target company and the role you are coaching for. The brief generates live.
          </p>

          <form onSubmit={handleGenerate} className="mb-8">
            <Card variant="glass" className="!rounded !border-border !bg-muted/[0.03] p-6 flex flex-col gap-4">
              <div>
                <Label className={labelCls}>Company <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Microsoft, Amazon, any company"
                  required
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Role <span className="text-destructive">*</span></Label>
                <Input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Chief Information Officer"
                  required
                  disabled={loading}
                  className={inputCls}
                />
              </div>
              <Button
                type="submit"
                disabled={!company.trim() || !role.trim() || loading}
                className="px-6 py-2.5 h-auto text-[13px] font-semibold self-start"
              >
                {loading ? 'Generating...' : content ? 'Regenerate' : 'Generate prep brief'}
              </Button>
              {error && <p className="text-[13px] text-destructive">{error}</p>}
            </Card>
          </form>

          {(content || loading) && (
            <Card variant="glass" className="!rounded !border-border !bg-muted/[0.03] p-6 sm:p-8 mb-8">
              {renderBrief(content, loading)}
              {loading && !content && (
                <div className="flex items-center gap-2 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse inline-block [animation-delay:300ms]" />
                </div>
              )}
            </Card>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-border pt-10">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-4">What a full account includes</p>
          <details className="group rounded-xl border border-border bg-muted/[0.03] overflow-hidden mb-8">
            <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/[0.05] transition-colors">
              <div>
                <p className="text-[14px] font-semibold text-foreground">Expand full account capabilities</p>
                <p className="text-[12px] text-muted-foreground mt-1">Signals, pipeline, briefing, outreach, and advisor support</p>
              </div>
              <span className="text-muted-foreground text-[18px] leading-none group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-5 pb-5 pt-1 border-t border-border flex flex-col gap-3">
              {[
                'This brief auto-generated for every company in the pipeline, updated as new signals come in',
                'Intelligence monitoring on every target company: exec moves, 8-K filings, funding rounds, career page changes, and pattern alerts before roles are posted',
                'Contact tracker with outreach drafting and recruiter firm grouping',
                'Daily morning briefing: signals, open actions, and pending matches in one email before the workday starts',
                'AI career advisor with visibility into the pipeline, history, and search progress',
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-primary font-bold text-[11px] shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </details>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/signup"
              className="inline-block bg-primary text-primary-foreground text-[13px] font-semibold px-6 py-2.5 rounded hover:bg-primary/90 transition-colors"
            >
              Start free trial &rarr;
            </Link>
            <p className="text-[12px] text-muted-foreground sm:mt-2.5">30 days free. No credit card.</p>
          </div>
        </div>

      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

