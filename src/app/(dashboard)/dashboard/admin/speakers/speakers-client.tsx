'use client'

import { Fragment, useState, useRef } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
type Appearance = {
  conference_name: string
  conference_year: number
  topic: string | null
  session_type: string | null
}

type Speaker = {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  title: string | null
  company: string | null
  linkedin_url: string | null
  sector: string | null
  notes: string | null
  outreach_status: string
  outreach_date: string | null
  outreach_notes: string | null
  priority: number
  conference_appearances: Appearance[]
}

const STATUS_LABELS: Record<string, string> = {
  not_started:    'Not started',
  contacted:      'Contacted',
  responded:      'Responded',
  converted:      'Converted',
  not_interested: 'Not interested',
  skip:           'Skip',
}

const STATUS_COLORS: Record<string, string> = {
  not_started:    'bg-muted text-muted-foreground',
  contacted:      'bg-info/10 text-info',
  responded:      'bg-warning/10 text-warning',
  converted:      'bg-success/10 text-success',
  not_interested: 'bg-destructive/10 text-destructive',
  skip:           'bg-muted text-muted-foreground',
}

const PRIORITY_LABELS: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' }
const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-primary font-bold',
  2: 'text-muted-foreground',
  3: 'text-muted-foreground',
}

export function SpeakersClient({ initialSpeakers }: { initialSpeakers: Speaker[] }) {
  const [speakers, setSpeakers] = useState(initialSpeakers)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = speakers.filter(s => {
    if (statusFilter !== 'all' && s.outreach_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !s.full_name.toLowerCase().includes(q) &&
        !(s.company ?? '').toLowerCase().includes(q) &&
        !(s.title ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const counts: Record<string, number> = { all: speakers.length }
  for (const s of speakers) {
    counts[s.outreach_status] = (counts[s.outreach_status] ?? 0) + 1
  }

  async function updateStatus(id: string, outreach_status: string) {
    const res = await fetch(`/api/admin/speakers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreach_status }),
    })
    if (!res.ok) return
    const { speaker } = await res.json()
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...speaker } : s))
  }

  async function updatePriority(id: string, priority: number) {
    const res = await fetch(`/api/admin/speakers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    })
    if (!res.ok) return
    const { speaker } = await res.json()
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...speaker } : s))
  }

  async function updateNotes(id: string, outreach_notes: string) {
    const res = await fetch(`/api/admin/speakers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreach_notes }),
    })
    if (!res.ok) return
    const { speaker } = await res.json()
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...speaker } : s))
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/speakers', { method: 'POST', body: form })
    const json = await res.json()
    if (!res.ok) {
      setImportResult(`Error: ${json.error}`)
    } else {
      setImportResult(`Imported ${json.speakersUpserted} speakers, ${json.appearancesInserted} appearances.${json.errors?.length ? ` ${json.errors.length} errors.` : ''}`)
      // Refresh the list
      const listRes = await fetch('/api/admin/speakers')
      if (listRes.ok) {
        const { speakers: fresh } = await listRes.json()
        setSpeakers(fresh)
      }
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      {/* Stats bar */}
      <ToggleGroup
        value={[statusFilter]}
        onValueChange={(values) => { if (values[0]) setStatusFilter(values[0]) }}
        className="flex-wrap gap-2 mb-6"
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'not_started', label: 'Not started' },
          { key: 'contacted', label: 'Contacted' },
          { key: 'responded', label: 'Responded' },
          { key: 'converted', label: 'Converted' },
          { key: 'not_interested', label: 'Not interested' },
          { key: 'skip', label: 'Skip' },
        ].map(({ key, label }) => (
          <ToggleGroupItem
            key={key}
            value={key}
            className={`text-[12px] font-semibold px-3 py-1.5 rounded border transition-colors ${
              statusFilter === key
                ? 'bg-primary aria-pressed:bg-primary border-border text-primary-foreground hover:bg-primary'
                : 'bg-card border-border text-card-foreground hover:border-border'
            }`}
          >
            {label} <span className="ml-1 opacity-60">{counts[key] ?? 0}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Search + import + export toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          type="text"
          placeholder="Search name, company, title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" render={<a href="/api/admin/speakers/export" />}>
          Export CSV
        </Button>
        <Button render={<label className="cursor-pointer" />}>
          {importing ? 'Importing...' : 'Import CSV'}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleImport}
            disabled={importing}
          />
        </Button>
      </div>

      {importResult && (
        <Alert variant={importResult.startsWith('Error:') ? 'destructive' : 'success'} className="mb-4">
          <AlertDescription>{importResult}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card variant="default" className="p-0 overflow-hidden">
        <div className="px-6 py-[18px] border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            Speakers ({filtered.length})
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-8 text-[13px] text-muted-foreground">
            No speakers match this filter. Import a CSV to get started.
          </p>
        ) : (
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="bg-muted border-b border-border">
                <TableHead className="px-6 py-2.5 font-semibold text-muted-foreground">Name</TableHead>
                <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Company</TableHead>
                <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Conferences</TableHead>
                <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Priority</TableHead>
                <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {filtered.map(s => {
                const isExpanded = expandedId === s.id
                const appearances = [...(s.conference_appearances ?? [])].sort(
                  (a, b) => b.conference_year - a.conference_year
                )
                return (
                  <Fragment key={s.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted transition-colors ${isExpanded ? 'bg-muted' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      <TableCell className="px-6 py-3 whitespace-normal">
                        <div className="font-semibold text-foreground">{s.full_name}</div>
                        {s.title && <div className="text-muted-foreground text-[11px] mt-0.5">{s.title}</div>}
                        {s.linkedin_url && (
                          <a
                            href={s.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[11px] text-info hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-normal">
                        <div className="text-muted-foreground">{s.company ?? '-'}</div>
                        {s.sector && <div className="text-muted-foreground text-[11px]">{s.sector}</div>}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-normal">
                        {appearances.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <div className="space-y-0.5">
                            {appearances.slice(0, 2).map(a => (
                              <div key={`${a.conference_name}-${a.conference_year}`} className="text-muted-foreground">
                                {a.conference_name} <span className="text-muted-foreground">{a.conference_year}</span>
                              </div>
                            ))}
                            {appearances.length > 2 && (
                              <div className="text-muted-foreground">+{appearances.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Select
                          value={String(s.priority)}
                          onValueChange={(value) => value && updatePriority(s.id, parseInt(value, 10))}
                        >
                          <SelectTrigger
                            aria-label="Speaker priority"
                            title="Speaker priority"
                            className={`h-auto w-fit border-0 bg-transparent px-0 py-0 text-[12px] shadow-none [&_svg]:size-3 ${PRIORITY_COLORS[s.priority]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Select
                          value={s.outreach_status}
                          onValueChange={(value) => value && updateStatus(s.id, value)}
                        >
                          <SelectTrigger
                            aria-label="Speaker outreach status"
                            title="Speaker outreach status"
                            className={`h-auto w-fit border-0 rounded px-2 py-0.5 text-[11px] font-bold shadow-none [&_svg]:size-3 ${STATUS_COLORS[s.outreach_status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {s.outreach_date && (
                          <div className="text-muted-foreground text-[11px] mt-0.5">{s.outreach_date}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 max-w-[200px] whitespace-normal" onClick={e => e.stopPropagation()}>
                        <OutreachNotesCell
                          speakerId={s.id}
                          notes={s.outreach_notes}
                          onSave={notes => updateNotes(s.id, notes)}
                        />
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted">
                        <TableCell colSpan={6} className="px-6 py-4 whitespace-normal">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">All Appearances</div>
                              {appearances.length === 0 ? (
                                <p className="text-[12px] text-muted-foreground">None recorded.</p>
                              ) : (
                                <Table className="text-[12px]">
                                  <TableHeader>
                                    <TableRow className="text-muted-foreground">
                                      <TableHead className="pb-1 font-semibold">Conference</TableHead>
                                      <TableHead className="pb-1 font-semibold">Year</TableHead>
                                      <TableHead className="pb-1 font-semibold">Type</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="divide-y divide-border">
                                    {appearances.map(a => (
                                      <TableRow key={`${a.conference_name}-${a.conference_year}`}>
                                        <TableCell className="py-1.5 text-muted-foreground">{a.conference_name}</TableCell>
                                        <TableCell className="py-1.5 text-muted-foreground">{a.conference_year}</TableCell>
                                        <TableCell className="py-1.5 text-muted-foreground capitalize">{a.session_type ?? '-'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                            {s.notes && (
                              <div>
                                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Notes</div>
                                <p className="text-[12px] text-muted-foreground leading-relaxed">{s.notes}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* CSV format hint */}
      <Card variant="default" className="mt-6 p-5">
        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">CSV Import Format</div>
        <p className="text-[12px] text-muted-foreground mb-2">
          Header row required. Columns (all optional except full_name):
        </p>
        <code className="block text-[11px] text-muted-foreground bg-muted rounded p-3 font-mono leading-relaxed">
          full_name, first_name, last_name, title, company, linkedin_url, sector, notes, priority (1-3),
          conference_name, year, topic, session_type (keynote/panel/workshop/fireside/lightning/other)
        </code>
        <p className="text-[12px] text-muted-foreground mt-2">
          Multiple rows per speaker are allowed (one row per appearance). Speakers are matched by linkedin_url
          when present, otherwise by (full_name, company).
        </p>
      </Card>
    </div>
  )
}

function OutreachNotesCell({
  speakerId,
  notes,
  onSave,
}: {
  speakerId: string
  notes: string | null
  onSave: (notes: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes ?? '')

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor="speaker-notes" className="sr-only">Speaker notes</label>
        <Textarea
          id="speaker-notes"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={2}
          aria-label="Speaker notes"
          className="text-[12px] resize-none"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => { onSave(value); setEditing(false) }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setValue(notes ?? ''); setEditing(false) }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setEditing(true)}
      className="justify-start text-left text-muted-foreground hover:text-foreground h-auto w-full px-0 font-normal"
    >
      {notes
        ? <span className="line-clamp-2 text-[11px]">{notes}</span>
        : <span className="text-muted-foreground text-[11px] italic">Add notes</span>
      }
    </Button>
  )
}
