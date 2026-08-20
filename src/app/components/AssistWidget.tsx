'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Kind = 'feedback' | 'question'
type Status = 'idle' | 'submitting' | 'done' | 'error'

export function AssistWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<Kind>('feedback')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || message.trim().length < 10) return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message: message.trim(), email: email.trim(), page: pathname }),
      })
      if (res.ok) {
        setStatus('done')
        setMessage('')
        return
      }
      const payload = await res.json().catch(() => null)
      setErrorMessage(payload?.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  function handleToggle() {
    setOpen((prev) => !prev)
    if (status === 'done') {
      setStatus('idle')
    }
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 right-5 z-[70] font-sans">
      {open && (
        <Card variant="glass" className="mb-3 w-[min(92vw,22rem)] !bg-slate-950/95 p-5 shadow-[0_22px_66px_rgba(2,6,23,0.6)]">
          {status === 'done' ? (
            <div>
              <p className="text-[15px] font-bold text-white mb-1.5">Thank you.</p>
              <p className="text-[13px] text-slate-300 leading-relaxed mb-4">
                Your {kind === 'question' ? 'question' : 'feedback'} is in. We read every note, and questions get a personal reply.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatus('idle')}
                className="min-h-[44px] w-full !border-white/15 !bg-white/5 !text-slate-200 hover:!border-white/30 hover:!bg-white/10"
              >
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-200 mb-1">We&rsquo;re listening</p>
              <p className="text-[15px] font-bold text-white leading-snug mb-3">
                Share feedback or ask a question. A person reads every message.
              </p>

              <ToggleGroup
                value={[kind]}
                onValueChange={(values) => { if (values[0]) setKind(values[0] as Kind) }}
                aria-label="Message type"
                className="flex gap-2 mb-3 w-full"
              >
                {(['feedback', 'question'] as const).map((option) => (
                  <ToggleGroupItem
                    key={option}
                    value={option}
                    className={`flex-1 min-h-[44px] rounded-lg text-[13px] font-semibold ${
                      kind === option
                        ? '!bg-orange-400 !text-slate-950 !border-orange-300'
                        : '!bg-white/5 !text-slate-300 !border-white/15 hover:!border-white/30'
                    }`}
                  >
                    {option === 'feedback' ? 'Feedback' : 'Question'}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <label htmlFor="assist-message" className="sr-only">Your message</label>
              <Textarea
                id="assist-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={kind === 'question' ? 'What can we help with?' : 'What worked? What should we improve?'}
                className="w-full !border-white/15 !bg-slate-900/70 text-[14px] !text-slate-100 placeholder:!text-slate-500 focus-visible:!border-orange-300 resize-none"
              />

              <label htmlFor="assist-email" className="sr-only">Email for a reply (optional)</label>
              <Input
                id="assist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email for a reply (optional)"
                className="mt-2 w-full !border-white/15 !bg-slate-900/70 text-[13px] !text-slate-100 placeholder:!text-slate-500 focus-visible:!border-orange-300"
              />

              {errorMessage && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={status === 'submitting' || message.trim().length < 10}
                className="mt-3 w-full min-h-[44px]"
              >
                {status === 'submitting' ? 'Sending...' : kind === 'question' ? 'Ask question' : 'Send feedback'}
              </Button>
              <p className="mt-2.5 text-[11px] text-slate-500 leading-relaxed text-center">
                Private by default. Goes straight to the founder.
              </p>
            </form>
          )}
        </Card>
      )}

      <Button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label={open ? 'Close feedback panel' : 'Open feedback and questions panel'}
        className="ml-auto flex min-h-[44px] items-center gap-2 rounded-full !border !border-white/15 !bg-slate-950/90 px-4 text-[13px] font-semibold !text-slate-100 shadow-[0_14px_36px_rgba(2,6,23,0.5)] backdrop-blur-xl hover:!border-orange-300/60 hover:!text-white"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-orange-400" aria-hidden="true" />
        {open ? 'Close' : 'Feedback'}
      </Button>
    </div>
  )
}
