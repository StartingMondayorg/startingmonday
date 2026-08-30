'use client'
import { useState } from 'react'
import { Button, Textarea } from '@/components/ui'
export function BriefRating({ briefId }: { briefId: string }) {
  const [stage, setStage] = useState<'idle' | 'feedback' | 'done'>('idle')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleRate(r: 1 | -1, feedbackText?: string) {
    setSubmitting(true)
    try {
      await fetch(`/api/briefs/${briefId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: r, feedback: feedbackText ?? null }),
      })
      setStage('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'done') {
    return <p className="text-[12px] text-muted-foreground">Thanks. We track every report and improve the prompts.</p>
  }

  if (stage === 'feedback') {
    return (
      <div className="flex flex-col gap-2 max-w-sm">
        <p className="text-[12px] text-muted-foreground">What&apos;s missing from this brief? (optional)</p>
        <Textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Missing context, wrong framing, objections not covered..."
          title="Brief feedback"
          className="text-[13px] text-foreground resize-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => handleRate(-1, feedback || undefined)}
            disabled={submitting}
            className="text-[12px] font-semibold px-3 py-1.5 disabled:opacity-40"
          >
            {submitting ? 'Sending...' : 'Submit'}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => handleRate(-1)}
            disabled={submitting}
            className="text-[12px] text-muted-foreground disabled:opacity-40"
          >
            Skip
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
      <span>Useful?</span>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleRate(1)}
        disabled={submitting}
        className="px-2.5 py-1 text-muted-foreground disabled:opacity-40"
      >
        Yes
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setStage('feedback')}
        disabled={submitting}
        className="px-2.5 py-1 text-muted-foreground disabled:opacity-40"
      >
        Flag an issue
      </Button>
    </div>
  )
}
