'use client'

import { useEffect, useState } from 'react'
import { CoachPreSessionSnapshot } from '@/app/(dashboard)/dashboard/_components/CoachPreSessionSnapshot'
import { Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui'
interface Scorecard {
  pipeline: {
    total_companies: number
    by_stage: {
      watching: number
      researching: number
      applied: number
      interviewing_or_offer: number
    }
    avg_fit_score: number
  }
  signals: {
    last_30_days: number
    avg_score: number
  }
  preparation: {
    briefs_last_30_days: number
    interviews_last_30_days: number
    interviews_by_outcome: {
      successful: number
      advancing: number
      rejected: number
    }
  }
  activity_health: {
    is_active: boolean
    last_signal_days: number
    last_brief_days: number
  }
  session_prep_snapshot: {
    baseline_started_at: string | null
    baseline_label: string
    signals_since_last_session: number
    pipeline_changes_since_last_session: number
    brief_reviews_since_last_session: number
    interviews_since_last_session: number
    active_pipeline_count: number
    overdue_actions: number
    stalled_lanes: Array<{
      lane: 'signals' | 'pipeline' | 'preparation'
      state: 'healthy' | 'watch' | 'stalled'
      reason: string
    }>
  }
  weekly_trends: Array<{
    week_start: string
    signals: number
    briefs: number
    interviews: number
  }>
}

interface NextAction {
  id: string
  action: string
  due_date: string
  status: string
  next_action_owner: string | null
  next_action_due_date: string | null
  next_action_status: string | null
  is_overdue: boolean
}

interface WeeklyReview {
  id: string
  week_start: string
  review_answers: Record<string, any>
  next_follow_up_id: string | null
  status: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface WorkflowData {
  week_start: string
  current_review: WeeklyReview | null
  recent_reviews: WeeklyReview[]
  agenda_templates?: Array<{
    id: string
    label: string
    items: string[]
  }>
}

interface Company {
  id: string
  name: string
  stage: string
  fit_score: number
  notes?: string
}

interface Signal {
  id: string
  companies?: { name: string } | null
  signal_type: string
  signal_summary: string
  signal_date: string
  source_url?: string | null
}

interface Brief {
  id: string
  company_id: string
  companies?: { name: string } | null
  type: string
  output_text: string
  user_rating?: number | null
  lifecycle_state?: string | null
  reviewed_at?: string | null
  used_at?: string | null
  created_at: string
}

export function CoachClientDataView({ clientId }: { clientId: string }) {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [nextAction, setNextAction] = useState<NextAction | null>(null)
  const [actionDraft, setActionDraft] = useState({ action: '', owner: '', dueDate: '', status: 'open' })
  const [weeklyAnswers, setWeeklyAnswers] = useState({ signals: '', pipeline: '', brief: '', nextStep: '' })
  const [agendaTemplateId, setAgendaTemplateId] = useState('pipeline_reset')
  const [agendaItemsText, setAgendaItemsText] = useState('')
  const [sessionNotes, setSessionNotes] = useState({ wins: '', risks: '', decisions: '', freeform: '' })
  const [weeklyStateSignals, setWeeklyStateSignals] = useState({ confidenceLevel: 'steady', momentumLevel: 'building', narrativeDrift: '' })
  const [activeTab, setActiveTab] = useState('prep')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingAction, setSavingAction] = useState(false)
  const [savingReview, setSavingReview] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  const [extractingActions, setExtractingActions] = useState(false)
  const [updatingBriefId, setUpdatingBriefId] = useState<string | null>(null)

  const todayIso = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [scorecardRes, companiesRes, signalsRes, briefsRes, actionsRes, reviewRes] = await Promise.all([
          fetch(`/api/coach/client/${clientId}/scorecards`),
          fetch(`/api/coach/client/${clientId}/companies`),
          fetch(`/api/coach/client/${clientId}/signals`),
          fetch(`/api/coach/client/${clientId}/briefs`),
          fetch(`/api/coach/client/${clientId}/actions`),
          fetch(`/api/coach/client/${clientId}/weekly-review`),
        ])

        if (!scorecardRes.ok) throw new Error('Failed to load scorecard')
        if (!companiesRes.ok) throw new Error('Failed to load companies')
        if (!signalsRes.ok) throw new Error('Failed to load signals')
        if (!briefsRes.ok) throw new Error('Failed to load briefs')
        if (!actionsRes.ok) throw new Error('Failed to load next action')
        if (!reviewRes.ok) throw new Error('Failed to load weekly review')

        const scorecardData = await scorecardRes.json()
        const companiesData = await companiesRes.json()
        const signalsData = await signalsRes.json()
        const briefsData = await briefsRes.json()
        const actionsData = await actionsRes.json()
        const reviewData = await reviewRes.json()

        setScorecard(scorecardData.data)
        setCompanies(companiesData.data || [])
        setSignals(signalsData.data || [])
        setBriefs(briefsData.data || [])
        const currentAction = actionsData.data?.current_action ?? null
        setNextAction(currentAction)
        setActionDraft({
          action: currentAction?.action ?? '',
          owner: currentAction?.next_action_owner ?? '',
          dueDate: currentAction?.next_action_due_date ?? currentAction?.due_date ?? '',
          status: currentAction?.next_action_status ?? 'open',
        })

        const workflowData = reviewData.data as WorkflowData
        setWorkflow(workflowData)
        const answers = workflowData.current_review?.review_answers ?? {}
        setWeeklyAnswers({
          signals: answers.signals ?? '',
          pipeline: answers.pipeline ?? '',
          brief: answers.brief ?? '',
          nextStep: answers.nextStep ?? '',
        })
        setAgendaTemplateId(typeof answers.agenda_template === 'string' ? answers.agenda_template : 'pipeline_reset')
        setAgendaItemsText(Array.isArray(answers.agenda_items) ? answers.agenda_items.join('\n') : '')
        const notes = answers.session_notes && typeof answers.session_notes === 'object' ? answers.session_notes : {}
        setSessionNotes({
          wins: typeof notes.wins === 'string' ? notes.wins : '',
          risks: typeof notes.risks === 'string' ? notes.risks : '',
          decisions: typeof notes.decisions === 'string' ? notes.decisions : '',
          freeform: typeof notes.freeform === 'string' ? notes.freeform : '',
        })
        setWeeklyStateSignals({
          confidenceLevel: typeof answers.confidence_level === 'string' ? answers.confidence_level : 'steady',
          momentumLevel: typeof answers.momentum_level === 'string' ? answers.momentum_level : 'building',
          narrativeDrift: typeof answers.narrative_drift === 'string' ? answers.narrative_drift : '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId])

  async function saveNextAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()) return

    setSavingAction(true)
    setActionMessage(null)
    try {
      const response = await fetch(`/api/coach/client/${clientId}/actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nextAction?.id,
          action: actionDraft.action.trim(),
          due_date: actionDraft.dueDate,
          next_action_owner: actionDraft.owner.trim(),
          next_action_due_date: actionDraft.dueDate,
          next_action_status: actionDraft.status,
          status: actionDraft.status,
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to save next action')

      const savedAction = json.data
      setNextAction(savedAction)
      setActionDraft({
        action: savedAction.action ?? '',
        owner: savedAction.next_action_owner ?? '',
        dueDate: savedAction.next_action_due_date ?? savedAction.due_date ?? '',
        status: savedAction.next_action_status ?? 'open',
      })
      setActionMessage('Next action saved.')
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Could not save next action')
    } finally {
      setSavingAction(false)
    }
  }

  async function saveWeeklyReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()) {
      setReviewMessage('Add a next action owner and due date before saving the review.')
      return
    }

    setSavingReview(true)
    setReviewMessage(null)
    try {
      const response = await fetch(`/api/coach/client/${clientId}/weekly-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: workflow?.week_start,
          answers: {
            signals: weeklyAnswers.signals.trim(),
            pipeline: weeklyAnswers.pipeline.trim(),
            brief: weeklyAnswers.brief.trim(),
            nextStep: weeklyAnswers.nextStep.trim(),
          },
          next_action: {
            action: actionDraft.action.trim(),
            owner: actionDraft.owner.trim(),
            due_date: actionDraft.dueDate,
            status: actionDraft.status,
          },
          agenda_template: agendaTemplateId,
          agenda_items: agendaItemsText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8),
          session_notes: {
            wins: sessionNotes.wins.trim(),
            risks: sessionNotes.risks.trim(),
            decisions: sessionNotes.decisions.trim(),
            freeform: sessionNotes.freeform.trim(),
          },
          confidence_level: weeklyStateSignals.confidenceLevel,
          momentum_level: weeklyStateSignals.momentumLevel,
          narrative_drift: weeklyStateSignals.narrativeDrift.trim(),
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to save weekly review')

      const savedAction = json.data?.next_action ?? null
      const savedReview = json.data?.weekly_review ?? null
      if (savedAction) {
        setNextAction(savedAction)
        setActionDraft({
          action: savedAction.action ?? '',
          owner: savedAction.next_action_owner ?? '',
          dueDate: savedAction.next_action_due_date ?? savedAction.due_date ?? '',
          status: savedAction.next_action_status ?? 'open',
        })
      }
      if (savedReview) {
        setWorkflow((current) => current ? { ...current, current_review: savedReview, recent_reviews: [savedReview, ...(current.recent_reviews ?? []).filter((review) => review.id !== savedReview.id)].slice(0, 4) } : { week_start: savedReview.week_start, current_review: savedReview, recent_reviews: [savedReview] })
      }
      setReviewMessage('Weekly review and session artifact saved.')
    } catch (err) {
      setReviewMessage(err instanceof Error ? err.message : 'Could not save weekly review')
    } finally {
      setSavingReview(false)
    }
  }

  async function extractActionsFromSession() {
    if (extractingActions) return
    setExtractingActions(true)
    setActionMessage(null)
    try {
      const response = await fetch(`/api/coach/client/${clientId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: actionDraft.owner.trim(),
          due_date: actionDraft.dueDate,
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to extract actions')

      const extracted = Number(json.data?.extracted ?? 0)
      setActionMessage(extracted > 0 ? `Extracted ${extracted} action${extracted === 1 ? '' : 's'} from session notes.` : 'No actionable items found in latest notes.')
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Could not extract actions')
    } finally {
      setExtractingActions(false)
    }
  }

  async function updateBriefLifecycle(briefId: string, lifecycleState: 'reviewed' | 'used') {
    if (updatingBriefId) return
    setUpdatingBriefId(briefId)
    try {
      const response = await fetch(`/api/briefs/${briefId}/lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifecycle_state: lifecycleState }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to update brief lifecycle')

      const updatedBrief = json.data as Brief
      setBriefs((current) => current.map((brief) => (brief.id === briefId ? { ...brief, ...updatedBrief } : brief)))
      setActionMessage(`Brief marked as ${lifecycleState}.`)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to update brief lifecycle')
    } finally {
      setUpdatingBriefId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading client data...</div>
  }

  if (error) {
    return <div className="p-6 text-destructive">Error: {error}</div>
  }

  if (!scorecard) {
    return <div className="p-6 text-center">No data available</div>
  }

  const actionDueDate = nextAction?.next_action_due_date ?? nextAction?.due_date ?? actionDraft.dueDate
  const actionOwner = nextAction?.next_action_owner ?? actionDraft.owner
  const actionStatus = nextAction?.next_action_status ?? actionDraft.status
  const actionIsOverdue = Boolean(actionDueDate && actionStatus !== 'completed' && actionDueDate < todayIso)
  const recentReviews = workflow?.recent_reviews ?? []
  const agendaTemplates = workflow?.agenda_templates ?? []

  return (
    <div className="space-y-6">
      {/* Workflow Snapshot */}
      <Card className="p-4">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">
          Session Prep Snapshot ({scorecard.session_prep_snapshot.baseline_label})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Signals</p>
            <p className="text-[18px] font-bold text-foreground">{scorecard.session_prep_snapshot.signals_since_last_session}</p>
          </Card>
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Pipeline changes</p>
            <p className="text-[18px] font-bold text-foreground">{scorecard.session_prep_snapshot.pipeline_changes_since_last_session}</p>
          </Card>
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Brief reviews</p>
            <p className="text-[18px] font-bold text-foreground">{scorecard.session_prep_snapshot.brief_reviews_since_last_session}</p>
          </Card>
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Active pipeline</p>
            <p className="text-[18px] font-bold text-foreground">{scorecard.session_prep_snapshot.active_pipeline_count}</p>
          </Card>
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Overdue actions</p>
            <p className={`text-[18px] font-bold ${scorecard.session_prep_snapshot.overdue_actions > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {scorecard.session_prep_snapshot.overdue_actions}
            </p>
          </Card>
          <Card className="p-3 bg-muted">
            <p className="text-[11px] text-muted-foreground">Interviews</p>
            <p className="text-[18px] font-bold text-foreground">{scorecard.session_prep_snapshot.interviews_since_last_session}</p>
          </Card>
        </div>
        {scorecard.session_prep_snapshot.stalled_lanes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scorecard.session_prep_snapshot.stalled_lanes.map((lane) => (
              <Badge
                key={`${lane.lane}-${lane.state}`}
                variant={lane.state === 'stalled' ? 'destructive' : 'warning'}
                className="px-3 py-1.5 text-[11px]"
                title={lane.reason}
              >
                {lane.lane} {lane.state}: {lane.reason}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-1 gap-3">
          <Card className={actionIsOverdue ? 'p-3 border-destructive/30 bg-destructive/10' : 'p-3 bg-muted'}>
            <p className="text-[11px] text-muted-foreground">Next action</p>
            <p className="text-[13px] font-semibold text-foreground line-clamp-2">{nextAction?.action ?? actionDraft.action ?? 'Unassigned'}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{actionOwner ? `Owner: ${actionOwner}` : 'Owner: unassigned'}</p>
            <p className={`text-[11px] mt-0.5 ${actionIsOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              Due {actionDueDate || 'TBD'}{actionStatus ? ` · ${actionStatus}` : ''}
            </p>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Next action editor</p>
              <h3 className="text-[16px] font-semibold text-foreground">Manager-style ownership and due date</h3>
            </div>
            {actionIsOverdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
          <form onSubmit={saveNextAction} className="space-y-3">
            <div>
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Action</Label>
              <Input
                value={actionDraft.action}
                onChange={(event) => setActionDraft((current) => ({ ...current, action: event.target.value }))}
                placeholder="Send updated prep brief and confirm interview date"
                className="w-full text-[13px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Owner</Label>
                <Input
                  aria-label="Next action owner"
                  value={actionDraft.owner}
                  onChange={(event) => setActionDraft((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Coach or client"
                  className="w-full text-[13px]"
                />
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Due date</Label>
                <Input
                  aria-label="Next action due date"
                  value={actionDraft.dueDate}
                  onChange={(event) => setActionDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  className="w-full text-[13px]"
                />
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Status</Label>
                <Select
                  value={actionDraft.status}
                  onValueChange={(value) => setActionDraft((current) => ({ ...current, status: value ?? current.status }))}
                >
                  <SelectTrigger aria-label="Next action status" className="w-full text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              disabled={savingAction || !actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()}
              className="text-[13px] font-semibold px-4 py-2"
            >
              {savingAction ? 'Saving...' : 'Save next action'}
            </Button>
            {actionMessage && (
              <p className={`text-[12px] ${actionMessage.includes('saved') ? 'text-success' : 'text-destructive'}`}>{actionMessage}</p>
            )}
          </form>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Weekly review rhythm</p>
          <h3 className="text-[16px] font-semibold text-foreground mb-3">Repeatable in-app workflow</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            Save the current week, then carry the next action forward into the following review.
          </p>
          <div className="space-y-3 text-[13px] text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Current week</span>
              <span className="font-semibold">{workflow?.week_start ?? 'This week'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-success">{workflow?.current_review ? 'Saved' : 'Not saved yet'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Recent reviews</span>
              <span className="font-semibold tabular-nums">{recentReviews.length}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4 space-y-2">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-muted-foreground">Week of {review.week_start}</span>
                  <span className="font-semibold text-foreground">{review.status}</span>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-muted-foreground">No weekly reviews saved yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="border-b border-border justify-start rounded-none px-0">
          {[
            { id: 'prep', label: '⚡ Prep' },
            { id: 'scorecard', label: 'Scorecard' },
            { id: 'review', label: 'Weekly Review' },
            { id: 'trends', label: 'Weekly Trends' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'signals', label: 'Signals' },
            { id: 'briefs', label: 'Briefs' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="px-4 py-3 text-sm font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

      {/* Pre-Session Snapshot Tab */}
      <TabsContent value="prep">
        {scorecard.session_prep_snapshot && (
        <CoachPreSessionSnapshot
          snapshot={scorecard.session_prep_snapshot}
          nextActionText={nextAction?.action ?? undefined}
          confidenceField={
            workflow?.current_review?.review_answers?.confidence_level
              ? String(workflow.current_review.review_answers.confidence_level)
              : undefined
          }
          momentumField={
            workflow?.current_review?.review_answers?.momentum_level
              ? String(workflow.current_review.review_answers.momentum_level)
              : undefined
          }
          narrativeDriftFlag={
            workflow?.current_review?.review_answers?.narrative_drift
              ? String(workflow.current_review.review_answers.narrative_drift)
              : undefined
          }
        />
        )}
      </TabsContent>

      {/* Scorecard Tab */}
      <TabsContent value="scorecard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Companies</span>
                <span className="text-lg font-bold text-foreground">
                  {scorecard.pipeline.total_companies}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(scorecard.pipeline.by_stage).map(([stage, count]) => (
                  <div key={stage} className="text-center">
                    <div className="text-xs text-muted-foreground capitalize">
                      {stage.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-bold text-foreground">{count}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Avg Fit Score</span>
                <span className="text-lg font-bold text-primary">
                  {scorecard.pipeline.avg_fit_score}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Activity Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={`text-sm font-semibold ${
                      scorecard.activity_health.is_active
                        ? 'text-success'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {scorecard.activity_health.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Signal</span>
                <span className="text-sm font-medium text-foreground">
                  {scorecard.activity_health.last_signal_days >= 999
                    ? 'None'
                    : `${scorecard.activity_health.last_signal_days}d ago`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Brief</span>
                <span className="text-sm font-medium text-foreground">
                  {scorecard.activity_health.last_brief_days >= 999
                    ? 'None'
                    : `${scorecard.activity_health.last_brief_days}d ago`}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Signal Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last 30 Days</span>
                <span className="text-lg font-bold text-foreground">
                  {scorecard.signals.last_30_days}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Score</span>
                <span className="text-lg font-bold text-primary">
                  {scorecard.signals.avg_score}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Interview Outcomes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Successful</span>
                <span className="text-lg font-bold text-success">
                  {scorecard.preparation.interviews_by_outcome.successful}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Advancing</span>
                <span className="text-lg font-bold text-info">
                  {scorecard.preparation.interviews_by_outcome.advancing}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rejected</span>
                <span className="text-lg font-bold text-destructive">
                  {scorecard.preparation.interviews_by_outcome.rejected}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </TabsContent>

      {/* Weekly Review Tab */}
      <TabsContent value="review">
        <form onSubmit={saveWeeklyReview} className="space-y-5 border border-border rounded-lg p-5 bg-card">
          {/* Header */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-1">Weekly Review Ritual</p>
            <h3 className="text-[16px] font-semibold text-foreground">Four-part session operating loop</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              Week of {workflow?.week_start ?? 'this week'} · Complete all four parts to save.
            </p>
          </div>

          {/* Part 1: Strategic Decision */}
          <Card className="border-info/30 bg-info/10 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="h-6 w-6 rounded-full bg-info p-0 text-info-foreground text-[11px] font-bold justify-center flex-shrink-0">1</Badge>
              <p className="text-[13px] font-bold text-info">Strategic decision this session</p>
            </div>
            <p className="text-[12px] text-info leading-relaxed">
              What is the one strategic call the client needs to make - targeting, narrative, sequencing, or go/no-go?
            </p>
            <Textarea
              value={sessionNotes.decisions}
              onChange={(event) => setSessionNotes((current) => ({ ...current, decisions: event.target.value }))}
              rows={3}
              className="w-full border-info/30 resize-none bg-card"
              placeholder="e.g. Decide whether to pursue the CFO role at Acme or hold for the PE-backed opportunity."
            />
          </Card>

          {/* Part 2: Risk */}
          <Card className="border-destructive/30 bg-destructive/10 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="h-6 w-6 rounded-full bg-destructive p-0 text-destructive-foreground text-[11px] font-bold justify-center flex-shrink-0">2</Badge>
              <p className="text-[13px] font-bold text-destructive">Risk and blockers</p>
            </div>
            <p className="text-[12px] text-destructive leading-relaxed">
              What could derail momentum this week - signals missed, confidence drop, narrative inconsistency, or pipeline stall?
            </p>
            <Textarea
              value={sessionNotes.risks}
              onChange={(event) => setSessionNotes((current) => ({ ...current, risks: event.target.value }))}
              rows={3}
              className="w-full border-destructive/30 resize-none bg-card"
              placeholder="e.g. Client has not responded to three tier-1 contacts - outreach rhythm is stalling."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">What changed in signals?</label>
                <Textarea
                  value={weeklyAnswers.signals}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, signals: event.target.value }))}
                  rows={2}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                  placeholder="New hires, funding, exits, board changes"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Which companies moved or stalled?</label>
                <Textarea
                  value={weeklyAnswers.pipeline}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, pipeline: event.target.value }))}
                  rows={2}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                  placeholder="Stage changes, blockers, interview progress"
                />
              </div>
            </div>
          </Card>

          {/* Part 3: Narrative Shift */}
          <Card className="border-warning/30 bg-warning/10 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="h-6 w-6 rounded-full bg-warning p-0 text-warning-foreground text-[11px] font-bold justify-center flex-shrink-0">3</Badge>
              <p className="text-[13px] font-bold text-warning">Narrative adjustment</p>
            </div>
            <p className="text-[12px] text-warning leading-relaxed">
              Did the client's story change this week? Did an objection reveal a gap in the current narrative?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Narrative change or rehearsal need</label>
                <Textarea
                  value={weeklyAnswers.brief}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, brief: event.target.value }))}
                  rows={3}
                  className="w-full border border-warning/30 rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                  placeholder="e.g. Client weakened on 'why now' - needs tighter inflection story."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Wins to reinforce</label>
                <Textarea
                  value={sessionNotes.wins}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, wins: event.target.value }))}
                  rows={3}
                  className="w-full border border-warning/30 rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                  placeholder="Moments of strong narrative delivery or target progress."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Freeform session notes</label>
              <Textarea
                value={sessionNotes.freeform}
                onChange={(event) => setSessionNotes((current) => ({ ...current, freeform: event.target.value }))}
                rows={3}
                className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                placeholder="Context, observations, themes to track."
              />
            </div>
          </Card>

          <Card className="border-border bg-muted/70 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="h-6 w-6 rounded-full bg-muted p-0 text-foreground text-[11px] font-bold justify-center flex-shrink-0">4</Badge>
              <p className="text-[13px] font-bold text-foreground">State signals</p>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Record the client&apos;s current confidence, momentum, and any explicit narrative drift worth surfacing next session.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="weekly-state-confidence" className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Confidence level</Label>
                <Select
                  value={weeklyStateSignals.confidenceLevel}
                  onValueChange={(value) => setWeeklyStateSignals((current) => ({ ...current, confidenceLevel: value ?? current.confidenceLevel }))}
                >
                  <SelectTrigger id="weekly-state-confidence" className="w-full text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="steady">Steady</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="weekly-state-momentum" className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Momentum level</Label>
                <Select
                  value={weeklyStateSignals.momentumLevel}
                  onValueChange={(value) => setWeeklyStateSignals((current) => ({ ...current, momentumLevel: value ?? current.momentumLevel }))}
                >
                  <SelectTrigger id="weekly-state-momentum" className="w-full text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slowing">Slowing</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="accelerating">Accelerating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Narrative drift note</label>
              <Textarea
                value={weeklyStateSignals.narrativeDrift}
                onChange={(event) => setWeeklyStateSignals((current) => ({ ...current, narrativeDrift: event.target.value }))}
                rows={3}
                className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                placeholder="e.g. Story is leaning too operational; needs a sharper strategic arc."
              />
            </div>
          </Card>

          {/* Part 4: Next Action */}
          <Card className="border-success/30 bg-success/10 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="h-6 w-6 rounded-full bg-success p-0 text-success-foreground text-[11px] font-bold justify-center flex-shrink-0">5</Badge>
              <p className="text-[13px] font-bold text-success">Committed next action</p>
            </div>
            <p className="text-[12px] text-success leading-relaxed">
              One non-negotiable action with a named owner and a hard deadline. Review cannot be saved without this.
            </p>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">What is the one action before next session?</label>
              <Textarea
                value={weeklyAnswers.nextStep}
                onChange={(event) => setWeeklyAnswers((current) => ({ ...current, nextStep: event.target.value }))}
                rows={2}
                className="w-full border border-success/30 rounded px-3 py-2 text-[13px] focus:outline-none resize-none bg-card"
                placeholder="e.g. Send follow-up to three tier-1 contacts by Thursday."
              />
            </div>
          </Card>

          <Card className="p-4 bg-muted">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Session note capture</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Wins</label>
                <Textarea
                  value={sessionNotes.wins}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, wins: event.target.value }))}
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none"
                  placeholder="What improved this week"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Risks</label>
                <Textarea
                  value={sessionNotes.risks}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, risks: event.target.value }))}
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none"
                  placeholder="What is at risk"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Decisions</label>
                <Textarea
                  value={sessionNotes.decisions}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, decisions: event.target.value }))}
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none"
                  placeholder="Decisions made in session"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Freeform notes</label>
                <Textarea
                  value={sessionNotes.freeform}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, freeform: event.target.value }))}
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-[13px] focus:outline-none resize-none"
                  placeholder="Context and narrative from the session"
                />
              </div>
            </div>
            {/* Owner, due date, status inside Part 4 */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {actionIsOverdue && <Badge variant="destructive">Overdue</Badge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Action (system field)</label>
                <Input
                  aria-label="Weekly review next action"
                  value={actionDraft.action}
                  onChange={(event) => setActionDraft((current) => ({ ...current, action: event.target.value }))}
                  placeholder="Confirm interview prep session"
                  className="w-full border border-success/30 rounded px-3 py-2 text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Owner</label>
                <Input
                  aria-label="Weekly review next action owner"
                  value={actionDraft.owner}
                  onChange={(event) => setActionDraft((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Client or coach"
                  className="w-full border border-success/30 rounded px-3 py-2 text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Deadline</label>
                <Input
                  aria-label="Weekly review next action due date"
                  value={actionDraft.dueDate}
                  onChange={(event) => setActionDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  className="w-full border border-success/30 rounded px-3 py-2 text-[13px] focus:outline-none"
                />
              </div>
            </div>
            <div className="max-w-[220px]">
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Status</Label>
              <Select
                value={actionDraft.status}
                onValueChange={(value) => setActionDraft((current) => ({ ...current, status: value ?? current.status }))}
              >
                <SelectTrigger aria-label="Weekly review next action status" className="w-full text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={savingReview || !actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()}
              className="text-[13px] font-semibold px-4 py-2"
            >
              {savingReview ? 'Saving review...' : 'Save weekly review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={extractActionsFromSession}
              disabled={extractingActions}
              className="text-[13px] font-semibold px-4 py-2"
            >
              {extractingActions ? 'Extracting...' : 'Extract actions from notes'}
            </Button>
          </div>

          {reviewMessage && (
            <p className={`text-[12px] ${reviewMessage.includes('saved') ? 'text-success' : 'text-destructive'}`}>{reviewMessage}</p>
          )}

          {recentReviews.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Recent reviews</p>
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <Card key={review.id} className="p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[12px] font-semibold text-foreground">Week of {review.week_start}</p>
                      <span className="text-[11px] text-muted-foreground">{review.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                      <p><span className="font-semibold text-muted-foreground">Signals:</span> {review.review_answers.signals ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Pipeline:</span> {review.review_answers.pipeline ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Brief:</span> {review.review_answers.brief ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Next step:</span> {review.review_answers.nextStep ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Confidence:</span> {review.review_answers.confidence_level ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Momentum:</span> {review.review_answers.momentum_level ?? '\u2014'}</p>
                      <p className="md:col-span-2"><span className="font-semibold text-muted-foreground">Narrative drift:</span> {review.review_answers.narrative_drift ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Agenda:</span> {review.review_answers.agenda_template ?? '\u2014'}</p>
                      <p><span className="font-semibold text-muted-foreground">Session notes:</span> {review.review_answers.session_notes?.freeform ?? '\u2014'}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </form>
      </TabsContent>

      {/* Weekly Trends Tab */}
      <TabsContent value="trends">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Progress Markers</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2">Week</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-2">Signals</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-2">Briefs</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-muted-foreground px-4 py-2">Interviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecard.weekly_trends.map((week) => (
                  <TableRow key={week.week_start}>
                    <TableCell className="px-4 py-2 text-[12px] text-muted-foreground">Week of {week.week_start}</TableCell>
                    <TableCell className="px-4 py-2 text-[12px] text-right font-semibold text-foreground tabular-nums">{week.signals}</TableCell>
                    <TableCell className="px-4 py-2 text-[12px] text-right font-semibold text-foreground tabular-nums">{week.briefs}</TableCell>
                    <TableCell className="px-4 py-2 text-[12px] text-right font-semibold text-foreground tabular-nums">{week.interviews}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </TabsContent>

      {/* Pipeline Tab */}
      <TabsContent value="pipeline">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((company) => (
              <Card key={company.id} className="p-4">
                <h4 className="font-semibold text-foreground">{company.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground capitalize">{company.stage}</span>
                  <span className="text-sm font-bold text-primary">{company.fit_score}%</span>
                </div>
                {company.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{company.notes}</p>
                )}
              </Card>
            ))}
          </div>
          {companies.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No companies in pipeline</div>
          )}
        </div>
      </TabsContent>

      {/* Signals Tab */}
      <TabsContent value="signals">
        <div className="space-y-4">
          {signals.slice(0, 20).map((signal) => (
            <Card key={signal.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-foreground">
                  {(signal.companies?.name ?? 'Company')} · {signal.signal_type.replace('_', ' ')}
                </h4>
                <Badge variant="warning" className="capitalize">
                  {signal.signal_type.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{signal.signal_summary}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(signal.signal_date).toLocaleDateString()}
              </p>
              {signal.source_url && (
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Open source
                </a>
              )}
            </Card>
          ))}
          {signals.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No signals detected</div>
          )}
        </div>
      </TabsContent>

      {/* Briefs Tab */}
      <TabsContent value="briefs">
        <div className="space-y-4">
          {briefs.slice(0, 20).map((brief) => (
            <Card key={brief.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {(brief.companies?.name ?? 'General')} · {brief.type}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{brief.output_text}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant={brief.lifecycle_state === 'used' ? 'success' : brief.lifecycle_state === 'reviewed' ? 'info' : 'secondary'}
                    className="uppercase tracking-[0.08em]"
                  >
                    {brief.lifecycle_state ?? 'generated'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { void updateBriefLifecycle(brief.id, 'reviewed') }}
                      disabled={updatingBriefId === brief.id || brief.lifecycle_state === 'reviewed' || brief.lifecycle_state === 'used'}
                      className="text-[11px] font-semibold px-2.5 py-1"
                    >
                      Review
                    </Button>
                    <Button
                      type="button"
                      onClick={() => { void updateBriefLifecycle(brief.id, 'used') }}
                      disabled={updatingBriefId === brief.id || brief.lifecycle_state === 'used'}
                      className="text-[11px] font-semibold px-2.5 py-1"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
              {brief.user_rating !== null && brief.user_rating !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">Rating: {brief.user_rating > 0 ? 'positive' : 'negative'}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {brief.reviewed_at ? `Reviewed ${new Date(brief.reviewed_at).toLocaleDateString()}` : 'Not reviewed yet'}
                {brief.used_at ? ` · Used ${new Date(brief.used_at).toLocaleDateString()}` : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(brief.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
          {briefs.length === 0 && (
            <div className="text-center text-muted-foreground p-8">No briefs created</div>
          )}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  )
}
