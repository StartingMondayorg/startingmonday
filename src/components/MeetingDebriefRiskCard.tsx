'use client'

import { useMemo, useState } from 'react'

type ScoreValue = 'clear' | 'partial' | 'vague'

type StageQuestion = {
  id: string
  stage: string
  label: string
}

const STAGE_QUESTION_BANK: StageQuestion[] = [
  {
    id: 'screening_1',
    stage: 'Screening call',
    label: 'Why is this role open now, and what changed in the business to create it?',
  },
  {
    id: 'screening_2',
    stage: 'Screening call',
    label: 'What tends to slow execution in this team when priorities shift?',
  },
  {
    id: 'hiring_manager_1',
    stage: 'Hiring manager round',
    label: 'What dependencies could block this role in quarter one?',
  },
  {
    id: 'hiring_manager_2',
    stage: 'Hiring manager round',
    label: 'What support is guaranteed in the first 90 days versus hoped for later?',
  },
  {
    id: 'panel_1',
    stage: 'Cross-functional panel',
    label: 'How do Product, Ops, and Engineering resolve tradeoffs when goals conflict?',
  },
  {
    id: 'panel_2',
    stage: 'Cross-functional panel',
    label: 'Where do cross-functional handoffs most often break down today?',
  },
  {
    id: 'offer_1',
    stage: 'Final / offer stage',
    label: 'What changed about this role in the last 12 months?',
  },
  {
    id: 'offer_2',
    stage: 'Final / offer stage',
    label: 'What would make a high performer leave this role in year one?',
  },
]

function scorePillClass(value: ScoreValue): string {
  switch (value) {
    case 'clear':
      return 'border-success/40 bg-success/10 text-success'
    case 'partial':
      return 'border-warning/40 bg-warning/10 text-warning'
    case 'vague':
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    default:
      return 'border-border/40 bg-muted/50 text-muted-foreground'
  }
}

export function MeetingDebriefRiskCard() {
  const [scores, setScores] = useState<Record<string, ScoreValue>>({})

  const vagueCount = useMemo(() => Object.values(scores).filter((value) => value === 'vague').length, [scores])
  const flagged = vagueCount >= 2

  function setScore(questionId: string, value: ScoreValue) {
    setScores((current) => ({ ...current, [questionId]: value }))
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary">Stage-based question bank and risk scoring</p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Keep the 5 core questions as your default spine. Add 2 situational questions per stage, then score each answer immediately after the meeting.
      </p>

      <div className="mt-4 space-y-4">
        {STAGE_QUESTION_BANK.map((question) => (
          <div key={question.id} className="rounded-lg border border-border bg-card/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{question.stage}</p>
            <p className="mt-1 text-[13px] text-foreground">{question.label}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(['clear', 'partial', 'vague'] as ScoreValue[]).map((value) => {
                const selected = scores[question.id] === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(question.id, value)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${selected ? scorePillClass(value) : 'border-border bg-muted/60 text-muted-foreground hover:border-border hover:text-foreground'}`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>

            <label htmlFor={`${question.id}_answer`} className="mt-3 block text-[12px] font-semibold text-muted-foreground">
              Answer notes
            </label>
            <textarea
              id={`${question.id}_answer`}
              rows={2}
              placeholder="Capture what they said and your interpretation."
              className="mt-1 w-full rounded-lg bg-background/50 border border-border/50 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>

      <div className={`mt-5 rounded-lg border px-4 py-3 ${flagged ? 'border-destructive/40 bg-destructive/10' : 'border-success/30 bg-success/10'}`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground">Culture risk rule</p>
        <p className="mt-1 text-[13px] text-foreground">
          {flagged
            ? `Flag raised: ${vagueCount} answers are scored Vague. Investigate before moving forward.`
            : `Current state: ${vagueCount} answers are scored Vague. If this reaches 2 or more, investigate before moving forward.`}
        </p>
      </div>
    </div>
  )
}
