'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui'
type Company = { id: string; name: string; stage: string | null; sector: string | null }
type Contact = { id: string; full_name: string; title: string | null; company_name: string | null }

type Result =
  | { kind: 'company'; item: Company }
  | { kind: 'contact'; item: Contact }
  | { kind: 'action'; label: string; sub: string; href: string; icon: string }

// P3 (proposal 3d): the palette offers the same destinations as the nav rail plus Settings.
// Companies and contacts are reached by typing their names below.
const QUICK_ACTIONS: Result[] = [
  { kind: 'action', label: 'Home',          sub: 'Your next move and this week', href: '/dashboard',               icon: '⌂' },
  { kind: 'action', label: 'Add company',   sub: 'Track a new target',           href: '/dashboard/companies/new', icon: '+' },
  { kind: 'action', label: 'Signals',       sub: 'What changed at your targets', href: '/dashboard/signals',       icon: '◉' },
  { kind: 'action', label: 'Contacts',      sub: 'People and outreach',          href: '/dashboard/contacts',      icon: '＋' },
  { kind: 'action', label: 'Profile',       sub: 'Titles, sectors, briefing',    href: '/dashboard/profile',       icon: '◌' },
  { kind: 'action', label: 'Settings',      sub: 'Email, billing, security',     href: '/settings',                icon: '◈' },
  { kind: 'action', label: 'Chat with AI',  sub: 'Ask your advisor',             href: '/dashboard/chat',          icon: '✦' },
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

export function CommandPalette({ aiChatEnabled = true }: { aiChatEnabled?: boolean } = {}) {
  // R-6: tier-gated destinations are hidden from accounts that would be redirected away.
  const quickActions = useMemo(
    () => (aiChatEnabled ? QUICK_ACTIONS : QUICK_ACTIONS.filter(a => !(a.kind === 'action' && a.href === '/dashboard/chat'))),
    [aiChatEnabled],
  )
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current)
    if (!query.trim() || query.length < 2) {
      setResults(quickActions)
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
        const filtered = quickActions.filter(a =>
          a.kind === 'action' && a.label.toLowerCase().includes(query.toLowerCase())
        )
        setResults([...next, ...filtered])
      } finally {
        setLoading(false)
      }
    }, 160)
  }, [query, quickActions])

  useEffect(() => {
    if (!query && open) setResults(quickActions)
  }, [open, query, quickActions])

  function navigate(r: Result) {
    router.push(resultHref(r))
    close()
  }

  const displayList = results.length > 0 ? results : (query.length >= 2 && !loading ? [] : quickActions)
  const companies = displayList.filter(r => r.kind === 'company')
  const contacts = displayList.filter(r => r.kind === 'contact')
  const actions = displayList.filter(r => r.kind === 'action')

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title="Command palette"
      description="Search companies, contacts, or actions"
      className="top-[15vh] max-w-xl"
      showCloseButton
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search companies, contacts, or actions..."
        />
        <CommandList>
          <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
          {companies.length > 0 && (
            <CommandGroup heading="Companies">
              {companies.map((r) => {
                const item = (r as Extract<Result, { kind: 'company' }>).item
                return (
                  <CommandItem key={resultKey(r)} value={resultKey(r)} onSelect={() => navigate(r)}>
                    <span className="w-7 h-7 rounded bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                      {item.name[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-foreground truncate">{item.name}</div>
                      {item.sector && <div className="text-[12px] text-muted-foreground truncate">{item.sector}</div>}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">Company</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {contacts.length > 0 && (
            <CommandGroup heading="Contacts">
              {contacts.map((r) => {
                const item = (r as Extract<Result, { kind: 'contact' }>).item
                return (
                  <CommandItem key={resultKey(r)} value={resultKey(r)} onSelect={() => navigate(r)}>
                    <span className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center text-[11px] font-bold text-info shrink-0">
                      {item.full_name[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-foreground truncate">{item.full_name}</div>
                      {item.title && <div className="text-[12px] text-muted-foreground truncate">{item.title}{item.company_name ? ` · ${item.company_name}` : ''}</div>}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">Contact</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {actions.length > 0 && (
            <CommandGroup heading="Actions">
              {actions.map((r) => {
                const action = r as Extract<Result, { kind: 'action' }>
                return (
                  <CommandItem key={resultKey(r)} value={resultKey(r)} onSelect={() => navigate(r)}>
                    <span className="dark w-7 h-7 rounded bg-card flex items-center justify-center text-[13px] text-foreground shrink-0">
                      {action.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-foreground">{action.label}</div>
                      <div className="text-[12px] text-muted-foreground">{action.sub}</div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>

        <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Badge variant="outline" className="font-semibold">↑↓</Badge> navigate</span>
          <span className="flex items-center gap-1"><Badge variant="outline" className="font-semibold">↵</Badge> open</span>
          <span className="flex items-center gap-1"><Badge variant="outline" className="font-semibold">Esc</Badge> close</span>
          <span className="ml-auto hidden sm:flex items-center gap-1">
            <Badge variant="outline" className="font-semibold">⌘K</Badge> to reopen
          </span>
        </div>
      </Command>
    </CommandDialog>
  )
}
