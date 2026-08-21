'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'
import { Alert, AlertDescription, Button, Card, Input, Textarea } from '@/components/ui'
type Status = 'idle' | 'uploading' | 'streaming' | 'done' | 'error'

const GRADE_SCORE: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 }
const SCORE_GRADE = ['F', 'D', 'C', 'B', 'A']

function extractOverallGrade(text: string): string | null {
  const matches = [...text.matchAll(/Grade:\s*\[?([A-F])\]?/g)]
  if (!matches.length) return null
  const scores = matches.map(m => GRADE_SCORE[m[1]] ?? 0)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return SCORE_GRADE[Math.round(avg)] ?? null
}

// Colour-code grades inline: A=green, B=blue, C=amber, D/F=red
function renderOutput(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Section headers
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-[13px] font-bold tracking-[0.1em] uppercase text-foreground mt-8 mb-3 first:mt-0 pb-2 border-b border-border">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="text-[15px] font-bold text-foreground mt-6 mb-2">
          {line.slice(4)}
        </h3>
      )
    }
    // Bold + grade lines like "**Headline** - Grade: [A]"
    if (line.startsWith('**')) {
      const gradeMatch = line.match(/Grade:\s*\[?([A-F])\]?/)
      const grade = gradeMatch?.[1]
      const gradeColor = grade === 'A' ? 'text-success bg-success/10'
        : grade === 'B' ? 'text-info bg-info/10'
        : grade === 'C' ? 'text-warning bg-warning/10'
        : 'text-destructive bg-destructive/10'

      const label = line.replace(/\*\*/g, '').replace(/\s*[--]\s*Grade:.*/, '').trim()
      return (
        <div key={i} className="flex items-center gap-3 mt-5 mb-1">
          <span className="text-[14px] font-bold text-foreground">{label}</span>
          {grade && (
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${gradeColor}`}>
              {grade}
            </span>
          )}
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-2" />
    return (
      <p key={i} className="text-[14px] text-foreground leading-relaxed mb-2">
        {line}
      </p>
    )
  })
}

function HelpPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={() => setOpen(o => !o)}
        className="rounded-full text-[11px] font-bold"
        aria-label="How to get your LinkedIn profile"
      >
        ?
      </Button>
      {open && (
        <Card className="absolute right-0 top-7 z-50 w-72 p-4 text-[12px] text-muted-foreground leading-relaxed shadow-lg">
          <p className="font-semibold text-foreground mb-3">How to get your LinkedIn profile text</p>

          <p className="font-semibold text-foreground mb-1">Easiest - works on every LinkedIn version:</p>
          <ol className="space-y-0.5 mb-3 pl-0 list-none">
            <li>1. Open your LinkedIn profile in a browser</li>
            <li>2. Press <span className="font-semibold">Ctrl+A</span> (Mac: <span className="font-semibold">Cmd+A</span>) - select all</li>
            <li>3. Press <span className="font-semibold">Ctrl+C</span> (Mac: <span className="font-semibold">Cmd+C</span>) - copy</li>
            <li>4. Paste into the text box</li>
          </ol>

          <p className="font-semibold text-foreground mb-1">Or export as PDF - button location varies:</p>
          <ul className="space-y-0.5 list-none pl-0 mb-0">
            <li><span className="font-medium text-muted-foreground">Resources</span> button &rarr; Save to PDF</li>
            <li><span className="font-medium text-muted-foreground">More</span> button &rarr; Save to PDF</li>
            <li><span className="font-medium text-muted-foreground">&hellip;</span> menu &rarr; Save to PDF</li>
          </ul>
        </Card>
      )}
    </div>
  )
}

export default function OptimizePage() {
  const ph = usePostHog()
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ''
    setStatus('uploading')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/linkedin-import/extract', { method: 'POST', body: formData })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.text) {
      setText(json.text)
      setStatus('idle')
    } else {
      setError(json.error ?? 'Failed to read PDF. Paste the text instead.')
      setStatus('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || status === 'streaming') return

    try {
      ph?.capture('profile_grade_submitted', { text_length: text.trim().length })
    } catch { /* analytics must not block */ }

    setStatus('streaming')
    setOutput('')
    setError('')

    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, email }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Something went wrong.')
      setStatus('error')
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let done = false

    while (!done) {
      const { value, done: d } = await reader.read()
      done = d
      if (value) setOutput(prev => prev + decoder.decode(value, { stream: !done }))
    }

    setStatus('done')
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSubmit = text.trim().length >= 100 && emailValid && status !== 'streaming' && status !== 'uploading'

  return (
    <div className="min-h-screen bg-muted font-sans">

      {/* Nav */}
      <header className="bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Button
              size="sm"
              className="!bg-muted hover:!bg-muted/90"
              render={<Link href="/signup" />}
            >
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
{/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-[28px] sm:text-[34px] font-bold text-foreground leading-tight">
            LinkedIn Profile Grader
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed max-w-lg mx-auto">
            Paste your LinkedIn profile for section grades, targeted rewrites, and a clear fix plan.
          </p>
          <p className="text-[13px] text-muted-foreground mt-2">Free. No account required. 3 analyses per day.</p>
        </div>

        {/* Input card */}
        <Card id="profile-input" className="overflow-hidden mb-6 py-0">
          <div className="px-6 py-[18px] border-b flex items-center justify-between">
            <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-foreground">Your LinkedIn Profile</h2>
            <div className="flex items-center gap-2">
              <HelpPopover />
              <label className="cursor-pointer">
                <span className="text-[12px] font-semibold text-muted-foreground border border-border rounded px-3 py-1.5 transition-colors">
                  {status === 'uploading' ? 'Reading PDF…' : 'Upload PDF'}
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  disabled={status === 'uploading' || status === 'streaming'}
                  onChange={handlePdfUpload}
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'Paste your LinkedIn profile text here - About section, Experience, Skills, Headline...\n\nQuickest: open your LinkedIn profile, press Ctrl+A (Cmd+A on Mac), then Ctrl+C, and paste here.\n\nOr export a PDF: on your profile look for Resources, More, or the ... menu ? Save to PDF ? open the PDF ? select all text ? paste here.'}
              rows={12}
              disabled={status === 'streaming'}
              className="w-full rounded-none border-0 px-6 py-4 text-[14px] resize-none leading-relaxed"
            />
            <div className="px-6 py-4 border-t">
              <div className="flex items-center gap-3 mb-3">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your work email to receive the analysis"
                  disabled={status === 'streaming'}
                  className="flex-1 text-[13px]"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-foreground">
                  {text.length > 0 ? `${text.length.toLocaleString()} characters` : 'Min. 100 characters'}
                </span>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="!bg-background hover:!bg-muted"
                >
                  {status === 'streaming' ? 'Analyzing…' : 'Analyze my profile'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Output */}
        {(output || status === 'streaming') && (
          <Card id="profile-analysis" className="overflow-hidden mb-6 py-0">
            <div className="px-6 py-[18px] border-b flex items-center justify-between">
              <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-foreground">Analysis</h2>
              {status === 'streaming' && (
                <span className="text-[11px] text-foreground animate-pulse">Thinking…</span>
              )}
            </div>
            <div className="px-6 py-6">
              {renderOutput(output)}
            </div>
          </Card>
        )}

        {/* Share card - shown after analysis completes */}
        {status === 'done' && (() => {
          const grade = extractOverallGrade(output)
          const shareText = grade
            ? `I just graded my LinkedIn profile on Starting Monday and got a ${grade} overall. Check yours free at startingmonday.app/optimize`
            : 'I just graded my LinkedIn profile on Starting Monday. Free executive career tool at startingmonday.app/optimize'
          const gradeColor = grade === 'A' ? 'text-success bg-success/10'
            : grade === 'B' ? 'text-info bg-info/10'
            : grade === 'C' ? 'text-warning bg-warning/10'
            : grade ? 'text-destructive bg-destructive/10'
            : ''
          function copyShare() {
            navigator.clipboard.writeText(shareText).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
          return (
            <Card id="share-score" className="p-5 mb-6 flex-row items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground">Share your score</span>
                {grade && (
                  <span className={`text-[14px] font-bold px-2.5 py-0.5 rounded ${gradeColor}`}>{grade}</span>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={copyShare}
                className="shrink-0"
              >
                {copied ? 'Copied!' : 'Copy to share'}
              </Button>
            </Card>
          )
        })()}

        {/* CTA - shown after analysis completes */}
        {status === 'done' && (
          <section id="next-step-cta" className="bg-background rounded p-6 sm:p-8 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">
              Now fix how you find the roles.
            </p>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-3">
              Strong profile. Better timing.
            </h2>
            <p className="text-[14px] text-foreground leading-relaxed mb-6 max-w-sm mx-auto">
              Profile quality is step one. Starting Monday tracks departures, board changes, and funding signals so you can move before formal search cycles start.
            </p>
            <Button
              size="lg"
              className="!bg-primary !text-primary-foreground hover:!bg-muted"
              render={<Link href="/signup" />}
            >
              Start your free 30-day trial &rarr;
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3">No credit card required to start.</p>
            <p className="text-[12px] text-muted-foreground mt-4">
              Want to see the platform first?{' '}
              <Link href="/demo" className="text-muted-foreground hover:text-foreground underline transition-colors">
                Explore a live demo &rarr;
              </Link>
            </p>
          </section>
        )}

      <footer className="mt-12 pb-8 text-center">
        <p className="text-[11px] text-foreground">
          &copy; {new Date().getFullYear()} Starting Monday. All rights reserved. - {' '}
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
        </p>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>

      </main>
    </div>
  )
}

