'use client'

import { useState } from 'react'
import { Badge, Button, Card, Input, Label, Textarea, Toggle } from '@/components/ui'
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

  const labelCls = 'block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5'
  const inputCls = 'w-full px-3 py-2 text-[13px] resize-none'

  return (
    <Card variant="default" className="gap-4 p-5 bg-muted">
      <div>
        <Label className={labelCls}>Situation <span className="text-destructive">*</span></Label>
        <Textarea rows={2} value={situation} onChange={e => setSituation(e.target.value)}
          placeholder="The context and challenge - one or two sentences."
          className={inputCls} />
      </div>
      <div>
        <Label className={labelCls}>What you did <span className="text-destructive">*</span></Label>
        <Textarea rows={2} value={action} onChange={e => setAction(e.target.value)}
          placeholder="Your specific decision or action - not the team, you."
          className={inputCls} />
      </div>
      <div>
        <Label className={labelCls}>Outcome <span className="text-destructive">*</span></Label>
        <Textarea rows={2} value={result} onChange={e => setResult(e.target.value)}
          placeholder="Quantified result - dollars, %, time, scope."
          className={inputCls} />
      </div>
      <div>
        <Label className={labelCls}>When this story applies</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <Badge key={t} variant="secondary" className="h-auto gap-1 px-2 py-0.5 font-semibold">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-muted-foreground leading-none">×</button>
            </Badge>
          ))}
        </div>
        <Input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKey}
          onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput('') } }}
          placeholder="Type a tag and press Enter"
          className="h-auto w-full px-3 py-2 text-[13px] mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TAGS.filter(t => !tags.includes(t)).map(t => (
            <Toggle
              key={t}
              pressed={false}
              onPressedChange={() => addTag(t)}
              className="h-auto rounded-full px-2 py-0.5 text-[11px] text-muted-foreground border border-border hover:bg-muted"
            >
              + {t}
            </Toggle>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button
          disabled={!canSave}
          onClick={() => onSave({ id: initial.id ?? newId(), situation, action, result, tags })}
          className="h-auto px-4 py-2 text-[12px] font-semibold"
        >
          Save story
        </Button>
        <Button variant="ghost" onClick={onCancel} className="h-auto p-0 text-[12px] text-muted-foreground hover:bg-transparent">
          Cancel
        </Button>
      </div>
    </Card>
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
        <p className="text-[13px] text-muted-foreground italic">
          No stories saved yet. Add your best 5-8 to make prep briefs specific to your background.
        </p>
      )}

      {stories.map(s => (
        editId === s.id ? (
          <StoryForm key={s.id} initial={s}
            onSave={handleEdit}
            onCancel={() => setEditId(null)} />
        ) : (
          <Card key={s.id} variant="default" className="gap-0 p-4">
            <div className="text-[13px] text-muted-foreground leading-relaxed mb-1">
              <span className="font-semibold text-muted-foreground text-[10px] tracking-[0.08em] uppercase mr-1.5">Situation</span>
              {s.situation}
            </div>
            <div className="text-[13px] text-muted-foreground leading-relaxed mb-1">
              <span className="font-semibold text-muted-foreground text-[10px] tracking-[0.08em] uppercase mr-1.5">Action</span>
              {s.action}
            </div>
            <div className="text-[13px] text-muted-foreground leading-relaxed mb-2">
              <span className="font-semibold text-muted-foreground text-[10px] tracking-[0.08em] uppercase mr-1.5">Result</span>
              {s.result}
            </div>
            {s.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.tags.map(t => (
                  <Badge key={t} variant="secondary" className="h-auto px-2 py-0.5 font-semibold">{t}</Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setEditId(s.id)}
                className="h-auto p-0 text-[11px] font-semibold text-muted-foreground hover:bg-transparent">
                Edit
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(s.id)}
                className="h-auto p-0 text-[11px] font-semibold text-destructive hover:bg-transparent">
                Delete
              </Button>
            </div>
          </Card>
        )
      ))}

      {adding ? (
        <StoryForm initial={{}}
          onSave={handleAdd}
          onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}
          className="self-start h-auto px-3 py-1.5 text-[12px] font-semibold">
          + Add story
        </Button>
      )}
    </div>
  )
}
