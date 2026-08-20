'use client'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type Message = { role: 'user' | 'assistant'; content: string }

function ActionToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white text-[13px] font-medium px-5 py-3 rounded-full shadow-lg">
              <span className="text-amber-400">&#10003;</span>
      <span>{message}</span>
      <Link href="/dashboard" className="text-slate-400 hover:text-white underline text-[12px]">
        View pipeline
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-500 hover:text-white bg-transparent border-0 cursor-pointer ml-1 text-[16px] leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  )
}

const ASK_PROMPTS = [
  'What should I prioritize this week?',
  'Which companies should I be most aggressive about?',
]

const DO_PROMPTS = [
  'Move [company name] to interviewing',
  'Add a follow-up to call [name] on [date]',
  'Log that I heard back from [company]',
  'Archive [company] - they went cold',
]

function AssistantMessage({ content }: { content: string }) {
  if (!content.includes('[ACTION:')) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }
  const parts = content.split(/(\[ACTION:[^\]]+\])/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[ACTION:(.+)\]$/)
        if (match) {
          return (
            <Badge
              key={i}
              variant="warning"
              className="mx-0.5 gap-1.5 px-2.5 py-1 align-middle text-[11px]"
            >
              <span className="text-amber-500">&#10003;</span>
              {match[1]}
            </Badge>
          )
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>
      })}
    </>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [actionToast, setActionToast] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastSentRef = useRef('')

  useEffect(() => {
    fetch('/api/conversation')
      .then(r => r.json())
      .then(({ id, messages: saved }) => {
        if (saved?.length) setMessages(saved)
        if (id) setConversationId(id)
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const save = async (msgs: Message[], convId: string | null) => {
    try {
      const res = await fetch('/api/conversation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, conversationId: convId }),
      })
      if (!res.ok) return
      const { id } = await res.json()
      if (id && id !== convId) setConversationId(id)
    } catch {
      // Non-fatal: conversation will reload from last successful save on next page open
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    lastSentRef.current = text
    setRetryError(null)
    const userMessage: Message = { role: 'user', content: text }
    const newMessages: Message[] = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) {
        const errText = res.status === 402
          ? 'Chat requires a Search plan. Go to Settings → Billing to subscribe.'
          : 'Something went wrong. Try again.'
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: errText }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantContent += decoder.decode(value, { stream: true })
          setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
        }
      } catch {
        const errorMsg = assistantContent
          ? assistantContent + '\n\n[Connection lost. The response may be incomplete.]'
          : 'Connection lost. Please try again.'
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: errorMsg }
          return updated
        })
        return
      }

      if (assistantContent.startsWith('__ERROR__')) {
        const errorMsg = assistantContent.slice(9) || 'Something went wrong. Please try again.'
        setMessages(newMessages)
        setInput(lastSentRef.current)
        setRetryError(errorMsg)
        return
      }

      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: assistantContent }]
      setMessages(finalMessages)
      await save(finalMessages, conversationId)

      // Surface a confirmation toast whenever the AI executed an action
      const actionMatch = assistantContent.match(/\[ACTION:([^\]]+)\]/)
      if (actionMatch) {
        const actionCount = (assistantContent.match(/\[ACTION:/g) ?? []).length
        const label = actionCount > 1 ? `${actionCount} actions applied` : actionMatch[1].trim()
        setActionToast(label)
      }

    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const clearConversation = async () => {
    if (conversationId) {
      await fetch('/api/conversation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
    }
    setMessages([])
    setConversationId(null)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-white">
      <h1 className="sr-only">Career advisor chat</h1>
      {actionToast && (
        <ActionToast message={actionToast} onDismiss={() => setActionToast(null)} />
      )}
      {retryError && (
        <div data-testid="chat-retry-banner" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-950 text-white text-[13px] font-medium px-5 py-3 rounded-full shadow-lg">
          <span className="text-red-400">&#9888;</span>
          <span>{retryError}</span>
          <button
            type="button"
            onClick={() => { setRetryError(null); send() }}
            className="text-orange-400 hover:text-orange-300 underline text-[12px] bg-transparent border-0 cursor-pointer"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => setRetryError(null)}
            className="text-slate-500 hover:text-white bg-transparent border-0 cursor-pointer ml-1 text-[16px] leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      <header className="bg-slate-900 shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-3">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-2 sm:gap-6">
            {messages.length > 0 && !loading && !loadingHistory && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearConversation}
                className="hidden sm:inline-flex h-auto p-0 text-[12px] text-slate-400 hover:text-slate-300 hover:bg-transparent"
              >
                Clear
              </Button>
            )}
            <span className="hidden sm:inline text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">
              Chat
            </span>
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-md border border-slate-700 px-3 text-[12px] font-semibold text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 flex items-center gap-2 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse inline-block [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse inline-block [animation-delay:300ms]" />
          </div>
        ) : messages.length === 0 ? (
          <section id="chat-empty-state" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
            <p className="text-[22px] font-bold text-slate-900 mb-2">
              What would you like to work on?
            </p>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-8">
              Ask about your pipeline, or tell me to take action. I can move companies through stages, log follow-ups, and update notes directly.
            </p>
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Ask</h2>
                <div className="flex flex-col gap-2">
                  {ASK_PROMPTS.map(prompt => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                      className="h-auto justify-start whitespace-normal text-left text-[13px] font-normal text-slate-500 border-slate-200 px-4 py-3 hover:border-slate-400 hover:text-slate-700"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Tell me to</h2>
                <div className="flex flex-col gap-2">
                  {DO_PROMPTS.map(prompt => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                      className="h-auto justify-start whitespace-normal text-left text-[13px] font-normal text-slate-500 border-slate-200 px-4 py-3 hover:border-slate-400 hover:text-slate-700"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section id="chat-thread" className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <Card variant="glass" className="gap-0 border-transparent bg-slate-900 py-3 text-white text-[14px] px-4 rounded-2xl rounded-br-sm max-w-[95%] sm:max-w-[85%] sm:max-w-[70%] whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </Card>
                ) : (
                  <div className="text-[14px] text-slate-800 leading-relaxed max-w-[95%] sm:max-w-[85%]">
                    {msg.content ? (
                      <AssistantMessage content={msg.content} />
                    ) : (
                      <span className="inline-flex gap-1 items-center h-5">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </section>
        )}
      </div>

      <div id="chat-composer" className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-0 flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about your search…"
            rows={1}
            className="flex-1 min-h-0 rounded-xl px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-300 focus-visible:border-slate-400 focus-visible:ring-0 resize-none max-h-[140px]"
          />
          <Button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="h-auto bg-slate-900 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shrink-0"
          >
            Send
          </Button>
        </div>
        <p className="max-w-3xl mx-auto mt-2 text-[11px] text-slate-300">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  )
}

