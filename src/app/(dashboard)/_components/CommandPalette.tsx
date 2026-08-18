'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Company = { id: string; name: string; stage: string | null; sector: string | null }
type Contact = { id: string; full_name: string; title: string | null; company_name: string | null }

type Result =
  | { kind: 'company'; item: Company }
  | { kind: 'contact'; item: Contact }
  | { kind: 'action'; label: string; sub: string; href: string; icon: string }

const QUICK_ACTIONS: Result[] = [
  { kind: 'action', label: 'Add company',         sub: 'Track a new target',         href: '/dashboard/companies/new', icon: '+' },
  { kind: 'action', label: 'Daily briefing',       sub: 'Today\'s intelligence',      href: '/dashboard/briefing',      icon: '◉' },
  { kind: 'action', label: 'Strategy brief',       sub: 'Your search playbook',       href: '/dashboard/strategy',      icon: '▶' },
  { kind: 'action', label: 'Chat with AI',         sub: 'Ask your advisor',           href: '/dashboard/chat',          icon: '✦' },
  { kind: 'action', label: 'Add contact',          sub: 'Log a relationship',         href: '/dashboard/contacts',      icon: '＋' },
  { kind: 'action', label: 'Follow-ups',           sub: 'Open actions for today',     href: '/dashboard/calendar',      icon: '◫' },
  { kind: 'action', label: 'Calendar',             sub: 'Upcoming follow-ups',        href: '/dashboard/calendar',      icon: '◫' },
  { kind: 'action', label: 'LinkedIn optimizer',   sub: 'Improve your profile',       href: '/optimize',                icon: '⭡' },
  { kind: 'action', label: 'Profile settings',     sub: 'Titles, sectors, briefing',  href: '/dashboard/profile',       icon: '◌' },
  { kind: 'action', label: 'Feedback',             sub: 'Tell us what to improve',    href: '/dashboard/feedback',      icon: '✉' },
  { kind: 'action', label: 'Invite',               sub: 'Bring in a peer',            href: '/dashboard/invite',        icon: '⇢' },
  { kind: 'action', label: 'Guide',                sub: 'How Starting Monday works',  href: '/guide',                   icon: '❖' },
  { kind: 'action', label: 'Help',                 sub: 'Getting started and FAQs',   href: '/dashboard/help',          icon: '?' },
  { kind: 'action', label: 'Billing',              sub: 'Manage your subscription',   href: '/settings/billing',        icon: '◈' },
]

function resultKey(r: Result) {
  if (r.kind === 'company') return `c-${r.item.id}`
  if (r.kind === 'contact') return `p-${r.item.id}`
  return `a-${r.label}`
}

function resultHref(r: Result): string {
  if (r.kind === 'company') return `/dashboard/companies/${r.item.id}`
  if (r.kind === 'contact') return `/dashboard/contacts/${r.item.id}`
  return r.href
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIdx(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20)
  }, [open])

  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current)
    if (!query.trim() || query.length < 2) {
      setResults(QUICK_ACTIONS)
      setActiveIdx(0)
      return
    }
    setLoading(true)
    fetchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const next: Result[] = [
          ...(data.companies ?? []).map((c: Company) => ({ kind: 'company' as const, item: c })),
          ...(data.contacts ?? []).map((p: Contact) => ({ kind: 'contact' as const, item: p })),
        ]
        const filtered = QUICK_ACTIONS.filter(a =>
          a.kind === 'action' && a.label.toLowerCase().includes(query.toLowerCase())
        )
        setResults([...next, ...filtered])
        setActiveIdx(0)
      } finally {
        setLoading(false)
      }
    }, 160)
  }, [query])

  useEffect(() => {
    if (!query && open) setResults(QUICK_ACTIONS)
  }, [open, query])

  function navigate(r: Result) {
    router.push(resultHref(r))
    close()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      navigate(results[activeIdx])
    }
  }

  if (!open) return null

  const displayList = results.length > 0 ? results : (query.length >= 2 && !loading ? [] : QUICK_ACTIONS)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onMouseDown={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-slate-400">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search companies, contacts, or actions..."
            className="flex-1 py-4 text-[15px] text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={close}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded border border-transparent hover:border-slate-200"
            aria-label="Close command palette"
          >
            Close
          </button>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {displayList.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-slate-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {displayList.length > 0 && (() => {
            const companies = displayList.filter(r => r.kind === 'company')
            const contacts  = displayList.filter(r => r.kind === 'contact')
            const actions   = displayList.filter(r => r.kind === 'action')
            let globalIdx   = 0

            function Row({ r }: { r: Result }) {
              const idx = globalIdx++
              const active = idx === activeIdx
              return (
                <button
                  key={resultKey(r)}
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => navigate(r)}
                  className={[
                    'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border-0 bg-transparent',
                    active ? 'bg-slate-50' : '',
                  ].join(' ')}
                >
                  {r.kind === 'company' && (
                    <>
                      <span className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                        {r.item.name[0].toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-slate-900 truncate">{r.item.name}</div>
                        {r.item.sector && <div className="text-[12px] text-slate-400 truncate">{r.item.sector}</div>}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">Company</span>
                    </>
                  )}
                  {r.kind === 'contact' && (
                    <>
                      <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-bold text-blue-500 shrink-0">
                        {r.item.full_name[0].toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-slate-900 truncate">{r.item.full_name}</div>
                        {r.item.title && <div className="text-[12px] text-slate-400 truncate">{r.item.title}{r.item.company_name ? ` · ${r.item.company_name}` : ''}</div>}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">Contact</span>
                    </>
                  )}
                  {r.kind === 'action' && (
                    <>
                      <span className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-[13px] text-white shrink-0">
                        {r.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-slate-900">{r.label}</div>
                        <div className="text-[12px] text-slate-400">{r.sub}</div>
                      </div>
                    </>
                  )}
                </button>
              )
            }

            return (
              <>
                {companies.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400">Companies</div>
                    {companies.map(r => <Row key={resultKey(r)} r={r} />)}
                  </>
                )}
                {contacts.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400">Contacts</div>
                    {contacts.map(r => <Row key={resultKey(r)} r={r} />)}
                  </>
                )}
                {actions.length > 0 && (
                  <>
                    {(companies.length > 0 || contacts.length > 0) && (
                      <div className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400">Actions</div>
                    )}
                    {actions.map(r => <Row key={resultKey(r)} r={r} />)}
                  </>
                )}
              </>
            )
          })()}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
          <span><kbd className="font-semibold">↑↓</kbd> navigate</span>
          <span><kbd className="font-semibold">↵</kbd> open</span>
          <span><kbd className="font-semibold">Esc</kbd> close</span>
          <span className="ml-auto hidden sm:inline">
            <kbd className="font-semibold">⌘K</kbd> to reopen
          </span>
        </div>
      </div>
    </div>
  )
}
