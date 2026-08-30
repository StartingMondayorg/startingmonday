'use client'
import { useState, useRef } from 'react'
import { Alert, AlertDescription, AlertTitle, Button, Card, Label, Textarea } from '@/components/ui'
interface Props {
  defaultValue: string
  resumeText: string
  beyondResume: string
  targetTitles: string
  roleType: string
  currentTitle: string
  currentCompany: string
}

export function PositioningGeneratorTextarea({
  defaultValue,
  resumeText,
  beyondResume,
  targetTitles,
  roleType,
  currentTitle,
  currentCompany,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [gaps, setGaps] = useState<string[]>([])
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setSuggestion('')
    setGaps([])
    try {
      const res = await fetch('/api/narrative/generate-positioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text:    resumeText,
          beyond_resume:  beyondResume,
          target_titles:  targetTitles.split(',').map(s => s.trim()).filter(Boolean),
          role_type:      roleType,
          current_title:  currentTitle,
          current_company: currentCompany,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSuggestion(data.positioning ?? '')
      setGaps(data.gaps ?? [])
    } catch {
      setError('Request failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleUse() {
    setValue(suggestion)
    setSuggestion('')
    setGaps([])
    textareaRef.current?.focus()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor="positioning_summary" className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
          Positioning summary
        </Label>
        <Button
          type="button"
          variant="link"
          onClick={handleGenerate}
          disabled={loading}
          className="h-auto p-0 text-[11px] font-semibold text-primary"
        >
          {loading ? 'Generating...' : 'Generate from resume'}
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        id="positioning_summary"
        name="positioning_summary"
        rows={4}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="2-3 sentences: your title + years of experience, what you're known for, and what you're targeting next."
        className="resize-none leading-relaxed"
      />

      {error && (
        <p className="mt-1.5 text-[12px] text-destructive">{error}</p>
      )}

      {suggestion && (
        <Card className="mt-2 border-primary/30 bg-primary/10 p-4">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-primary mb-2">Generated suggestion</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{suggestion}</p>
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={handleUse}>
              Use this
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setSuggestion(''); setGaps([]) }}
              className="text-muted-foreground"
            >
              Discard
            </Button>
          </div>
        </Card>
      )}

      {gaps.length > 0 && !suggestion && (
        <Alert variant="warning" className="mt-2">
          <AlertTitle>Narrative gaps</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {gaps.map((gap, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">+</span>{gap}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {gaps.length > 0 && suggestion && (
        <Alert variant="warning" className="mt-2">
          <AlertTitle>Narrative gaps to address</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {gaps.map((gap, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">+</span>{gap}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!value && !suggestion && (
        <div className="mt-2 px-3 py-2.5 bg-muted border border-border rounded text-[12px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Example</span>
          <p className="mt-1">Transformation CIO with 18 years leading enterprise technology modernization in healthcare and financial services. Known for delivering large-scale ERP migrations and building platform engineering teams from scratch. Seeking CIO and VP Technology roles at growth-stage companies where I can drive digital transformation.</p>
        </div>
      )}

      <p className="mt-1.5 text-[12px] text-muted-foreground">Used to personalize interview prep briefs and chat context.</p>
    </div>
  )
}
