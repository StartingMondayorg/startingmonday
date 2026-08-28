'use client'
import Link from 'next/link'
import { useState } from 'react'
import { BriefRating } from '@/app/(dashboard)/dashboard/_components/BriefRating'
import { markContactSent, remindLater } from '../../actions'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
const GOALS = [
  'Request a 20-minute exploratory call',
  'Ask about open roles at their company',
  'Request an introduction to someone they know',
  'Follow up after an introduction or referral',
  'Follow up after a meeting or event',
  'Express interest in a specific role',
  'Ask for advice or a perspective on my search',
]

const REFINE_BUTTONS = [
  { style: 'concise', label: 'Concise' },
  { style: 'warmer', label: 'Warmer' },
  { style: 'sharper', label: 'Sharper' },
  { style: 'thoughtful', label: 'More Thoughtful' },
]

type Contact = {
  id: string
  name: string
  title: string | null
  firm: string | null
  channel: string | null
  notes: string | null
  company_name: string | null
  email: string | null
  linkedin_url: string | null
}

type DraftHistory = {
  id: string
  text: string
  createdAt: string
}

async function saveDraft(text: string, contactId: string): Promise<string | null> {
  try {
    const res = await fetch('/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'outreach', text, contact_id: contactId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.id ?? null
  } catch {
    return null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ROLE_TYPE_LABELS: Record<string, string> = {
  cio: 'CIO', cto: 'CTO', cdo_data: 'CDO (Data)', cdo_digital: 'CDO (Digital)',
  ciso: 'CISO', cpo: 'CPO', coo: 'COO', vp_technology: 'VP of Technology', other_csuite: 'C-Suite Executive',
}

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', referral: 'Referral', cold: 'Cold outreach', inbound: 'Inbound', event: 'Event',
}

type RecentSignal = { signalType: string; summary: string; date: string }

export function OutreachClient({
  contact,
  companyId,
  history,
  profileScore,
  roleType,
  fullName,
  recentSignals = [],
}: {
  contact: Contact
  companyId: string | null
  history: DraftHistory[]
  profileScore: number
  roleType: string | null
  fullName: string | null
  recentSignals?: RecentSignal[]
}) {
  const [goal, setGoal] = useState(GOALS[0])
  const [customGoal, setCustomGoal] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [draft, setDraft] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showCopyPrompt, setShowCopyPrompt] = useState(false)
  const [sent, setSent] = useState(false)
  const [customRefine, setCustomRefine] = useState('')
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const subtitle = [contact.title, contact.firm ?? contact.company_name].filter(Boolean).join(' · ')

  async function streamDraft(body: Record<string, unknown>, label: string) {
    setLoading(label)
    setDraftId(null)
    setCopied(false)
    setShowCopyPrompt(false)
    setSent(false)
    setActionError('')
    try {
      const res = await fetch('/api/outreach/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok || !res.body) {
        const text = await res.text()
        setDraft(`Error: ${text}`)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setDraft('')
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setDraft(text)
      }
      if (text && !text.startsWith('Error:')) {
        const id = await saveDraft(text, contact.id)
        setDraftId(id)
      }
    } finally {
      setLoading(null)
    }
  }

  function handleGenerate() {
    return streamDraft({
      contactId: contact.id,
      goal: customGoal.trim() || goal,
      additionalContext: additionalContext.trim() || undefined,
    }, 'generate')
  }

  function handleRefine(style: string) {
    return streamDraft({
      contactId: contact.id,
      currentDraft: draft,
      refineStyle: style,
    }, style)
  }

  function handleCustomRefine() {
    if (!customRefine.trim()) return
    return streamDraft({
      contactId: contact.id,
      currentDraft: draft,
      refineInstruction: customRefine.trim(),
    }, 'custom')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setShowCopyPrompt(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMarkSent() {
    setLoading('sent')
    setActionError('')
    try {
      const result = await markContactSent(contact.id, contact.name)
      if (result.ok) {
        setSent(true)
        setShowCopyPrompt(false)
        return
      }

      setActionError(result.error ?? 'Could not mark this outreach as sent.')
    } finally {
      setLoading(null)
    }
  }

  async function handleRemindLater() {
    setLoading('remind')
    setActionError('')
    try {
      const result = await remindLater(contact.id, contact.name)
      if (!result.ok) {
        setActionError(result.error ?? 'Could not create a reminder for this outreach.')
        return
      }

      setShowCopyPrompt(false)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/80">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <Link href={`/dashboard/contacts/${contact.id}`} className="text-[13px] text-muted-foreground transition-colors">
            ← {contact.name}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {profileScore < 50 && (
          <Alert variant="warning" className="mb-6 px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <AlertTitle className="text-[13px] font-semibold text-warning">
                Your draft quality is limited by an incomplete profile.
              </AlertTitle>
              <AlertDescription className="text-[12px] text-warning mt-1 leading-relaxed">
                The AI is working with partial information. A complete profile (resume, positioning, targets) produces outreach that reads as if you wrote it yourself instead of generic templates.
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-warning/40 text-[12px] font-semibold text-warning hover:border-warning/70"
              render={<Link href="/dashboard/profile#section-resume" />}
            >
              Complete profile →
            </Button>
          </Alert>
        )}

        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-foreground">Draft outreach</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            To <span className="font-semibold text-foreground">{contact.name}</span>
            {subtitle ? <span className="text-muted-foreground"> · {subtitle}</span> : null}
          </p>
        </div>

        {companyId && contact.company_name && (
          <Card variant="glass" className="mb-5 rounded border-border bg-muted/40 px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Brief launcher</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
              Before you send this note, open the prep brief for {contact.company_name} so your outreach lands with company-specific context.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button className="min-h-[40px] text-[12px] font-semibold" render={<Link href={`/dashboard/companies/${companyId}/prep`} />}>
                Open company brief
              </Button>
              <Button variant="outline" className="min-h-[40px] border-border bg-muted/40 text-[12px] font-semibold text-foreground" render={<Link href={`/dashboard/companies/${companyId}`} />}>
                Open company page
              </Button>
              <Button variant="outline" className="min-h-[40px] border-border bg-muted/40 text-[12px] font-semibold text-foreground" render={<Link href="/dashboard/briefing" />}>
                Open daily briefing
              </Button>
            </div>
          </Card>
        )}

        {recentSignals.length > 0 && (
          <Alert variant="warning" className="mb-5 px-5 py-4">
            <AlertTitle className="text-[10px] font-bold tracking-[0.12em] uppercase text-warning mb-2">
              Recent signals at {contact.company_name ?? 'their company'}
            </AlertTitle>
            <ul className="flex flex-col gap-2">
              {recentSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge variant="warning" className="shrink-0 uppercase mt-0.5">
                    {s.signalType.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[13px] text-foreground leading-snug">{s.summary}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-warning mt-2 italic">Use a signal as a natural reason to reconnect, not as the pitch.</p>
          </Alert>
        )}

        <Card variant="glass" className="rounded border-border bg-muted/40 p-6 mb-4">
          <div className="mb-4">
            <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
              Goal
            </Label>
            <Select
              value={goal}
              onValueChange={(value) => { if (value) { setGoal(value); setCustomGoal('') } }}
            >
              <SelectTrigger aria-label="Outreach goal" className="w-full border-border bg-card text-[13px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                <SelectItem value="custom">Custom goal…</SelectItem>
              </SelectContent>
            </Select>
            {goal === 'custom' && (
              <Input
                type="text"
                value={customGoal}
                onChange={e => setCustomGoal(e.target.value)}
                placeholder="Describe what you want to accomplish"
                className="w-full mt-2 border-border bg-background/70 text-[13px] text-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          <div className="mb-5">
            <Label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
              Additional context <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. We met at the CFO Summit last month, they mentioned a transformation role opening up in Q3…"
              rows={3}
              className="w-full border-border bg-background/70 text-[13px] text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!!loading || (goal === 'custom' && !customGoal.trim())}
            className="text-[13px] font-semibold px-5 py-2.5"
          >
            {loading === 'generate' ? 'Drafting…' : draft ? 'Regenerate' : 'Generate draft'}
          </Button>
        </Card>

        {draft && (
          <Card variant="glass" className="rounded border-border bg-muted/40 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Draft</p>
              <div className="flex items-center gap-2">
                {sent ? (
                  <Badge variant="success" className="text-[12px] font-semibold">Marked as sent</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMarkSent}
                    disabled={!!loading}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border-border bg-muted/40"
                  >
                    {loading === 'sent' ? 'Saving…' : 'Mark as sent'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border-border bg-muted/40"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap mb-4">{draft}</div>

            {!loading && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border-border"
                  render={<a
                    href={contact.email
                      ? `mailto:${contact.email}?subject=Introduction&body=${encodeURIComponent(draft)}`
                      : `mailto:?subject=Introduction&body=${encodeURIComponent(draft)}`}
                  />}
                >
                  Draft email ↗
                </Button>
                {contact.linkedin_url && (
                  <Button
                    variant="outline"
                    className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border-border"
                    render={<a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" />}
                  >
                    Open LinkedIn ↗
                  </Button>
                )}
              </div>
            )}

            {showCopyPrompt && !sent && !loading && (
              <Card variant="glass" className="mb-4 rounded border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-4">
                <p className="text-[13px] text-muted-foreground">Paste this into LinkedIn or email, then mark it sent here.</p>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" onClick={handleMarkSent} className="text-[12px] font-semibold px-3 py-1">
                    Mark as sent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemindLater}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border-border bg-muted/40"
                  >
                    Remind me later
                  </Button>
                </div>
              </Card>
            )}

            {sent && (
              <Alert variant="success" className="mb-5 px-3 py-2">
                <AlertDescription className="text-[12px]">
                  Logged as contacted. A follow-up has been added for 5 days from now.
                </AlertDescription>
              </Alert>
            )}

            {actionError && (
              <Alert variant="destructive" className="mb-5 px-3 py-2">
                <AlertDescription className="text-[12px]">{actionError}</AlertDescription>
              </Alert>
            )}

            {draftId && !loading && (
              <div className="mb-5 flex justify-end">
                <BriefRating briefId={draftId} />
              </div>
            )}

            {!loading && (
              <Collapsible className="mb-4 border border-border rounded">
                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-transparent cursor-pointer border-0">
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                    What the AI knew about this draft
                  </span>
                  <span className="text-[11px] text-muted-foreground">Details</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-3 flex flex-col gap-1.5 border-t border-border">
                  {(roleType || fullName) && (
                    <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                      <span>
                        Your background{roleType ? ` as ${ROLE_TYPE_LABELS[roleType] ?? roleType}` : ''}{fullName ? ` (${fullName})` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                    <span>
                      {contact.name}{contact.title ? `, ${contact.title}` : ''}{contact.firm ?? contact.company_name ? ` at ${contact.firm ?? contact.company_name}` : ''}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                    <span>Goal: {customGoal.trim() || goal}</span>
                  </div>
                  {contact.channel && (
                    <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                      <span>Channel: {CHANNEL_LABELS[contact.channel] ?? contact.channel}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                      <span>Contact notes: {contact.notes.slice(0, 120)}{contact.notes.length > 120 ? '…' : ''}</span>
                    </div>
                  )}
                  {additionalContext.trim() && (
                    <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
                      <span>Your additional context: {additionalContext.trim().slice(0, 120)}</span>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">A blank AI window cannot access any of this.</p>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Refine</p>
              <ToggleGroup
                value={loading && REFINE_BUTTONS.some(b => b.style === loading) ? [loading] : []}
                onValueChange={(values) => { if (values[0]) handleRefine(values[0]) }}
                variant="outline"
                className="mb-3 flex-wrap"
              >
                {REFINE_BUTTONS.map(({ style, label }) => (
                  <ToggleGroupItem
                    key={style}
                    value={style}
                    disabled={!!loading}
                    className="text-[12px] font-medium text-muted-foreground border-border bg-muted/40 disabled:opacity-40"
                  >
                    {loading === style ? 'Rewriting…' : label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customRefine}
                  onChange={e => setCustomRefine(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCustomRefine() }}
                  placeholder="Or describe your edit…"
                  disabled={!!loading}
                  className="flex-1 border-border text-[13px] text-foreground placeholder:text-muted-foreground disabled:opacity-40"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCustomRefine}
                  disabled={!!loading || !customRefine.trim()}
                  className="text-[12px] font-medium text-muted-foreground border-border bg-muted/40 disabled:opacity-40 shrink-0"
                >
                  {loading === 'custom' ? 'Rewriting…' : 'Apply'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {history.length > 0 && (
          <Collapsible className="rounded border border-border bg-muted/40 overflow-hidden">
            <CollapsibleTrigger className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer bg-transparent border-0">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
                Previous drafts ({history.length})
              </span>
              <span className="text-[11px] text-muted-foreground">Expand</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="divide-y divide-border border-t border-border">
              {history.map(h => (
                <div key={h.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-muted-foreground">{formatDate(h.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                    >
                      {expandedHistory === h.id ? 'Collapse' : 'View'}
                    </button>
                  </div>
                  {expandedHistory === h.id ? (
                    <div className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{h.text}</div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground truncate">{h.text.slice(0, 100)}</p>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </main>
    </div>
  )
}
