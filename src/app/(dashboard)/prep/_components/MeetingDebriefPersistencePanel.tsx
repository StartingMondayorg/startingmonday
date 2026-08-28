'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle, Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
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
      return 'border-success/40 bg-success/10 text-success'
    case 'partial':
      return 'border-warning/40 bg-warning/10 text-warning'
    case 'vague':
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    default:
      return 'border-border bg-muted/60 text-muted-foreground'
  }
}

function signalClass(signal: ConsistencySignal): string {
  switch (signal) {
    case 'stable':
      return 'text-success'
    case 'mixed':
      return 'text-warning'
    case 'high-risk':
      return 'text-destructive'
    default:
      return 'text-muted-foreground'
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
      <Card className="border-primary/30 bg-primary/5 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-primary">Stage-based question bank and risk scoring</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Keep the 5 core questions as the default spine, add 2 situational questions per interview stage, score answers immediately, and escalate if 2 or more are Vague.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="meeting_name_persist" className="block text-[13px] font-semibold text-foreground mb-2">Meeting name or company</Label>
          <Input
            id="meeting_name_persist"
            value={meetingName}
            onChange={(event) => setMeetingName(event.target.value)}
            type="text"
            placeholder="e.g., Alto-Shaam role-fit call"
            className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
          />
        </div>
        <div>
          <Label htmlFor="meeting_date_persist" className="block text-[13px] font-semibold text-foreground mb-2">Meeting date</Label>
          <Input
            id="meeting_date_persist"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
            type="date"
            className="bg-background/50 border-border/50 text-foreground focus-visible:border-primary/50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="interviewer_name_persist" className="block text-[13px] font-semibold text-foreground mb-2">Interviewer name (optional)</Label>
          <Input
            id="interviewer_name_persist"
            value={interviewerName}
            onChange={(event) => setInterviewerName(event.target.value)}
            type="text"
            placeholder="e.g., Jane Smith"
            className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
          />
        </div>

        <div>
          <Label htmlFor="interview_stage_persist" className="block text-[13px] font-semibold text-foreground mb-2">Interview stage (optional)</Label>
          <Input
            id="interview_stage_persist"
            value={interviewStage}
            onChange={(event) => setInterviewStage(event.target.value)}
            type="text"
            placeholder="e.g., Hiring manager round"
            className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Core culture + retention questions</p>
        {CORE_QUESTION_IDS.map((question) => (
          <div key={question.id}>
            <Label htmlFor={question.id} className="block text-[13px] font-semibold text-foreground mb-2">{question.label}</Label>
            <Textarea
              id={question.id}
              rows={2}
              value={coreAnswers[question.id] ?? ''}
              onChange={(event) => updateCoreAnswer(question.id, event.target.value)}
              placeholder="Capture what they said and your interpretation."
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Stage-based situational questions</p>
        {STAGE_QUESTION_BANK.map((question) => (
          <Card key={question.id} className="border-border bg-card/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{question.stage}</p>
            <p className="mt-1 text-[13px] text-foreground">{question.label}</p>

            <ToggleGroup
              value={stageScores[question.id] ? [stageScores[question.id]] : []}
              onValueChange={(values) => { if (values[0]) updateScore(question.id, values[0] as ScoreValue) }}
              className="mt-3 flex flex-wrap justify-start gap-2"
            >
              {(['clear', 'partial', 'vague'] as ScoreValue[]).map((score) => {
                const selected = stageScores[question.id] === score
                return (
                  <ToggleGroupItem
                    key={score}
                    value={score}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${selected ? scorePillClass(score) : 'border-border bg-muted/60 text-muted-foreground hover:border-border hover:text-foreground'}`}
                  >
                    {score}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>

            <Label htmlFor={`${question.id}_persist_answer`} className="mt-3 block text-[12px] font-semibold text-muted-foreground">Answer notes</Label>
            <Textarea
              id={`${question.id}_persist_answer`}
              rows={2}
              value={stageAnswers[question.id] ?? ''}
              onChange={(event) => updateStageAnswer(question.id, event.target.value)}
              placeholder="Write exactly what they said plus your take."
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
            />
          </Card>
        ))}
      </div>

      <div>
        <Label htmlFor="overall_review_persist" className="block text-[13px] font-semibold text-foreground mb-2">Overall meeting review</Label>
        <Textarea
          id="overall_review_persist"
          rows={4}
          value={overallReview}
          onChange={(event) => setOverallReview(event.target.value)}
          placeholder="Summarize confidence level, top risks, and your recommendation for next move."
          className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50"
        />
      </div>

      <Alert variant={riskFlag ? 'destructive' : 'success'}>
        <AlertTitle>Culture risk rule</AlertTitle>
        <AlertDescription>
          {riskFlag
            ? `Flag raised: ${vagueCount} answers are scored Vague. Investigate before moving forward.`
            : `Current state: ${vagueCount} answers are scored Vague. If this reaches 2 or more, investigate before moving forward.`}
        </AlertDescription>
      </Alert>

      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {success ? <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSaveDebrief}
          disabled={loading}
        >
          {loading ? 'Saving debrief...' : 'Save debrief'}
        </Button>
      </div>

      <Card className="border-border bg-card/40 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Debrief history</p>
        {loadingHistory ? (
          <p className="mt-3 text-[13px] text-muted-foreground">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">No saved debriefs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table className="min-w-[720px] text-left text-[13px]">
              <TableHeader>
                <TableRow className="border-border text-muted-foreground hover:bg-transparent">
                  <TableHead className="px-2 py-2 font-semibold">Meeting</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Date</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Interviewer</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Stage</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Vague</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className="border-border text-foreground align-top">
                    <TableCell className="px-2 py-2">{item.meeting_name}</TableCell>
                    <TableCell className="px-2 py-2">{item.meeting_date}</TableCell>
                    <TableCell className="px-2 py-2">{item.interviewer_name ?? '-'}</TableCell>
                    <TableCell className="px-2 py-2">{item.interview_stage ?? '-'}</TableCell>
                    <TableCell className="px-2 py-2">{item.vague_count}</TableCell>
                    <TableCell className="px-2 py-2">{item.risk_flag ? 'Flagged' : 'Clear'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="border-border bg-card/40 p-5 sm:p-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Interviewer consistency over time</p>
        {loadingHistory ? (
          <p className="mt-3 text-[13px] text-muted-foreground">Loading interviewer consistency...</p>
        ) : consistencyRows.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">Add interviewer names to compare consistency trends over time.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table className="min-w-[720px] text-left text-[13px]">
              <TableHeader>
                <TableRow className="border-border text-muted-foreground hover:bg-transparent">
                  <TableHead className="px-2 py-2 font-semibold">Interviewer</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Meetings</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Avg vague count</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Risk flag rate</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Latest</TableHead>
                  <TableHead className="px-2 py-2 font-semibold">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consistencyRows.map((row) => (
                  <TableRow key={row.interviewer} className="border-border text-foreground hover:bg-transparent">
                    <TableCell className="px-2 py-2">{row.interviewer}</TableCell>
                    <TableCell className="px-2 py-2">{row.meetings}</TableCell>
                    <TableCell className="px-2 py-2">{row.avgVagueCount.toFixed(2)}</TableCell>
                    <TableCell className="px-2 py-2">{Math.round(row.riskFlagRate * 100)}%</TableCell>
                    <TableCell className="px-2 py-2">{row.latestMeetingDate ?? '-'}</TableCell>
                    <TableCell className={`px-2 py-2 font-semibold ${signalClass(row.consistencySignal)}`}>{row.consistencySignal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
