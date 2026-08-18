'use client'
import { useState } from 'react'

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
    return <p className="text-[12px] text-slate-400">Thanks. We track every report and improve the prompts.</p>
  }

  if (stage === 'feedback') {
    return (
      <div className="flex flex-col gap-2 max-w-sm">
        <p className="text-[12px] text-slate-500">What&apos;s missing from this brief? (optional)</p>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Missing context, wrong framing, objections not covered..."
          title="Brief feedback"
          className="text-[13px] text-slate-800 border border-slate-200 rounded px-3 py-2 resize-none focus:outline-none focus:border-slate-400 placeholder:text-slate-300"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRate(-1, feedback || undefined)}
            disabled={submitting}
            className="text-[12px] font-semibold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded cursor-pointer border-0 disabled:opacity-40"
          >
            {submitting ? 'Sending...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => handleRate(-1)}
            disabled={submitting}
            className="text-[12px] text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 disabled:opacity-40"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-[12px] text-slate-400">
      <span>Useful?</span>
      <button
        type="button"
        onClick={() => handleRate(1)}
        disabled={submitting}
        className="border border-slate-200 rounded px-2.5 py-1 text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer bg-white disabled:opacity-40"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => setStage('feedback')}
        disabled={submitting}
        className="border border-slate-200 rounded px-2.5 py-1 text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer bg-white disabled:opacity-40"
      >
        Flag an issue
      </button>
    </div>
  )
}
