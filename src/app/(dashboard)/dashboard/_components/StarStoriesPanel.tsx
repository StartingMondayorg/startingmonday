'use client'

import { useState } from 'react'

export type StarStory = {
  id: string
  situation: string
  action: string
  result: string
  tags: string[]
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

const COMMON_TAGS = [
  'vendor negotiation', 'budget conflict', 'team building', 'executive alignment',
  'transformation', 'crisis response', 'cost reduction', 'M&A integration',
  'board presentation', 'organizational change', 'hiring', 'failed initiative',
]

function StoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<StarStory>
  onSave: (s: StarStory) => void
  onCancel: () => void
}) {
  const [situation, setSituation] = useState(initial.situation ?? '')
  const [action,    setAction]    = useState(initial.action    ?? '')
  const [result,    setResult]    = useState(initial.result    ?? '')
  const [tagInput,  setTagInput]  = useState('')
  const [tags,      setTags]      = useState<string[]>(initial.tags ?? [])

  function addTag(t: string) {
    const clean = t.trim().toLowerCase()
    if (clean && !tags.includes(clean)) setTags(prev => [...prev, clean])
  }
  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)) }

  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  const canSave = situation.trim() && action.trim() && result.trim()

  const labelCls = 'block text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-1.5'
  const inputCls = 'w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none'

  return (
    <div className="border border-slate-200 rounded p-5 bg-slate-50 flex flex-col gap-4">
      <div>
        <label className={labelCls}>Situation <span className="text-red-500">*</span></label>
        <textarea rows={2} value={situation} onChange={e => setSituation(e.target.value)}
          placeholder="The context and challenge - one or two sentences."
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>What you did <span className="text-red-500">*</span></label>
        <textarea rows={2} value={action} onChange={e => setAction(e.target.value)}
          placeholder="Your specific decision or action - not the team, you."
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Outcome <span className="text-red-500">*</span></label>
        <textarea rows={2} value={result} onChange={e => setResult(e.target.value)}
          placeholder="Quantified result - dollars, %, time, scope."
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>When this story applies</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-slate-400 hover:text-slate-600 leading-none">×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKey}
          onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput('') } }}
          placeholder="Type a tag and press Enter"
          className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TAGS.filter(t => !tags.includes(t)).map(t => (
            <button key={t} type="button" onClick={() => addTag(t)}
              className="text-[11px] text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 hover:bg-slate-100 transition-colors">
              + {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave({ id: initial.id ?? newId(), situation, action, result, tags })}
          className="bg-slate-900 text-white text-[12px] font-semibold px-4 py-2 rounded disabled:opacity-40 cursor-pointer border-0"
        >
          Save story
        </button>
        <button type="button" onClick={onCancel}
          className="text-[12px] text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function StarStoriesPanel({
  initial,
}: {
  initial: StarStory[]
}) {
  const [stories,  setStories]  = useState<StarStory[]>(initial)
  const [adding,   setAdding]   = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)

  function commit(next: StarStory[]) {
    setStories(next)
  }

  function handleAdd(s: StarStory) {
    commit([...stories, s])
    setAdding(false)
  }

  function handleEdit(s: StarStory) {
    commit(stories.map(x => x.id === s.id ? s : x))
    setEditId(null)
  }

  function handleDelete(id: string) {
    commit(stories.filter(x => x.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="star_stories_json" value={JSON.stringify(stories)} />
      {stories.length === 0 && !adding && (
        <p className="text-[13px] text-slate-400 italic">
          No stories saved yet. Add your best 5-8 to make prep briefs specific to your background.
        </p>
      )}

      {stories.map(s => (
        editId === s.id ? (
          <StoryForm key={s.id} initial={s}
            onSave={handleEdit}
            onCancel={() => setEditId(null)} />
        ) : (
          <div key={s.id} className="border border-slate-200 rounded p-4 bg-white">
            <div className="text-[13px] text-slate-700 leading-relaxed mb-1">
              <span className="font-semibold text-slate-500 text-[10px] tracking-[0.08em] uppercase mr-1.5">Situation</span>
              {s.situation}
            </div>
            <div className="text-[13px] text-slate-700 leading-relaxed mb-1">
              <span className="font-semibold text-slate-500 text-[10px] tracking-[0.08em] uppercase mr-1.5">Action</span>
              {s.action}
            </div>
            <div className="text-[13px] text-slate-700 leading-relaxed mb-2">
              <span className="font-semibold text-slate-500 text-[10px] tracking-[0.08em] uppercase mr-1.5">Result</span>
              {s.result}
            </div>
            {s.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.tags.map(t => (
                  <span key={t} className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditId(s.id)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 border-0 bg-transparent cursor-pointer p-0">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(s.id)}
                className="text-[11px] font-semibold text-red-400 hover:text-red-600 border-0 bg-transparent cursor-pointer p-0">
                Delete
              </button>
            </div>
          </div>
        )
      ))}

      {adding ? (
        <StoryForm initial={{}}
          onSave={handleAdd}
          onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="self-start text-[12px] font-semibold text-orange-600 hover:text-orange-800 border border-orange-200 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 rounded px-3 py-1.5 transition-colors cursor-pointer">
          + Add story
        </button>
      )}
    </div>
  )
}
