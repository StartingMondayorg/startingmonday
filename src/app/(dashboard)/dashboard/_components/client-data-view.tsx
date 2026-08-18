'use client'

import { useEffect, useState } from 'react'
import { CoachPreSessionSnapshot } from '@/app/(dashboard)/dashboard/_components/CoachPreSessionSnapshot'

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
    return <div className="p-6 text-red-600">Error: {error}</div>
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
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-3">
          Session Prep Snapshot ({scorecard.session_prep_snapshot.baseline_label})
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Signals</p>
            <p className="text-[18px] font-bold text-slate-900">{scorecard.session_prep_snapshot.signals_since_last_session}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Pipeline changes</p>
            <p className="text-[18px] font-bold text-slate-900">{scorecard.session_prep_snapshot.pipeline_changes_since_last_session}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Brief reviews</p>
            <p className="text-[18px] font-bold text-slate-900">{scorecard.session_prep_snapshot.brief_reviews_since_last_session}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Active pipeline</p>
            <p className="text-[18px] font-bold text-slate-900">{scorecard.session_prep_snapshot.active_pipeline_count}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Overdue actions</p>
            <p className={`text-[18px] font-bold ${scorecard.session_prep_snapshot.overdue_actions > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {scorecard.session_prep_snapshot.overdue_actions}
            </p>
          </div>
          <div className="rounded border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] text-slate-500">Interviews</p>
            <p className="text-[18px] font-bold text-slate-900">{scorecard.session_prep_snapshot.interviews_since_last_session}</p>
          </div>
        </div>
        {scorecard.session_prep_snapshot.stalled_lanes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scorecard.session_prep_snapshot.stalled_lanes.map((lane) => (
              <div
                key={`${lane.lane}-${lane.state}`}
                className={`rounded-full border px-3 py-1.5 text-[11px] ${lane.state === 'stalled' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                title={lane.reason}
              >
                {lane.lane} {lane.state}: {lane.reason}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-1 gap-3">
          <div className={`rounded border p-3 ${actionIsOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-[11px] text-slate-500">Next action</p>
            <p className="text-[13px] font-semibold text-slate-900 line-clamp-2">{nextAction?.action ?? actionDraft.action ?? 'Unassigned'}</p>
            <p className="text-[11px] text-slate-500 mt-1">{actionOwner ? `Owner: ${actionOwner}` : 'Owner: unassigned'}</p>
            <p className={`text-[11px] mt-0.5 ${actionIsOverdue ? 'text-red-700' : 'text-slate-500'}`}>
              Due {actionDueDate || 'TBD'}{actionStatus ? ` · ${actionStatus}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-1">Next action editor</p>
              <h3 className="text-[16px] font-semibold text-slate-900">Manager-style ownership and due date</h3>
            </div>
            {actionIsOverdue && (
              <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">Overdue</span>
            )}
          </div>
          <form onSubmit={saveNextAction} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Action</label>
              <input
                value={actionDraft.action}
                onChange={(event) => setActionDraft((current) => ({ ...current, action: event.target.value }))}
                placeholder="Send updated prep brief and confirm interview date"
                className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Owner</label>
                <input
                  aria-label="Next action owner"
                  value={actionDraft.owner}
                  onChange={(event) => setActionDraft((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Coach or client"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Due date</label>
                <input
                  aria-label="Next action due date"
                  value={actionDraft.dueDate}
                  onChange={(event) => setActionDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Status</label>
                <select
                  aria-label="Next action status"
                  value={actionDraft.status}
                  onChange={(event) => setActionDraft((current) => ({ ...current, status: event.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-slate-400"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingAction || !actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()}
              className="bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white text-[13px] font-semibold px-4 py-2 rounded transition-colors cursor-pointer border-0"
            >
              {savingAction ? 'Saving...' : 'Save next action'}
            </button>
            {actionMessage && (
              <p className={`text-[12px] ${actionMessage.includes('saved') ? 'text-green-700' : 'text-red-600'}`}>{actionMessage}</p>
            )}
          </form>
        </div>

        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-1">Weekly review rhythm</p>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-3">Repeatable in-app workflow</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
            Save the current week, then carry the next action forward into the following review.
          </p>
          <div className="space-y-3 text-[13px] text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Current week</span>
              <span className="font-semibold">{workflow?.week_start ?? 'This week'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-green-700">{workflow?.current_review ? 'Saved' : 'Not saved yet'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Recent reviews</span>
              <span className="font-semibold tabular-nums">{recentReviews.length}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-slate-600">Week of {review.week_start}</span>
                  <span className="font-semibold text-slate-900">{review.status}</span>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-slate-400">No weekly reviews saved yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          {[
            { id: 'prep', label: '⚡ Prep' },
            { id: 'scorecard', label: 'Scorecard' },
            { id: 'review', label: 'Weekly Review' },
            { id: 'trends', label: 'Weekly Trends' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'signals', label: 'Signals' },
            { id: 'briefs', label: 'Briefs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Session Snapshot Tab */}
      {activeTab === 'prep' && scorecard.session_prep_snapshot && (
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

      {/* Scorecard Tab */}
      {activeTab === 'scorecard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Companies</span>
                <span className="text-lg font-bold text-slate-900">
                  {scorecard.pipeline.total_companies}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(scorecard.pipeline.by_stage).map(([stage, count]) => (
                  <div key={stage} className="text-center">
                    <div className="text-xs text-slate-500 capitalize">
                      {stage.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-bold text-slate-900">{count}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-600">Avg Fit Score</span>
                <span className="text-lg font-bold text-orange-600">
                  {scorecard.pipeline.avg_fit_score}%
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Status</span>
                  <span
                    className={`text-sm font-semibold ${
                      scorecard.activity_health.is_active
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {scorecard.activity_health.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Last Signal</span>
                <span className="text-sm font-medium text-slate-900">
                  {scorecard.activity_health.last_signal_days >= 999
                    ? 'None'
                    : `${scorecard.activity_health.last_signal_days}d ago`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Last Brief</span>
                <span className="text-sm font-medium text-slate-900">
                  {scorecard.activity_health.last_brief_days >= 999
                    ? 'None'
                    : `${scorecard.activity_health.last_brief_days}d ago`}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Signal Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Last 30 Days</span>
                <span className="text-lg font-bold text-slate-900">
                  {scorecard.signals.last_30_days}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg Score</span>
                <span className="text-lg font-bold text-orange-600">
                  {scorecard.signals.avg_score}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Interview Outcomes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Successful</span>
                <span className="text-lg font-bold text-green-600">
                  {scorecard.preparation.interviews_by_outcome.successful}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Advancing</span>
                <span className="text-lg font-bold text-blue-600">
                  {scorecard.preparation.interviews_by_outcome.advancing}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Rejected</span>
                <span className="text-lg font-bold text-red-600">
                  {scorecard.preparation.interviews_by_outcome.rejected}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Review Tab */}
      {activeTab === 'review' && (
        <form onSubmit={saveWeeklyReview} className="space-y-5 border border-slate-200 rounded-lg p-5 bg-white">
          {/* Header */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-orange-500 mb-1">Weekly Review Ritual</p>
            <h3 className="text-[16px] font-semibold text-slate-900">Four-part session operating loop</h3>
            <p className="text-[13px] text-slate-500 mt-1">
              Week of {workflow?.week_start ?? 'this week'} · Complete all four parts to save.
            </p>
          </div>

          {/* Part 1: Strategic Decision */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              <p className="text-[13px] font-bold text-blue-900">Strategic decision this session</p>
            </div>
            <p className="text-[12px] text-blue-700 leading-relaxed">
              What is the one strategic call the client needs to make - targeting, narrative, sequencing, or go/no-go?
            </p>
            <textarea
              value={sessionNotes.decisions}
              onChange={(event) => setSessionNotes((current) => ({ ...current, decisions: event.target.value }))}
              rows={3}
              className="w-full border border-blue-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 resize-none bg-white"
              placeholder="e.g. Decide whether to pursue the CFO role at Acme or hold for the PE-backed opportunity."
            />
          </div>

          {/* Part 2: Risk */}
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              <p className="text-[13px] font-bold text-red-900">Risk and blockers</p>
            </div>
            <p className="text-[12px] text-red-700 leading-relaxed">
              What could derail momentum this week - signals missed, confidence drop, narrative inconsistency, or pipeline stall?
            </p>
            <textarea
              value={sessionNotes.risks}
              onChange={(event) => setSessionNotes((current) => ({ ...current, risks: event.target.value }))}
              rows={3}
              className="w-full border border-red-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-red-400 resize-none bg-white"
              placeholder="e.g. Client has not responded to three tier-1 contacts - outreach rhythm is stalling."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">What changed in signals?</label>
                <textarea
                  value={weeklyAnswers.signals}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, signals: event.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none bg-white"
                  placeholder="New hires, funding, exits, board changes"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Which companies moved or stalled?</label>
                <textarea
                  value={weeklyAnswers.pipeline}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, pipeline: event.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none bg-white"
                  placeholder="Stage changes, blockers, interview progress"
                />
              </div>
            </div>
          </div>

          {/* Part 3: Narrative Shift */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              <p className="text-[13px] font-bold text-amber-900">Narrative adjustment</p>
            </div>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Did the client's story change this week? Did an objection reveal a gap in the current narrative?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Narrative change or rehearsal need</label>
                <textarea
                  value={weeklyAnswers.brief}
                  onChange={(event) => setWeeklyAnswers((current) => ({ ...current, brief: event.target.value }))}
                  rows={3}
                  className="w-full border border-amber-100 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-amber-400 resize-none bg-white"
                  placeholder="e.g. Client weakened on 'why now' - needs tighter inflection story."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Wins to reinforce</label>
                <textarea
                  value={sessionNotes.wins}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, wins: event.target.value }))}
                  rows={3}
                  className="w-full border border-amber-100 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-amber-400 resize-none bg-white"
                  placeholder="Moments of strong narrative delivery or target progress."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Freeform session notes</label>
              <textarea
                value={sessionNotes.freeform}
                onChange={(event) => setSessionNotes((current) => ({ ...current, freeform: event.target.value }))}
                rows={3}
                className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none bg-white"
                placeholder="Context, observations, themes to track."
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">4</span>
              <p className="text-[13px] font-bold text-slate-900">State signals</p>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Record the client&apos;s current confidence, momentum, and any explicit narrative drift worth surfacing next session.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="weekly-state-confidence" className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Confidence level</label>
                <select
                  id="weekly-state-confidence"
                  value={weeklyStateSignals.confidenceLevel}
                  onChange={(event) => setWeeklyStateSignals((current) => ({ ...current, confidenceLevel: event.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-slate-400"
                >
                  <option value="low">Low</option>
                  <option value="steady">Steady</option>
                  <option value="strong">Strong</option>
                </select>
              </div>
              <div>
                <label htmlFor="weekly-state-momentum" className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Momentum level</label>
                <select
                  id="weekly-state-momentum"
                  value={weeklyStateSignals.momentumLevel}
                  onChange={(event) => setWeeklyStateSignals((current) => ({ ...current, momentumLevel: event.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-slate-400"
                >
                  <option value="slowing">Slowing</option>
                  <option value="building">Building</option>
                  <option value="accelerating">Accelerating</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Narrative drift note</label>
              <textarea
                value={weeklyStateSignals.narrativeDrift}
                onChange={(event) => setWeeklyStateSignals((current) => ({ ...current, narrativeDrift: event.target.value }))}
                rows={3}
                className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none bg-white"
                placeholder="e.g. Story is leaning too operational; needs a sharper strategic arc."
              />
            </div>
          </div>

          {/* Part 4: Next Action */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">5</span>
              <p className="text-[13px] font-bold text-emerald-900">Committed next action</p>
            </div>
            <p className="text-[12px] text-emerald-700 leading-relaxed">
              One non-negotiable action with a named owner and a hard deadline. Review cannot be saved without this.
            </p>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">What is the one action before next session?</label>
              <textarea
                value={weeklyAnswers.nextStep}
                onChange={(event) => setWeeklyAnswers((current) => ({ ...current, nextStep: event.target.value }))}
                rows={2}
                className="w-full border border-emerald-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-400 resize-none bg-white"
                placeholder="e.g. Send follow-up to three tier-1 contacts by Thursday."
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-3">Session note capture</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Wins</label>
                <textarea
                  value={sessionNotes.wins}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, wins: event.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="What improved this week"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Risks</label>
                <textarea
                  value={sessionNotes.risks}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, risks: event.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="What is at risk"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Decisions</label>
                <textarea
                  value={sessionNotes.decisions}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, decisions: event.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="Decisions made in session"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Freeform notes</label>
                <textarea
                  value={sessionNotes.freeform}
                  onChange={(event) => setSessionNotes((current) => ({ ...current, freeform: event.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="Context and narrative from the session"
                />
              </div>
            </div>
            {/* Owner, due date, status inside Part 4 */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {actionIsOverdue && <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">Overdue</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Action (system field)</label>
                <input
                  aria-label="Weekly review next action"
                  value={actionDraft.action}
                  onChange={(event) => setActionDraft((current) => ({ ...current, action: event.target.value }))}
                  placeholder="Confirm interview prep session"
                  className="w-full border border-emerald-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Owner</label>
                <input
                  aria-label="Weekly review next action owner"
                  value={actionDraft.owner}
                  onChange={(event) => setActionDraft((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Client or coach"
                  className="w-full border border-emerald-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Deadline</label>
                <input
                  aria-label="Weekly review next action due date"
                  value={actionDraft.dueDate}
                  onChange={(event) => setActionDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  className="w-full border border-emerald-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            <div className="max-w-[220px]">
              <label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-1">Status</label>
              <select
                aria-label="Weekly review next action status"
                value={actionDraft.status}
                onChange={(event) => setActionDraft((current) => ({ ...current, status: event.target.value }))}
                className="w-full border border-emerald-200 rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-emerald-400"
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingReview || !actionDraft.action.trim() || !actionDraft.owner.trim() || !actionDraft.dueDate.trim()}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-[13px] font-semibold px-4 py-2 rounded transition-colors cursor-pointer border-0"
            >
              {savingReview ? 'Saving review...' : 'Save weekly review'}
            </button>
            <button
              type="button"
              onClick={extractActionsFromSession}
              disabled={extractingActions}
              className="bg-white hover:bg-slate-50 text-[13px] font-semibold px-4 py-2 rounded border border-slate-200 text-slate-700 disabled:opacity-40"
            >
              {extractingActions ? 'Extracting...' : 'Extract actions from notes'}
            </button>
          </div>

          {reviewMessage && (
            <p className={`text-[12px] ${reviewMessage.includes('saved') ? 'text-green-700' : 'text-red-600'}`}>{reviewMessage}</p>
          )}

          {recentReviews.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-3">Recent reviews</p>
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <div key={review.id} className="border border-slate-200 rounded p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[12px] font-semibold text-slate-900">Week of {review.week_start}</p>
                      <span className="text-[11px] text-slate-500">{review.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] text-slate-600">
                      <p><span className="font-semibold text-slate-700">Signals:</span> {review.review_answers.signals ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Pipeline:</span> {review.review_answers.pipeline ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Brief:</span> {review.review_answers.brief ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Next step:</span> {review.review_answers.nextStep ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Confidence:</span> {review.review_answers.confidence_level ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Momentum:</span> {review.review_answers.momentum_level ?? '\u2014'}</p>
                      <p className="md:col-span-2"><span className="font-semibold text-slate-700">Narrative drift:</span> {review.review_answers.narrative_drift ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Agenda:</span> {review.review_answers.agenda_template ?? '\u2014'}</p>
                      <p><span className="font-semibold text-slate-700">Session notes:</span> {review.review_answers.session_notes?.freeform ?? '\u2014'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Weekly Trends Tab */}
      {activeTab === 'trends' && (
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Weekly Progress Markers</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-[11px] font-semibold text-slate-600 px-4 py-2">Week</th>
                  <th className="text-right text-[11px] font-semibold text-slate-600 px-4 py-2">Signals</th>
                  <th className="text-right text-[11px] font-semibold text-slate-600 px-4 py-2">Briefs</th>
                  <th className="text-right text-[11px] font-semibold text-slate-600 px-4 py-2">Interviews</th>
                </tr>
              </thead>
              <tbody>
                {scorecard.weekly_trends.map((week) => (
                  <tr key={week.week_start} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-[12px] text-slate-700">Week of {week.week_start}</td>
                    <td className="px-4 py-2 text-[12px] text-right font-semibold text-slate-900 tabular-nums">{week.signals}</td>
                    <td className="px-4 py-2 text-[12px] text-right font-semibold text-slate-900 tabular-nums">{week.briefs}</td>
                    <td className="px-4 py-2 text-[12px] text-right font-semibold text-slate-900 tabular-nums">{week.interviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((company) => (
              <div key={company.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                <h4 className="font-semibold text-slate-900">{company.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-slate-600 capitalize">{company.stage}</span>
                  <span className="text-sm font-bold text-orange-600">{company.fit_score}%</span>
                </div>
                {company.notes && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{company.notes}</p>
                )}
              </div>
            ))}
          </div>
          {companies.length === 0 && (
            <div className="text-center text-slate-500 p-8">No companies in pipeline</div>
          )}
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          {signals.slice(0, 20).map((signal) => (
            <div key={signal.id} className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-900">
                  {(signal.companies?.name ?? 'Company')} · {signal.signal_type.replace('_', ' ')}
                </h4>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded capitalize">
                  {signal.signal_type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{signal.signal_summary}</p>
              <p className="text-xs text-slate-500">
                {new Date(signal.signal_date).toLocaleDateString()}
              </p>
              {signal.source_url && (
                <a
                  href={signal.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  Open source
                </a>
              )}
            </div>
          ))}
          {signals.length === 0 && (
            <div className="text-center text-slate-500 p-8">No signals detected</div>
          )}
        </div>
      )}

      {/* Briefs Tab */}
      {activeTab === 'briefs' && (
        <div className="space-y-4">
          {briefs.slice(0, 20).map((brief) => (
            <div key={brief.id} className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {(brief.companies?.name ?? 'General')} · {brief.type}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-3">{brief.output_text}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-full ${brief.lifecycle_state === 'used' ? 'bg-green-50 text-green-700' : brief.lifecycle_state === 'reviewed' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {brief.lifecycle_state ?? 'generated'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { void updateBriefLifecycle(brief.id, 'reviewed') }}
                      disabled={updatingBriefId === brief.id || brief.lifecycle_state === 'reviewed' || brief.lifecycle_state === 'used'}
                      className="text-[11px] font-semibold text-slate-700 border border-slate-200 rounded px-2.5 py-1 hover:border-slate-400 disabled:opacity-40"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => { void updateBriefLifecycle(brief.id, 'used') }}
                      disabled={updatingBriefId === brief.id || brief.lifecycle_state === 'used'}
                      className="text-[11px] font-semibold text-white bg-slate-900 border border-slate-900 rounded px-2.5 py-1 hover:bg-slate-700 disabled:opacity-40"
                    >
                      Use
                    </button>
                  </div>
                </div>
              </div>
              {brief.user_rating !== null && brief.user_rating !== undefined && (
                <p className="text-xs text-slate-500 mt-2">Rating: {brief.user_rating > 0 ? 'positive' : 'negative'}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {brief.reviewed_at ? `Reviewed ${new Date(brief.reviewed_at).toLocaleDateString()}` : 'Not reviewed yet'}
                {brief.used_at ? ` · Used ${new Date(brief.used_at).toLocaleDateString()}` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-3">
                {new Date(brief.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {briefs.length === 0 && (
            <div className="text-center text-slate-500 p-8">No briefs created</div>
          )}
        </div>
      )}
    </div>
  )
}
