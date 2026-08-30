'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteFooter } from '@/app/components/SiteFooter'
import { Button, Card, Label, Textarea } from '@/components/ui'
const PROMPT_STARTERS = [
  'The signal timing helped me prioritize where to spend my outreach time.',
  'The daily briefing is useful, but I want a clearer weekly priority summary.',
  'The prep flow helped, and I would get more value with stronger contact tracking.',
]

function FeedbackForm() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code') ?? ''

  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || state === 'submitting') return
    setState('submitting')
    setErrorMessage(null)

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, invite_code: inviteCode }),
    })
    if (res.ok) {
      setState('done')
      return
    }

    const payload = await res.json().catch(() => null)
    setErrorMessage(payload?.error ?? 'Something went wrong. Please try again.')
    setState('error')
  }

  function applyStarter(textValue: string) {
    if (state === 'submitting') return
    setText(textValue)
  }

  const remaining = 1000 - text.length

  return (
    <div className="w-full max-w-2xl">
      <section className="mb-6">
        <h2 className="text-[13px] font-bold tracking-[0.18em] uppercase text-muted-foreground mb-4">
          Starting Monday Feedback
        </h2>
        {state === 'done' ? (
          <Card className="border-success/30 p-8 shadow-lg">
            <h2 className="text-[28px] font-bold text-foreground mb-2">Thank you.</h2>
            <p className="text-[16px] text-muted-foreground leading-relaxed">
              Your feedback is in. We use notes like this to sharpen what we build next.
            </p>
          </Card>
        ) : (
          <Card className="p-8 shadow-lg">
            <h1 className="text-[30px] font-bold text-foreground mb-3 leading-tight">One sentence is enough.</h1>
            <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[58ch]">
              Share one sentence about what worked, what did not, or what would make Starting Monday more useful in your search.
            </p>
            <p className="text-[14px] text-muted-foreground mt-3">Specific and honest beats polished.</p>

            <Card className="mt-6 bg-muted/80 p-4">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Quick starter (optional)</h2>
              <div className="flex flex-wrap gap-2">
                {PROMPT_STARTERS.map((starter) => (
                  <Button
                    key={starter}
                    type="button"
                    variant="outline"
                    onClick={() => applyStarter(starter)}
                    className="h-auto whitespace-normal px-3 py-2 text-left text-[13px] font-normal text-muted-foreground"
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="mt-5 bg-muted/80 p-4">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">How this is used</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                We use this feedback to shape roadmap priorities and improve product messaging. We do not publish private details from your account unless you explicitly approve public use.
              </p>
            </Card>

            <form onSubmit={handleSubmit} className="mt-5">
              <Label htmlFor="feedback-text" className="block text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
                Your one sentence
              </Label>
              <Textarea
                id="feedback-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Starting Monday helped me..."
                rows={5}
                maxLength={1000}
                className="w-full rounded-xl border-border px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-border/50 resize-none bg-card"
              />

              <div className="flex items-center justify-between mt-2 mb-4">
                <p className="text-[13px] text-muted-foreground">Stays confidential unless you approve otherwise.</p>
                <p className="text-[13px] text-muted-foreground">{remaining} chars left</p>
              </div>

              {state === 'error' && (
                <p className="text-[13px] text-destructive mb-3">{errorMessage}</p>
              )}

              <Button
                type="submit"
                disabled={!text.trim() || state === 'submitting'}
                className="w-full rounded-xl py-3.5 text-[15px] font-bold"
              >
                {state === 'submitting' ? 'Submitting feedback...' : 'Submit feedback'}
              </Button>
            </form>
          </Card>
        )}
      </section>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <div className="dark min-h-screen bg-background font-sans text-foreground">
      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded border border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:px-4"
            >
              Back to dashboard
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
            >
              Start now
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-muted/40 px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center">
          <Suspense>
            <FeedbackForm />
          </Suspense>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
