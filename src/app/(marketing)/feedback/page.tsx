'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteFooter } from '@/components/SiteFooter'

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
        <h2 className="text-[13px] font-bold tracking-[0.18em] uppercase text-slate-500 mb-4">
          Starting Monday Feedback
        </h2>
        {state === 'done' ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <h2 className="text-[28px] font-bold text-slate-900 mb-2">Thank you.</h2>
            <p className="text-[16px] text-slate-600 leading-relaxed">
              Your feedback is in. We use notes like this to sharpen what we build next.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <h1 className="text-[30px] font-bold text-slate-900 mb-3 leading-tight">One sentence is enough.</h1>
            <p className="text-[17px] text-slate-600 leading-relaxed max-w-[58ch]">
              Share one sentence about what worked, what did not, or what would make Starting Monday more useful in your search.
            </p>
            <p className="text-[14px] text-slate-500 mt-3">Specific and honest beats polished.</p>

            <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Quick starter (optional)</h2>
              <div className="flex flex-wrap gap-2">
                {PROMPT_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => applyStarter(starter)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-[13px] text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-1">How this is used</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                We use this feedback to shape roadmap priorities and improve product messaging. We do not publish private details from your account unless you explicitly approve public use.
              </p>
            </section>

            <form onSubmit={handleSubmit} className="mt-5">
              <label htmlFor="feedback-text" className="block text-[13px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-2">
                Your one sentence
              </label>
              <textarea
                id="feedback-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Starting Monday helped me..."
                rows={5}
                maxLength={1000}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300/50 resize-none bg-white"
              />

              <div className="flex items-center justify-between mt-2 mb-4">
                <p className="text-[13px] text-slate-500">Stays confidential unless you approve otherwise.</p>
                <p className="text-[13px] text-slate-500">{remaining} chars left</p>
              </div>

              {state === 'error' && (
                <p className="text-[13px] text-red-600 mb-3">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={!text.trim() || state === 'submitting'}
                className="w-full bg-slate-900 text-white text-[15px] font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === 'submitting' ? 'Submitting feedback...' : 'Submit feedback'}
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      <nav className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded border border-slate-600 px-3 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:text-white sm:px-4"
            >
              Back to dashboard
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded bg-orange-500 px-3 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-600 sm:px-4"
            >
              Start now
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-[radial-gradient(120%_140%_at_100%_0%,#dbeafe_0%,#e2e8f0_45%,#f8fafc_100%)] px-4 py-10">
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
