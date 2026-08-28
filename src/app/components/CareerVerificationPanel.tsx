'use client'
import { useState, useId } from 'react'
import { Alert, AlertDescription, Button, Card, Checkbox, Input, Textarea } from '@/components/ui'
export type CareerEntry = {
  company: string
  parent_company: string
  title: string
  start_year: string
  end_year: string
  key_outcome: string
  acquisition_note: string
  uncertain: boolean
}

type EntryWithId = CareerEntry & { _id: string }

interface Props {
  initialEntries?: CareerEntry[] | null
  resumeText?: string
}

function ReadCard({ entry, onEdit, onDelete }: {
  entry: EntryWithId
  onEdit: () => void
  onDelete: () => void
}) {
  const dates = `${entry.start_year || '?'}${entry.end_year ? ` - ${entry.end_year}` : ' - present'}`
  return (
    <Card className={`p-3 flex-row gap-3 ${entry.uncertain ? 'border-l-[3px] border-l-primary/30' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-foreground leading-tight">
            {entry.company}
            {entry.parent_company ? <span className="font-normal text-muted-foreground"> / {entry.parent_company}</span> : null}
          </p>
          {entry.uncertain && (
            <span className="text-[9px] font-bold tracking-widest uppercase text-primary shrink-0 pt-0.5">Review</span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground">{entry.title} &middot; {dates}</p>
        {entry.key_outcome && (
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{entry.key_outcome}</p>
        )}
        {entry.acquisition_note && (
          <p className="text-[11px] text-primary mt-1 leading-relaxed">{entry.acquisition_note}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Button type="button" variant="link" onClick={onEdit} className="h-auto p-0 text-[11px] text-muted-foreground">Edit</Button>
        <Button type="button" variant="link" onClick={onDelete} className="h-auto p-0 text-[11px] text-muted-foreground hover:text-destructive">Delete</Button>
      </div>
    </Card>
  )
}

function EditCard({ draft, onChange, onSave, onCancel }: {
  draft: EntryWithId
  onChange: (d: EntryWithId) => void
  onSave: () => void
  onCancel: () => void
}) {
  const field = (key: keyof CareerEntry) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...draft, [key]: e.target.value })

  return (
    <div className="border border-border rounded p-3 bg-muted flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Company</p>
          <Input value={draft.company} onChange={field('company')} placeholder="Company name" className="text-[12px]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Parent / Acquirer</p>
          <Input value={draft.parent_company} onChange={field('parent_company')} placeholder="If acquired or subsidiary" className="text-[12px]" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Title</p>
        <Input value={draft.title} onChange={field('title')} placeholder="Title" className="text-[12px]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Start year</p>
          <Input value={draft.start_year} onChange={field('start_year')} placeholder="2018" className="text-[12px]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">End year</p>
          <Input value={draft.end_year} onChange={field('end_year')} placeholder="Blank if current role" className="text-[12px]" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Key outcome</p>
        <Textarea value={draft.key_outcome} onChange={field('key_outcome')} placeholder="One specific, quantified achievement" rows={2} className="text-[12px] resize-none" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Acquisition or merger note</p>
        <Input value={draft.acquisition_note} onChange={field('acquisition_note')} placeholder="e.g. Glu Mobile was acquired by EA in 2021" className="text-[12px]" />
      </div>
      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
          <Checkbox
            checked={draft.uncertain}
            onCheckedChange={(checked) => onChange({ ...draft, uncertain: checked === true })}
          />
          Flag for review
        </label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="link" onClick={onCancel} className="h-auto p-0 text-[12px] text-muted-foreground">Cancel</Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            className="!bg-primary hover:!bg-primary/90"
          >
            Save entry
          </Button>
        </div>
      </div>
    </div>
  )
}

function makeId(uid: string, suffix: string) {
  return `${uid}-${suffix}`
}

function toWithId(entries: CareerEntry[], uid: string): EntryWithId[] {
  return entries.map((e, i) => ({ ...e, _id: makeId(uid, String(i)) }))
}

function toStored(entries: EntryWithId[]): CareerEntry[] {
  return entries.map(({ _id: _, ...rest }) => rest)
}

export default function CareerVerificationPanel({ initialEntries, resumeText }: Props) {
  const uid = useId()
  const [entries, setEntries] = useState<EntryWithId[]>(toWithId(initialEntries ?? [], uid))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EntryWithId | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  async function handleExtract() {
    if (!resumeText?.trim() || extracting) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/linkedin-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText }),
      })
      if (!res.ok) { setExtractError('Could not extract entries. Add them manually below.'); return }
      const data = await res.json()
      const raw: CareerEntry[] = Array.isArray(data.career_entries) ? data.career_entries : []
      if (raw.length) {
        setEntries(toWithId(raw, uid + '-ex'))
        setExtractError('')
      } else {
        setExtractError('No entries found in the career text. Add them manually below.')
      }
    } catch {
      setExtractError('Request failed. Add entries manually.')
    } finally {
      setExtracting(false)
    }
  }

  function startEdit(entry: EntryWithId) {
    setEditingId(entry._id)
    setEditDraft({ ...entry })
  }

  function cancelEdit() {
    const isNew = editDraft && !entries.find(e => e._id === editDraft._id && e.company)
    if (isNew) setEntries(entries.filter(e => e._id !== editDraft?._id))
    setEditingId(null)
    setEditDraft(null)
  }

  function saveEdit() {
    if (!editDraft) return
    setEntries(entries.map(e => e._id === editDraft._id ? editDraft : e))
    setEditingId(null)
    setEditDraft(null)
  }

  function deleteEntry(id: string) {
    setEntries(entries.filter(e => e._id !== id))
    if (editingId === id) { setEditingId(null); setEditDraft(null) }
  }

  function addEntry() {
    const newEntry: EntryWithId = {
      _id: makeId(uid, `new-${Date.now()}`),
      company: '', parent_company: '', title: '',
      start_year: '', end_year: '', key_outcome: '',
      acquisition_note: '', uncertain: false,
    }
    setEntries(prev => [...prev, newEntry])
    setEditingId(newEntry._id)
    setEditDraft(newEntry)
  }

  const storedValue = entries.length > 0 ? JSON.stringify(toStored(entries)) : ''
  const uncertainCount = entries.filter(e => e.uncertain).length

  return (
    <div>
      <input type="hidden" name="career_history_json" value={storedValue} />

      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
          Verified career history
          {entries.length > 0 && (
            <span className="ml-2 text-[10px] font-normal tracking-normal normal-case text-muted-foreground">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {uncertainCount > 0 && (
                <span className="text-primary"> &middot; {uncertainCount} need review</span>
              )}
            </span>
          )}
        </p>
        <Button
          type="button"
          variant="link"
          onClick={addEntry}
          className="h-auto p-0 text-[11px] text-muted-foreground hover:text-foreground"
        >
          + Add entry
        </Button>
      </div>

      {extractError && (
        <Alert variant="warning" className="mb-2">
          <AlertDescription>{extractError}</AlertDescription>
        </Alert>
      )}

      {entries.length === 0 ? (
        <div className="border border-dashed border-border rounded p-5 text-center">
          <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
            No verified entries. Extract from your career history, or add each role manually.
          </p>
          {resumeText && resumeText.length > 50 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExtract}
              disabled={extracting}
            >
              {extracting ? 'Extracting...' : 'Extract entries from career history'}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(entry =>
            editingId === entry._id && editDraft ? (
              <EditCard key={entry._id} draft={editDraft} onChange={setEditDraft} onSave={saveEdit} onCancel={cancelEdit} />
            ) : (
              <ReadCard key={entry._id} entry={entry} onEdit={() => startEdit(entry)} onDelete={() => deleteEntry(entry._id)} />
            )
          )}
          {resumeText && resumeText.length > 50 && (
            <Button
              type="button"
              variant="link"
              onClick={handleExtract}
              disabled={extracting}
              className="h-auto self-start p-0 text-[11px] text-muted-foreground"
            >
              {extracting ? 'Re-extracting...' : 'Re-extract from career history'}
            </Button>
          )}
        </div>
      )}

      <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
        Verified entries are used in interview prep briefs instead of raw resume text. The AI treats them as authoritative.
        Orange flagged entries have acquisition history or ambiguous company identity and should be reviewed.
      </p>
    </div>
  )
}
