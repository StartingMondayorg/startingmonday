'use client'
import Link from 'next/link'
import { useState } from 'react'
import { BriefRating } from '@/app/(dashboard)/dashboard/_components/BriefRating'
import { markContactSent, remindLater } from '../../actions'

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
  const [showHistory, setShowHistory] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [showInformed, setShowInformed] = useState(false)
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-300"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <Link href={`/dashboard/contacts/${contact.id}`} className="text-[13px] text-slate-400 hover:text-slate-300 transition-colors">
            ← {contact.name}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {profileScore < 50 && (
          <div className="mb-6 px-5 py-4 bg-amber-500/10 border border-amber-300/30 rounded flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-amber-100">
                Your draft quality is limited by an incomplete profile.
              </p>
              <p className="text-[12px] text-amber-200 mt-1 leading-relaxed">
                The AI is working with partial information. A complete profile (resume, positioning, targets) produces outreach that reads as if you wrote it yourself instead of generic templates.
              </p>
            </div>
            <Link
              href="/dashboard/profile#section-resume"
              className="shrink-0 text-[12px] font-semibold text-amber-100 border border-amber-300/40 hover:border-amber-300/70 px-3 py-1.5 rounded transition-colors"
            >
              Complete profile →
            </Link>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-white">Draft outreach</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            To <span className="font-semibold text-slate-200">{contact.name}</span>
            {subtitle ? <span className="text-slate-400"> · {subtitle}</span> : null}
          </p>
        </div>

        {companyId && contact.company_name && (
          <div className="mb-5 rounded border border-white/15 bg-white/5 px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Brief launcher</p>
            <p className="text-[13px] text-slate-300 leading-relaxed mb-3">
              Before you send this note, open the prep brief for {contact.company_name} so your outreach lands with company-specific context.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/companies/${companyId}/prep`}
                className="inline-flex min-h-[40px] items-center rounded bg-orange-500 px-3 text-[12px] font-semibold text-slate-950 hover:bg-orange-400"
              >
                Open company brief
              </Link>
              <Link
                href={`/dashboard/companies/${companyId}`}
                className="inline-flex min-h-[40px] items-center rounded border border-white/20 bg-white/5 px-3 text-[12px] font-semibold text-slate-200 hover:border-white/40"
              >
                Open company page
              </Link>
              <Link
                href="/dashboard/briefing"
                className="inline-flex min-h-[40px] items-center rounded border border-white/20 bg-white/5 px-3 text-[12px] font-semibold text-slate-200 hover:border-white/40"
              >
                Open daily briefing
              </Link>
            </div>
          </div>
        )}

        {recentSignals.length > 0 && (
          <div className="mb-5 bg-amber-500/10 border border-amber-300/30 rounded px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-amber-200 mb-2">Recent signals at {contact.company_name ?? 'their company'}</p>
            <ul className="flex flex-col gap-2">
              {recentSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-[10px] font-bold uppercase text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded mt-0.5">
                    {s.signalType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[13px] text-slate-200 leading-snug">{s.summary}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-200 mt-2 italic">Use a signal as a natural reason to reconnect, not as the pitch.</p>
          </div>
        )}

        <div className="bg-white/5 border border-white/15 rounded p-6 mb-4">
          <div className="mb-4">
            <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Goal
            </label>
            <select
              aria-label="Outreach goal"
              value={goal}
              onChange={e => { setGoal(e.target.value); setCustomGoal('') }}
              className="w-full border border-white/15 bg-slate-900 rounded px-3 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-white/40"
            >
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="custom">Custom goal…</option>
            </select>
            {goal === 'custom' && (
              <input
                type="text"
                value={customGoal}
                onChange={e => setCustomGoal(e.target.value)}
                placeholder="Describe what you want to accomplish"
                className="w-full mt-2 border border-white/15 bg-slate-950/70 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-white/40"
              />
            )}
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Additional context <span className="font-normal text-slate-300">(optional)</span>
            </label>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. We met at the CFO Summit last month, they mentioned a transformation role opening up in Q3…"
              rows={3}
              className="w-full border border-white/15 bg-slate-950/70 rounded px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-white/40 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!!loading || (goal === 'custom' && !customGoal.trim())}
            className="bg-orange-500 hover:bg-orange-400 text-slate-950 text-[13px] font-semibold px-5 py-2.5 rounded cursor-pointer border-0 disabled:opacity-50"
          >
            {loading === 'generate' ? 'Drafting…' : draft ? 'Regenerate' : 'Generate draft'}
          </button>
        </div>

        {draft && (
          <div className="bg-white/5 border border-white/15 rounded p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">Draft</p>
              <div className="flex items-center gap-2">
                {sent ? (
                  <span className="text-[12px] font-semibold text-emerald-300">Marked as sent</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkSent}
                    disabled={!!loading}
                    className="text-[12px] font-semibold text-slate-400 hover:text-white border border-white/15 rounded px-3 py-1 cursor-pointer bg-white/5/5 disabled:opacity-40"
                  >
                    {loading === 'sent' ? 'Saving…' : 'Mark as sent'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[12px] font-semibold text-slate-400 hover:text-white border border-white/15 rounded px-3 py-1 cursor-pointer bg-white/5"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="text-[14px] text-slate-100 leading-relaxed whitespace-pre-wrap mb-4">{draft}</div>

            {!loading && (
              <div className="flex gap-2 mb-4">
                <a
                  href={contact.email
                    ? `mailto:${contact.email}?subject=Introduction&body=${encodeURIComponent(draft)}`
                    : `mailto:?subject=Introduction&body=${encodeURIComponent(draft)}`}
                  className="text-[12px] font-semibold text-slate-400 hover:text-white border border-white/15 rounded px-3 py-1 transition-colors"
                >
                  Draft email ↗
                </a>
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-semibold text-slate-400 hover:text-white border border-white/15 rounded px-3 py-1 transition-colors"
                  >
                    Open LinkedIn ↗
                  </a>
                )}
              </div>
            )}

            {showCopyPrompt && !sent && !loading && (
              <div className="mb-4 px-4 py-3 bg-white/5 border border-white/15 rounded flex items-center justify-between gap-4">
                <p className="text-[13px] text-slate-300">Paste this into LinkedIn or email, then mark it sent here.</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMarkSent}
                    className="text-[12px] font-semibold text-slate-950 bg-orange-500 hover:bg-orange-400 rounded px-3 py-1 cursor-pointer border-0"
                  >
                    Mark as sent
                  </button>
                  <button
                    type="button"
                    onClick={handleRemindLater}
                    className="text-[12px] font-semibold text-slate-400 hover:text-white border border-white/15 rounded px-3 py-1 cursor-pointer bg-white/5"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
            )}

            {sent && (
              <div className="mb-5 px-3 py-2 bg-emerald-500/10 border border-emerald-300/30 rounded text-[12px] text-emerald-200">
                Logged as contacted. A follow-up has been added for 5 days from now.
              </div>
            )}

            {actionError && (
              <div className="mb-5 px-3 py-2 bg-rose-500/10 border border-rose-300/30 rounded text-[12px] text-rose-200">
                {actionError}
              </div>
            )}

            {draftId && !loading && (
              <div className="mb-5 flex justify-end">
                <BriefRating briefId={draftId} />
              </div>
            )}

            {!loading && (
              <div className="mb-4 border border-white/10 rounded">
                <button
                  type="button"
                  onClick={() => setShowInformed(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-transparent cursor-pointer border-0"
                >
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">
                    What the AI knew about this draft
                  </span>
                  <span className="text-[11px] text-slate-300">{showInformed ? '▲' : '▼'}</span>
                </button>
                {showInformed && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5 border-t border-white/10">
                    {(roleType || fullName) && (
                      <div className="flex items-start gap-2 text-[12px] text-slate-300">
                        <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                        <span>
                          Your background{roleType ? ` as ${ROLE_TYPE_LABELS[roleType] ?? roleType}` : ''}{fullName ? ` (${fullName})` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-[12px] text-slate-300">
                      <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                      <span>
                        {contact.name}{contact.title ? `, ${contact.title}` : ''}{contact.firm ?? contact.company_name ? ` at ${contact.firm ?? contact.company_name}` : ''}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-[12px] text-slate-300">
                      <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                      <span>Goal: {customGoal.trim() || goal}</span>
                    </div>
                    {contact.channel && (
                      <div className="flex items-start gap-2 text-[12px] text-slate-300">
                        <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                        <span>Channel: {CHANNEL_LABELS[contact.channel] ?? contact.channel}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="flex items-start gap-2 text-[12px] text-slate-300">
                        <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                        <span>Contact notes: {contact.notes.slice(0, 120)}{contact.notes.length > 120 ? '…' : ''}</span>
                      </div>
                    )}
                    {additionalContext.trim() && (
                      <div className="flex items-start gap-2 text-[12px] text-slate-300">
                        <span className="text-slate-300 shrink-0 mt-0.5">-</span>
                        <span>Your additional context: {additionalContext.trim().slice(0, 120)}</span>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-300">A blank AI window cannot access any of this.</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-3">Refine</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {REFINE_BUTTONS.map(({ style, label }) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleRefine(style)}
                    disabled={!!loading}
                    className="text-[12px] font-medium text-slate-300 border border-white/15 rounded px-3 py-1.5 hover:bg-white/5 hover:border-white/20 cursor-pointer bg-white/5/5 disabled:opacity-40"
                  >
                    {loading === style ? 'Rewriting…' : label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRefine}
                  onChange={e => setCustomRefine(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCustomRefine() }}
                  placeholder="Or describe your edit…"
                  disabled={!!loading}
                  className="flex-1 border border-white/15 rounded px-3 py-1.5 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40 disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleCustomRefine}
                  disabled={!!loading || !customRefine.trim()}
                  className="text-[12px] font-medium text-slate-300 border border-white/15 rounded px-3 py-1.5 hover:bg-white/5 cursor-pointer bg-white/5/5 disabled:opacity-40 shrink-0"
                >
                  {loading === 'custom' ? 'Rewriting…' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white/5 border border-white/15 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHistory(h => !h)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer bg-transparent border-0"
            >
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-400">
                Previous drafts ({history.length})
              </span>
              <span className="text-[11px] text-slate-400">{showHistory ? '▲' : '▼'}</span>
            </button>
            {showHistory && (
              <div className="divide-y divide-white/5 border-t border-white/10">
                {history.map(h => (
                  <div key={h.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-400">{formatDate(h.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 bg-transparent border-0 cursor-pointer"
                      >
                        {expandedHistory === h.id ? 'Collapse' : 'View'}
                      </button>
                    </div>
                    {expandedHistory === h.id ? (
                      <div className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">{h.text}</div>
                    ) : (
                      <p className="text-[13px] text-slate-400 truncate">{h.text.slice(0, 100)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

