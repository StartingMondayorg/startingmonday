'use client'
import { useState, useId } from 'react'

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

const inputCls = 'w-full border border-slate-200 rounded px-2.5 py-1.5 text-[12px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400'

function ReadCard({ entry, onEdit, onDelete }: {
  entry: EntryWithId
  onEdit: () => void
  onDelete: () => void
}) {
  const dates = `${entry.start_year || '?'}${entry.end_year ? ` - ${entry.end_year}` : ' - present'}`
  return (
    <div className={`border rounded p-3 flex gap-3 ${entry.uncertain ? 'border-l-[3px] border-l-orange-400 border-slate-200' : 'border-slate-200'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-slate-900 leading-tight">
            {entry.company}
            {entry.parent_company ? <span className="font-normal text-slate-400"> / {entry.parent_company}</span> : null}
          </p>
          {entry.uncertain && (
            <span className="text-[9px] font-bold tracking-widest uppercase text-orange-500 shrink-0 pt-0.5">Review</span>
          )}
        </div>
        <p className="text-[12px] text-slate-500">{entry.title} &middot; {dates}</p>
        {entry.key_outcome && (
          <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">{entry.key_outcome}</p>
        )}
        {entry.acquisition_note && (
          <p className="text-[11px] text-orange-600 mt-1 leading-relaxed">{entry.acquisition_note}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button type="button" onClick={onEdit} className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors">Edit</button>
        <button type="button" onClick={onDelete} className="text-[11px] text-slate-300 hover:text-red-500 transition-colors">Delete</button>
      </div>
    </div>
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
    <div className="border border-slate-400 rounded p-3 bg-slate-50 flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Company</p>
          <input value={draft.company} onChange={field('company')} placeholder="Company name" className={inputCls} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Parent / Acquirer</p>
          <input value={draft.parent_company} onChange={field('parent_company')} placeholder="If acquired or subsidiary" className={inputCls} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Title</p>
        <input value={draft.title} onChange={field('title')} placeholder="Title" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Start year</p>
          <input value={draft.start_year} onChange={field('start_year')} placeholder="2018" className={inputCls} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">End year</p>
          <input value={draft.end_year} onChange={field('end_year')} placeholder="Blank if current role" className={inputCls} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Key outcome</p>
        <textarea value={draft.key_outcome} onChange={field('key_outcome')} placeholder="One specific, quantified achievement" rows={2} className={inputCls + ' resize-none'} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Acquisition or merger note</p>
        <input value={draft.acquisition_note} onChange={field('acquisition_note')} placeholder="e.g. Glu Mobile was acquired by EA in 2021" className={inputCls} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.uncertain}
            onChange={e => onChange({ ...draft, uncertain: e.target.checked })}
            className="w-3 h-3 rounded"
          />
          Flag for review
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">Cancel</button>
          <button
            type="button"
            onClick={onSave}
            className="text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            Save entry
          </button>
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
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500">
          Verified career history
          {entries.length > 0 && (
            <span className="ml-2 text-[10px] font-normal tracking-normal normal-case text-slate-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {uncertainCount > 0 && (
                <span className="text-orange-500"> &middot; {uncertainCount} need review</span>
              )}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={addEntry}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          + Add entry
        </button>
      </div>

      {extractError && (
        <p className="text-[12px] text-amber-700 mb-2">{extractError}</p>
      )}

      {entries.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded p-5 text-center">
          <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">
            No verified entries. Extract from your career history, or add each role manually.
          </p>
          {resumeText && resumeText.length > 50 && (
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting}
              className="text-[12px] font-semibold text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:border-slate-400 transition-colors disabled:opacity-40"
            >
              {extracting ? 'Extracting...' : 'Extract entries from career history'}
            </button>
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
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors self-start mt-0.5"
            >
              {extracting ? 'Re-extracting...' : 'Re-extract from career history'}
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">
        Verified entries are used in interview prep briefs instead of raw resume text. The AI treats them as authoritative.
        Orange flagged entries have acquisition history or ambiguous company identity and should be reviewed.
      </p>
    </div>
  )
}
