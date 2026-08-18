'use client'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { BriefRating } from '@/app/(dashboard)/dashboard/_components/BriefRating'

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
    </>
  )
}

function renderBrief(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return null
    if (line.trim() === '---' || line.trim() === '***') return null
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mt-10 mb-4 first:mt-0 pb-2 border-b border-slate-100">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2.5 text-[14px] text-slate-700 leading-relaxed mb-2.5">
          <span className="text-slate-300 shrink-0 select-none mt-0.5">–</span>
          <BoldText text={line.slice(2)} />
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    return (
      <p key={i} className="text-[14px] text-slate-700 leading-relaxed mb-2.5">
        <BoldText text={line} />
      </p>
    )
  })
}

async function streamResponse(res: Response, onChunk: (text: string) => void) {
  if (!res.body) throw new Error('No body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}

async function saveBrief(type: string, text: string, companyId?: string, contactId?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, text, company_id: companyId, contact_id: contactId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.id ?? null
  } catch {
    return null
  }
}

type MissingField = { label: string; anchor: string }

export function StrategyClient({ missingFields }: { missingFields: MissingField[] }) {
  const [brief, setBrief] = useState('')
  const [briefId, setBriefId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const questionRef = useRef<HTMLInputElement>(null)

  async function handleGenerate() {
    setLoading(true)
    setBrief('')
    setBriefId(null)
    setError('')
    setAnswer('')
    setAnswerError('')
    setQuestion('')
    try {
      const res = await fetch('/api/strategy')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `Request failed (${res.status})`)
        return
      }
      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setBrief(fullText) })
      if (fullText.startsWith('__ERROR__')) {
        setError(fullText.slice(9))
        setBrief('')
      } else {
        const id = await saveBrief('strategy', fullText)
        setBriefId(id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleFollowup(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !brief || answerLoading) return
    setAnswerLoading(true)
    setAnswer('')
    setAnswerError('')
    try {
      const res = await fetch('/api/strategy/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, question: question.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setAnswerError(body?.error ?? `Request failed (${res.status})`)
        return
      }
      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setAnswer(fullText) })
      if (fullText.startsWith('__ERROR__')) {
        setAnswerError(fullText.slice(9))
        setAnswer('')
      }
    } catch (e) {
      setAnswerError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setAnswerLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link
            href="/dashboard"
            className="text-[13px] text-slate-300 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Search Strategy Brief</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">
              Your market position, target profile, outreach framework, and first 30 days.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="shrink-0 bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating…' : brief ? 'Regenerate' : 'Generate strategy brief'}
          </button>
        </div>

        {missingFields.length > 0 && !brief && (
          <div className="mb-6 px-5 py-4 bg-amber-50 border border-amber-200 rounded text-[13px] text-amber-800 leading-relaxed">
            <p className="font-semibold mb-2">Your brief will be generic without these fields:</p>
            <ul className="mb-2 space-y-0.5">
              {missingFields.map(f => (
                <li key={f.anchor} className="flex items-center gap-2">
                  <span className="text-amber-400">–</span>
                  <Link
                    href={`/dashboard/profile#${f.anchor}`}
                    className="underline hover:text-amber-900"
                  >
                    {f.label}
                  </Link>
                </li>
              ))}
            </ul>
            <span className="text-amber-700">Add them first for a sharper result. You can generate now and improve it after.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
            {error}
          </div>
        )}

        {!brief && !loading && !error && (
          <div className="bg-white border border-slate-200 rounded p-10 text-center">
            <p className="text-[14px] text-slate-400 leading-relaxed max-w-md mx-auto">
              Generates an honest read on your market position and a concrete action framework - based on your profile, target roles, and pipeline.
            </p>
          </div>
        )}

        {loading && !brief && (
          <div className="bg-white border border-slate-200 rounded p-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {brief && (
          <div className="bg-white border border-slate-200 rounded p-8">
            {renderBrief(brief)}
            {loading && (
              <span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}

        {briefId && !loading && (
          <div className="mt-3 flex justify-end">
            <BriefRating briefId={briefId} />
          </div>
        )}

        {brief && !loading && (
          <div className="mt-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                'Which target companies should I prioritize first?',
                'How should I handle gaps in my background?',
                'Draft a 30-second elevator pitch for my search',
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => { setQuestion(chip); questionRef.current?.focus() }}
                  className="text-[12px] text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:border-slate-400 hover:text-slate-700 bg-transparent cursor-pointer transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            <form onSubmit={handleFollowup} className="flex gap-3">
              <input
                ref={questionRef}
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Ask a follow-up question about your strategy…"
                disabled={answerLoading}
                className="flex-1 border border-slate-200 rounded px-4 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || answerLoading}
                className="shrink-0 bg-slate-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {answerLoading ? 'Thinking…' : 'Ask'}
              </button>
            </form>

            {answerError && (
              <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
                {answerError}
              </div>
            )}

            {(answer || answerLoading) && (
              <div className="mt-4 bg-white border border-slate-200 rounded p-6">
                {answer && (
                  <div className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {answer}
                  </div>
                )}
                {answerLoading && !answer && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse inline-block [animation-delay:300ms]" />
                  </div>
                )}
                {answerLoading && answer && (
                  <span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

