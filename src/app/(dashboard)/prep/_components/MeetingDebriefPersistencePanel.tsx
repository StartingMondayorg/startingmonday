'use client'

import { useEffect, useMemo, useState } from 'react'

type ScoreValue = 'clear' | 'partial' | 'vague'
type ConsistencySignal = 'stable' | 'mixed' | 'high-risk'

type StageQuestion = {
  id: string
  stage: string
  label: string
}

type DebriefItem = {
  id: string
  meeting_name: string
  meeting_date: string
  interviewer_name: string | null
  interview_stage: string | null
  vague_count: number
  risk_flag: boolean
  overall_review: string | null
  created_at: string
}

type ConsistencyRow = {
  interviewer: string
  meetings: number
  avgVagueCount: number
  riskFlagRate: number
  latestMeetingDate: string | null
  consistencySignal: ConsistencySignal
}

const CORE_QUESTION_IDS = [
  {
    id: 'core_1',
    label: 'What behavior gets rewarded when priorities conflict?',
  },
  {
    id: 'core_2',
    label: 'Where did the last person in this role get stuck?',
  },
  {
    id: 'core_3',
    label: 'What defines success at day 90 and day 365?',
  },
  {
    id: 'core_4',
    label: 'How stable is the sponsor and direct manager runway?',
  },
  {
    id: 'core_5',
    label: 'What is the true operating cadence: disciplined execution or recurring fire drills?',
  },
] as const

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
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    case 'partial':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
    case 'vague':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-200'
    default:
      return 'border-slate-700 bg-slate-800/60 text-slate-400'
  }
}

function signalClass(signal: ConsistencySignal): string {
  switch (signal) {
    case 'stable':
      return 'text-emerald-300'
    case 'mixed':
      return 'text-amber-300'
    case 'high-risk':
      return 'text-rose-300'
    default:
      return 'text-slate-300'
  }
}

export function MeetingDebriefPersistencePanel() {
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [interviewerName, setInterviewerName] = useState('')
  const [interviewStage, setInterviewStage] = useState('')
  const [overallReview, setOverallReview] = useState('')

  const [coreAnswers, setCoreAnswers] = useState<Record<string, string>>({})
  const [stageAnswers, setStageAnswers] = useState<Record<string, string>>({})
  const [stageScores, setStageScores] = useState<Record<string, ScoreValue>>({})

  const [history, setHistory] = useState<DebriefItem[]>([])
  const [consistencyRows, setConsistencyRows] = useState<ConsistencyRow[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const vagueCount = useMemo(() => Object.values(stageScores).filter((value) => value === 'vague').length, [stageScores])
  const riskFlag = vagueCount >= 2

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/meetings/debrief?limit=40', { method: 'GET' })
      const body = await res.json() as {
        ok?: boolean
        items?: DebriefItem[]
        interviewerConsistency?: ConsistencyRow[]
        error?: string
      }

      if (!res.ok || !body.ok) {
        setError(body.error ?? 'Failed to load meeting debrief history')
        return
      }

      setHistory(body.items ?? [])
      setConsistencyRows(body.interviewerConsistency ?? [])
    } catch {
      setError('Failed to load meeting debrief history')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
     
  }, [])

  function updateCoreAnswer(id: string, value: string) {
    setCoreAnswers((current) => ({ ...current, [id]: value }))
  }

  function updateStageAnswer(id: string, value: string) {
    setStageAnswers((current) => ({ ...current, [id]: value }))
  }

  function updateScore(id: string, value: ScoreValue) {
    setStageScores((current) => ({ ...current, [id]: value }))
  }

  async function handleSaveDebrief() {
    setError(null)
    setSuccess(null)

    if (!meetingName.trim()) {
      setError('Meeting name is required.')
      return
    }

    if (!meetingDate) {
      setError('Meeting date is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/meetings/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingName,
          meetingDate,
          interviewerName,
          interviewStage,
          coreAnswers,
          stageAnswers,
          stageScores,
          overallReview,
        }),
      })

      const body = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !body.ok) {
        setError(body.error ?? 'Failed to save debrief.')
        return
      }

      setSuccess('Meeting debrief saved. History and interviewer consistency updated.')
      await loadHistory()
    } catch {
      setError('Failed to save debrief.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-orange-300">Stage-based question bank and risk scoring</p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          Keep the 5 core questions as the default spine, add 2 situational questions per interview stage, score answers immediately, and escalate if 2 or more are Vague.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="meeting_name_persist" className="block text-[13px] font-semibold text-slate-200 mb-2">Meeting name or company</label>
          <input
            id="meeting_name_persist"
            value={meetingName}
            onChange={(event) => setMeetingName(event.target.value)}
            type="text"
            placeholder="e.g., Alto-Shaam role-fit call"
            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
          />
        </div>
        <div>
          <label htmlFor="meeting_date_persist" className="block text-[13px] font-semibold text-slate-200 mb-2">Meeting date</label>
          <input
            id="meeting_date_persist"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
            type="date"
            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="interviewer_name_persist" className="block text-[13px] font-semibold text-slate-200 mb-2">Interviewer name (optional)</label>
          <input
            id="interviewer_name_persist"
            value={interviewerName}
            onChange={(event) => setInterviewerName(event.target.value)}
            type="text"
            placeholder="e.g., Jane Smith"
            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
          />
        </div>

        <div>
          <label htmlFor="interview_stage_persist" className="block text-[13px] font-semibold text-slate-200 mb-2">Interview stage (optional)</label>
          <input
            id="interview_stage_persist"
            value={interviewStage}
            onChange={(event) => setInterviewStage(event.target.value)}
            type="text"
            placeholder="e.g., Hiring manager round"
            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Core culture + retention questions</p>
        {CORE_QUESTION_IDS.map((question) => (
          <div key={question.id}>
            <label htmlFor={question.id} className="block text-[13px] font-semibold text-slate-200 mb-2">{question.label}</label>
            <textarea
              id={question.id}
              rows={2}
              value={coreAnswers[question.id] ?? ''}
              onChange={(event) => updateCoreAnswer(question.id, event.target.value)}
              placeholder="Capture what they said and your interpretation."
              className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Stage-based situational questions</p>
        {STAGE_QUESTION_BANK.map((question) => (
          <div key={question.id} className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{question.stage}</p>
            <p className="mt-1 text-[13px] text-slate-100">{question.label}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {(['clear', 'partial', 'vague'] as ScoreValue[]).map((score) => {
                const selected = stageScores[question.id] === score
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => updateScore(question.id, score)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${selected ? scorePillClass(score) : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                  >
                    {score}
                  </button>
                )
              })}
            </div>

            <label htmlFor={`${question.id}_persist_answer`} className="mt-3 block text-[12px] font-semibold text-slate-300">Answer notes</label>
            <textarea
              id={`${question.id}_persist_answer`}
              rows={2}
              value={stageAnswers[question.id] ?? ''}
              onChange={(event) => updateStageAnswer(question.id, event.target.value)}
              placeholder="Write exactly what they said plus your take."
              className="mt-1 w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-3 py-2 text-[13px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="overall_review_persist" className="block text-[13px] font-semibold text-slate-200 mb-2">Overall meeting review</label>
        <textarea
          id="overall_review_persist"
          rows={4}
          value={overallReview}
          onChange={(event) => setOverallReview(event.target.value)}
          placeholder="Summarize confidence level, top risks, and your recommendation for next move."
          className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
        />
      </div>

      <div className={`rounded-lg border px-4 py-3 ${riskFlag ? 'border-rose-400/40 bg-rose-500/10' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-100">Culture risk rule</p>
        <p className="mt-1 text-[13px] text-slate-200">
          {riskFlag
            ? `Flag raised: ${vagueCount} answers are scored Vague. Investigate before moving forward.`
            : `Current state: ${vagueCount} answers are scored Vague. If this reaches 2 or more, investigate before moving forward.`}
        </p>
      </div>

      {error ? <p className="text-[13px] text-rose-300">{error}</p> : null}
      {success ? <p className="text-[13px] text-emerald-300">{success}</p> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveDebrief}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-[13px] font-semibold text-slate-900 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Saving debrief...' : 'Save debrief'}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-300">Debrief history</p>
        {loadingHistory ? (
          <p className="mt-3 text-[13px] text-slate-400">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-400">No saved debriefs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-2 py-2 font-semibold">Meeting</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">Interviewer</th>
                  <th className="px-2 py-2 font-semibold">Stage</th>
                  <th className="px-2 py-2 font-semibold">Vague</th>
                  <th className="px-2 py-2 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 text-slate-200 align-top">
                    <td className="px-2 py-2">{item.meeting_name}</td>
                    <td className="px-2 py-2">{item.meeting_date}</td>
                    <td className="px-2 py-2">{item.interviewer_name ?? '-'}</td>
                    <td className="px-2 py-2">{item.interview_stage ?? '-'}</td>
                    <td className="px-2 py-2">{item.vague_count}</td>
                    <td className="px-2 py-2">{item.risk_flag ? 'Flagged' : 'Clear'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-300">Interviewer consistency over time</p>
        {loadingHistory ? (
          <p className="mt-3 text-[13px] text-slate-400">Loading interviewer consistency...</p>
        ) : consistencyRows.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-400">Add interviewer names to compare consistency trends over time.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-2 py-2 font-semibold">Interviewer</th>
                  <th className="px-2 py-2 font-semibold">Meetings</th>
                  <th className="px-2 py-2 font-semibold">Avg vague count</th>
                  <th className="px-2 py-2 font-semibold">Risk flag rate</th>
                  <th className="px-2 py-2 font-semibold">Latest</th>
                  <th className="px-2 py-2 font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody>
                {consistencyRows.map((row) => (
                  <tr key={row.interviewer} className="border-b border-white/5 text-slate-200">
                    <td className="px-2 py-2">{row.interviewer}</td>
                    <td className="px-2 py-2">{row.meetings}</td>
                    <td className="px-2 py-2">{row.avgVagueCount.toFixed(2)}</td>
                    <td className="px-2 py-2">{Math.round(row.riskFlagRate * 100)}%</td>
                    <td className="px-2 py-2">{row.latestMeetingDate ?? '-'}</td>
                    <td className={`px-2 py-2 font-semibold ${signalClass(row.consistencySignal)}`}>{row.consistencySignal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
