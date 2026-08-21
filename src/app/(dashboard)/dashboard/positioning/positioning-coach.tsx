'use client'
import { useState, useRef, useEffect } from 'react'
import { Alert, AlertDescription, Button, Card, Textarea } from '@/components/ui'
type Message = { role: 'user' | 'assistant'; content: string }

type Context = {
  currentTitle: string
  currentCompany: string
  targetTitles: string[]
  resumeText: string
  positioningSummary: string
  beyondResume: string
}

type Props = {
  currentPositioning: string
  context: Context
}

const STARTER_PROMPTS = [
  "What's the weakest part of my current positioning?",
  'Help me frame a career pivot.',
  "I'm targeting a level jump to CIO. What's my story?",
  'I have an employment gap. How do I address it?',
]

function extractPositioningFromText(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const candidates: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const startsWithTitle = /^[A-Z]/.test(line) && line.length > 20 && line.length < 300
    if (startsWithTitle) {
      const block = [line]
      let j = i + 1
      while (j < lines.length && block.length < 3) {
        const next = lines[j]
        if (next.length > 20 && next.length < 300 && !next.startsWith('-') && !next.startsWith('*')) {
          block.push(next)
          j++
        } else {
          break
        }
      }
      if (block.length >= 2) {
        candidates.push(block.join(' '))
        i = j
        continue
      }
    }
    i++
  }
  return candidates.length ? candidates[candidates.length - 1] : null
}

export function PositioningCoach({ currentPositioning, context }: Props) {
  const [positioning, setPositioning] = useState(currentPositioning)
  const [editingPositioning, setEditingPositioning] = useState(false)
  const [positioningDraft, setPositioningDraft] = useState(currentPositioning)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [suggestedPositioning, setSuggestedPositioning] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function savePositioning(text: string) {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/positioning/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positioning: text }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setSaveError(data.error ?? 'Save failed.'); return }
      setPositioning(text)
      setPositioningDraft(text)
      setEditingPositioning(false)
      setSaved(true)
      setSuggestedPositioning(null)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(userText: string) {
    if (!userText.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')
    setSuggestedPositioning(null)

    try {
      const res = await fetch('/api/positioning/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Request failed.')
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      let isDone = false
      setMessages([...newMessages, { role: 'assistant', content: '' }])

      while (!isDone) {
        const { value, done } = await reader.read()
        isDone = done
        if (value) {
          const chunk = decoder.decode(value, { stream: !isDone })
          if (chunk.startsWith('__ERROR__')) {
            setError(chunk.replace('__ERROR__', ''))
            setMessages(newMessages)
            setLoading(false)
            return
          }
          assistantText += chunk
          setMessages([...newMessages, { role: 'assistant', content: assistantText }])
        }
      }

      const extracted = extractPositioningFromText(assistantText)
      if (extracted) setSuggestedPositioning(extracted)
    } catch {
      setError('Connection lost. Try again.')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Current positioning card */}
      <Card className="py-0 overflow-hidden">
        <div className="px-6 py-[18px] border-b border-border flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Your Current Positioning</span>
          {!editingPositioning && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setEditingPositioning(true); setPositioningDraft(positioning) }}
            >
              Edit
            </Button>
          )}
        </div>
        <div className="px-6 py-5">
          {editingPositioning ? (
            <>
              <Textarea
                value={positioningDraft}
                onChange={e => setPositioningDraft(e.target.value)}
                rows={4}
                className="mb-3"
                placeholder="2-3 sentences: your title + years of experience, what you're known for, and what you're targeting next."
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => savePositioning(positioningDraft)}
                  disabled={saving || !positioningDraft.trim()}
                  size="sm"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditingPositioning(false); setPositioningDraft(positioning) }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : positioning ? (
            <p className="text-[14px] text-foreground leading-relaxed">{positioning}</p>
          ) : (
            <p className="text-[13px] text-muted-foreground italic">No positioning statement yet. Use the coach below to build one.</p>
          )}
          {saveError && <p className="mt-2 text-[12px] text-destructive">{saveError}</p>}
          {saved && <p className="mt-2 text-[12px] text-success">Saved.</p>}
        </div>
      </Card>

      {/* Suggested positioning from AI */}
      {suggestedPositioning && (
        <Card className="bg-primary/10 border-primary/30 py-0 overflow-hidden">
          <div className="px-6 py-[18px] border-b border-primary/30 flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary">Suggested Positioning</span>
          </div>
          <div className="px-6 py-5">
            <p className="text-[14px] text-foreground leading-relaxed mb-4">{suggestedPositioning}</p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => savePositioning(suggestedPositioning)}
                disabled={saving}
                size="sm"
              >
                {saving ? 'Saving...' : 'Use this'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSuggestedPositioning(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Chat */}
      <Card className="py-0 overflow-hidden">
        <div className="px-6 py-[18px] border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Positioning Coach</span>
        </div>

        {/* Starter prompts - shown only before first message */}
        {messages.length === 0 && (
          <div className="px-6 pt-5 pb-3">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Start here</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map(prompt => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(prompt)}
                  className="hover:border-primary/30 hover:text-primary"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="px-6 py-5 flex flex-col gap-5 max-h-[560px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3'
                  : 'text-primary-foreground'
                }`}>
                  <p className={`text-[14px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {msg.content || (loading && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-75">.</span>
                        <span className="animate-pulse delay-150">.</span>
                      </span>
                    ) : '')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {error && (
          <div className="mx-6 mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-5 pt-3 border-t border-border">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask about your positioning..."
              rows={2}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0"
            >
              {loading ? '...' : 'Send'}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Press Enter to send, Shift+Enter for a new line.</p>
        </div>
      </Card>
    </div>
  )
}
