'use client'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { archiveContactSilent, toggleContactPriority } from '@/app/(dashboard)/dashboard/contacts/actions'
import { STATUS_STEPS, STATUS_CLS } from '@/app/(dashboard)/dashboard/_components/ContactStatusStepper'
import { Badge, Button, Card, Input, Toggle, ToggleGroup, ToggleGroupItem } from '@/components/ui'
const CHANNEL: Record<string, { label: string; cls: string }> = {
  linkedin:  { label: 'LinkedIn',  cls: 'border border-info/20 bg-info/10 text-info' },
  referral:  { label: 'Referral',  cls: 'border border-success/20 bg-success/10 text-success' },
  cold:      { label: 'Cold',      cls: 'border border-border bg-muted/40 text-muted-foreground' },
  inbound:   { label: 'Inbound',   cls: 'border border-info/20 bg-info/10 text-info' },
  event:     { label: 'Event',     cls: 'border border-warning/20 bg-warning/10 text-warning' },
  recruiter: { label: 'Recruiter', cls: 'border border-info/20 bg-info/10 text-info' },
}

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_STEPS.map(s => [s.value, s.label])
)

const CHANNEL_VALUES = ['linkedin', 'referral', 'recruiter', 'cold', 'inbound', 'event']
const CONTACT_TYPE_LABELS: Record<string, string> = {
  recruiter: 'Recruiter',
  hiring_manager: 'Hiring Manager',
  peer: 'Peer',
  coach: 'Coach',
  board: 'Board',
}

export type ContactListItem = {
  id: string
  name: string
  title: string | null
  firm: string | null
  channel: string | null
  contact_type?: string | null
  notes: string | null
  outreach_status: string | null
  is_priority: boolean
  last_role_discussed?: string | null
  companies: { id: string; name: string } | null
}

function exportContactsCsv(contacts: ContactListItem[]) {
  const headers = ['Name', 'Title', 'Firm', 'Company', 'Channel', 'Status', 'Priority', 'Notes']
  const rows = contacts.map(ct => [
    ct.name,
    ct.title ?? '',
    ct.firm ?? '',
    ct.companies?.name ?? '',
    ct.channel ?? '',
    ct.outreach_status ?? 'prospect',
    ct.is_priority ? 'Yes' : '',
    ct.notes ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ContactsList({ contacts, isLeader = false }: { contacts: ContactListItem[]; isLeader?: boolean }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [priorities, setPriorities] = useState<Record<string, boolean>>(
    Object.fromEntries(contacts.map(c => [c.id, c.is_priority]))
  )
  const [, startTransition] = useTransition()

  const usedChannels = new Set(contacts.map(c => c.channel).filter(Boolean) as string[])
  const activeChannelFilters = CHANNEL_VALUES.filter(v => usedChannels.has(v))

  const filtered = contacts.filter(ct => {
    if (removedIds.has(ct.id)) return false
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      ct.name.toLowerCase().includes(q) ||
      (ct.title ?? '').toLowerCase().includes(q) ||
      (ct.firm ?? '').toLowerCase().includes(q) ||
      (ct.companies?.name ?? '').toLowerCase().includes(q)
    const matchesChannel = !channelFilter || ct.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  // For leader: group recruiters by firm, non-recruiters flat
  function buildRows() {
    if (!isLeader) return { grouped: null, flat: filtered }

    const recruiters = filtered.filter(ct => ct.channel === 'recruiter' && ct.firm)
    const others = filtered.filter(ct => !(ct.channel === 'recruiter' && ct.firm))

    const byFirm: Record<string, ContactListItem[]> = {}
    for (const ct of recruiters) {
      const firm = ct.firm!
      if (!byFirm[firm]) byFirm[firm] = []
      byFirm[firm].push(ct)
    }

    return { grouped: byFirm, flat: others }
  }

  const { grouped, flat } = buildRows()

  function togglePriority(ct: ContactListItem) {
    const next = !priorities[ct.id]
    setPriorities(prev => ({ ...prev, [ct.id]: next }))
    startTransition(async () => {
      await toggleContactPriority(ct.id, !next)
      router.refresh()
    })
  }

  if (contacts.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">All contacts</span>
          <span className="text-[12px] text-muted-foreground">0 contacts</span>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-muted/40 border border-border flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="#94a3b8" strokeWidth="1.5"/>
              <path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-foreground mb-1">No contacts yet</p>
          <p className="text-[13px] text-muted-foreground max-w-xs mx-auto">Add recruiters, hiring managers, and warm connections. Roles at this level fill through relationships.</p>
        </div>
      </Card>
    )
  }

  function ContactRow({ ct }: { ct: ContactListItem }) {
    const ch = ct.channel ? (CHANNEL[ct.channel] ?? null) : null
    const relationshipType = ct.contact_type ? (CONTACT_TYPE_LABELS[ct.contact_type] ?? ct.contact_type) : null
    const companyName = ct.companies?.name ?? null
    const subtitle = [ct.title, ct.firm ?? companyName].filter(Boolean).join(' · ')
    const status = ct.outreach_status ?? 'prospect'
    const statusLabel = STATUS_LABELS[status] ?? status
    const statusCls = STATUS_CLS[status] ?? 'bg-muted text-muted-foreground'
    const isPriority = priorities[ct.id] ?? ct.is_priority
    const nextAction = status === 'prospect'
      ? 'Draft first outreach'
      : status === 'meeting_scheduled'
        ? 'Prep for scheduled meeting'
        : status === 'closed'
          ? 'Keep warm monthly'
          : 'Schedule next follow-up'

    return (
      <div className="px-6 py-4 flex items-start gap-3 bg-background/10 hover:bg-muted/[0.03] transition-colors">
        {isLeader && (
          <Toggle
            pressed={isPriority}
            onPressedChange={() => togglePriority(ct)}
            title={isPriority ? 'Remove priority' : 'Mark as priority'}
            className={`shrink-0 mt-0.5 h-auto min-w-0 p-0 text-[16px] leading-none hover:bg-transparent ${isPriority ? 'text-primary opacity-100' : 'text-muted-foreground opacity-30 hover:opacity-70'}`}
          >
            ★
          </Toggle>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/dashboard/contacts/${ct.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary">
              {ct.name}
            </Link>
            {ch && (
              <Badge className={`font-semibold tracking-[0.04em] ${ch.cls}`}>
                {ch.label}
              </Badge>
            )}
            {relationshipType && (
              <Badge className="font-semibold tracking-[0.04em] border border-primary/20 bg-primary/10 text-primary">
                {relationshipType}
              </Badge>
            )}
            <Badge className={`font-semibold ${statusCls}`}>
              {statusLabel}
            </Badge>
          </div>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {ct.last_role_discussed && (
            <p className="text-[12px] text-muted-foreground mt-0.5">Last role discussed: {ct.last_role_discussed}</p>
          )}
          <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
            {ct.companies?.id && (
              <Link href={`/dashboard/companies/${ct.companies.id}`} className="font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {ct.companies.name}
              </Link>
            )}
            {ct.companies?.id && (
              <Link
                href={`/dashboard/companies/${ct.companies.id}/prep`}
                className="font-semibold text-primary transition-colors"
              >
                Open company brief
              </Link>
            )}
            <span>
              Next: <span className="font-semibold text-foreground">{nextAction}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          <Button
            variant="ghost"
            render={<Link href={`/dashboard/contacts/${ct.id}/outreach`} />}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:bg-transparent font-medium h-auto p-0"
          >
            Draft outreach (with brief)
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRemovedIds(prev => new Set([...prev, ct.id]))
              startTransition(async () => {
                await archiveContactSilent(ct.id)
                router.refresh()
              })
            }}
            className="text-[11px] text-muted-foreground hover:text-destructive hover:bg-transparent p-0 min-h-[32px] min-w-[44px] h-auto"
          >
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">All contacts</span>
        <div className="flex items-center gap-3">
          {isLeader && filtered.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => exportContactsCsv(filtered)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-transparent p-0 h-auto"
            >
              Export CSV
            </Button>
          )}
          <span className="text-[12px] text-muted-foreground">
            {filtered.length !== contacts.length
              ? `${filtered.length} of ${contacts.length}`
              : `${contacts.length} ${contacts.length === 1 ? 'contact' : 'contacts'}`}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-border bg-background/20">
        <Input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, title, or company..."
          className="w-full h-auto border-0 p-0 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0 bg-transparent"
        />
      </div>

      {/* Channel filter */}
      {activeChannelFilters.length > 1 && (
        <div className="px-6 py-2.5 border-b border-border overflow-x-auto bg-background/20">
          <ToggleGroup
            value={channelFilter ? [channelFilter] : []}
            onValueChange={(values) => setChannelFilter(values[0] ?? '')}
            className="gap-1.5"
          >
            <ToggleGroupItem
              value=""
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors ${!channelFilter ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-muted/40 text-primary-foreground hover:bg-muted/60'}`}
            >
              All
            </ToggleGroupItem>
            {activeChannelFilters.map(v => {
              const ch = CHANNEL[v]
              return (
                <ToggleGroupItem
                  key={v}
                  value={v}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors ${channelFilter === v ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-muted/40 text-primary-foreground hover:bg-muted/60'}`}
                >
                  {ch?.label ?? v}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      )}

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="px-6 py-8 text-center text-[13px] text-muted-foreground">
          No contacts match that filter.
        </div>
      ) : (
        <div className="divide-y divide-border">

          {/* Leader: firm-grouped recruiters first */}
          {isLeader && grouped && Object.entries(grouped).sort(([,a],[,b]) => b.length - a.length).map(([firm, cts]) => (
            <div key={firm}>
              <div className="px-6 py-2 bg-info/10 border-b border-border flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-info">{firm}</span>
                <span className="text-[10px] text-info/70">{cts.length} {cts.length === 1 ? 'contact' : 'contacts'}</span>
              </div>
              {cts.map(ct => <ContactRow key={ct.id} ct={ct} />)}
            </div>
          ))}

          {/* Non-recruiter contacts (or all contacts for non-leader) */}
          {flat.map(ct => <ContactRow key={ct.id} ct={ct} />)}

        </div>
      )}
    </Card>
  )
}
