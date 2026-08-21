'use client'
import { useState, useRef, useTransition } from 'react'
import { saveMaterial } from './actions'
import { Button, Input, Label, Textarea } from '@/components/ui'
type Props = {
  prospectId: string
  prospectName: string
  prospectType: string
  estimatedSeats?: number | null
  estimatedArr?: number | null
  notes?: string | null
  contacts: { name: string; title?: string | null }[]
}

export default function MaterialClient(props: Props) {
  const { prospectId, prospectName, prospectType, estimatedSeats, estimatedArr, notes, contacts } = props

  const [additionalContext, setAdditionalContext] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [, startTransition] = useTransition()
  const outputRef = useRef<HTMLDivElement>(null)

  const primaryContact = contacts[0]

  async function generate() {
    setOutput('')
    setGenerating(true)
    setSaveTitle(`Leave-behind: ${prospectName}`)

    try {
      const res = await fetch('/api/admin/b2b/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName,
          prospectType,
          estimatedSeats: estimatedSeats ?? null,
          estimatedArr: estimatedArr ?? null,
          notes: notes ?? null,
          contactName: primaryContact?.name ?? null,
          contactTitle: primaryContact?.title ?? null,
          additionalContext: additionalContext.trim() || undefined,
        }),
      })

      if (!res.ok || !res.body) {
        setOutput('Error generating document. Please try again.')
        setGenerating(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        setOutput(buf)
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      }
    } catch {
      setOutput('Error generating document. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSave(formData: FormData) {
    startTransition(() => {
      saveMaterial(formData)
    })
    setOutput('')
    setSaveTitle('')
    setAdditionalContext('')
  }

  return (
    <div className="bg-card border border-border rounded">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex flex-col gap-3">
          <div>
            <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1.5">
              Additional context for this meeting
            </Label>
            <Textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              rows={2}
              placeholder="Upcoming conference they're speaking at, specific pain point mentioned on a call, particular exec cohort they want to help..."
              className="resize-none"
            />
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            className="self-start"
          >
            {generating ? 'Generating...' : 'Generate leave-behind'}
          </Button>
        </div>
      </div>

      {(output || generating) && (
        <div className="px-5 py-4">
          {generating && !output && (
            <div className="text-[13px] text-muted-foreground animate-pulse">Writing...</div>
          )}

          {output && (
            <>
              <div
                ref={outputRef}
                className="text-[13px] text-foreground whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed"
              >
                {output}
              </div>

              {!generating && (
                <div className="mt-4 flex items-start gap-3 flex-wrap border-t border-border pt-4">
                  <Button
                    onClick={copy}
                    variant="secondary"
                  >
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </Button>

                  <form action={handleSave} className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <input type="hidden" name="prospect_id" value={prospectId} />
                    <input type="hidden" name="content" value={output} />
                    <Input
                      name="title"
                      value={saveTitle}
                      onChange={e => setSaveTitle(e.target.value)}
                      placeholder="Title for this version"
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!saveTitle.trim()}
                      className="shrink-0"
                    >
                      Save
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
