'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

type Source = {
  title: string
  url: string
}

type ChatTurn = {
  role: 'user' | 'assistant'
  text: string
  sources?: Source[]
  conservative?: boolean
}

const SUGGESTED_QUESTIONS = [
  'How do I get started and set up my profile?',
  'How do signals and the daily briefing work?',
  'How does billing and the free trial work?',
  'How do I generate a prep brief for a company?',
]

export function SupportChat({ onEscalate }: { onEscalate: (question: string) => void }) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const lastQuestionRef = useRef('')

  async function ask(raw?: string) {
    const q = (raw ?? question).trim()
    if (q.length < 3 || loading) return
    lastQuestionRef.current = q
    setQuestion('')
    setLoading(true)
    setTurns((prev) => [...prev, { role: 'user', text: q }])
    try {
      const res = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.answer) {
        setTurns((prev) => [...prev, {
          role: 'assistant',
          text: data.answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
          conservative: Boolean(data.conservative),
        }])
      } else {
        setTurns((prev) => [...prev, {
          role: 'assistant',
          text: data?.error ?? 'I could not answer that right now. Send it to the founder below and you will get a personal reply.',
          sources: [],
          conservative: true,
        }])
      }
    } catch {
      setTurns((prev) => [...prev, {
        role: 'assistant',
        text: 'Connection issue. Try again, or send your question to the founder below for a personal reply.',
        sources: [],
        conservative: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="glass" className="p-5 sm:p-8 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-300 mb-1">Instant answers</p>
      <h2 className="text-[18px] font-bold text-white leading-tight mb-1.5">Ask the support assistant</h2>
      <p className="text-[13px] text-slate-300 leading-relaxed mb-4 max-w-[58ch]">
        Answers come from the live product guide, so they stay current with the site.
        If anything is unclear, one click sends your question to a person.
      </p>

      {turns.length === 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              onClick={() => { void ask(s) }}
              className="h-auto min-h-[44px] whitespace-normal border-white/15 bg-white/5 px-3 py-2 text-left text-[13px] font-normal text-slate-200 hover:border-orange-300/60 hover:bg-white/10"
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <ScrollArea className="mb-4 max-h-[26rem] pr-1">
          <div className="space-y-3" aria-live="polite">
          {turns.map((turn, i) => (
            <div key={i} className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <Card
                variant="glass"
                className={
                  turn.role === 'user'
                    ? 'max-w-[85%] rounded-xl bg-orange-400/15 border-orange-300/25 px-4 py-2.5'
                    : 'max-w-[92%] rounded-xl px-4 py-3'
                }
              >
                <p className="text-[13px] text-slate-100 leading-relaxed whitespace-pre-line">{turn.text}</p>
                {turn.role === 'assistant' && (turn.sources?.length ?? 0) > 0 && (
                  <div className="mt-2.5 border-t border-white/10 pt-2.5">
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1.5">Sources</p>
                    <ul className="space-y-1">
                      {turn.sources!.slice(0, 4).map((source) => (
                        <li key={source.url}>
                          <Link href={source.url} className="text-[12px] text-orange-200 underline hover:text-orange-100">
                            {source.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {turn.role === 'assistant' && turn.conservative && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEscalate(lastQuestionRef.current)}
                    className="mt-2.5 min-h-[44px] border-orange-300/40 bg-orange-400/10 text-[12px] text-orange-200 hover:bg-orange-400/20"
                  >
                    Send this to the founder for a personal reply &rarr;
                  </Button>
                )}
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              Finding the answer...
            </div>
          )}
          </div>
        </ScrollArea>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); void ask() }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <Label htmlFor="support-chat-question" className="sr-only">Your question</Label>
        <Input
          id="support-chat-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Ask anything about Starting Monday..."
          className="flex-1 min-h-[44px] border-white/15 bg-slate-900/70 text-[14px] text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-300"
        />
        <Button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="min-h-[44px] px-6 text-[14px] bg-orange-400 text-slate-950 hover:bg-orange-300 shrink-0"
        >
          {loading ? 'Thinking...' : 'Ask'}
        </Button>
      </form>
    </Card>
  )
}
