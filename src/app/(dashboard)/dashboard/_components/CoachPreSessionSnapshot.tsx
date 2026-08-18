'use client'

/**
 * CoachPreSessionSnapshot
 *
 * Sprint ITS-2 deliverable.
 * First-class pre-session preparation artifact for coaches.
 * Shows exactly what changed since last session, what is stalled,
 * what the top decision is today, and what actions are overdue.
 *
 * AC: Coach can prep for a session from one screen in under two minutes.
 */

interface StalledLane {
  lane: 'signals' | 'pipeline' | 'preparation'
  state: 'healthy' | 'watch' | 'stalled'
  reason: string
}

interface SessionPrepSnapshot {
  baseline_started_at: string | null
  baseline_label: string
  signals_since_last_session: number
  pipeline_changes_since_last_session: number
  brief_reviews_since_last_session: number
  interviews_since_last_session: number
  active_pipeline_count: number
  overdue_actions: number
  stalled_lanes: StalledLane[]
}

interface CoachPreSessionSnapshotProps {
  snapshot: SessionPrepSnapshot
  clientName?: string
  nextActionText?: string
  confidenceField?: string | null
  momentumField?: string | null
  narrativeDriftFlag?: string | null
}

const LANE_LABELS: Record<StalledLane['lane'], string> = {
  signals: 'Signal detection',
  pipeline: 'Pipeline activity',
  preparation: 'Interview preparation',
}

const STATE_COLORS: Record<StalledLane['state'], { dot: string; badge: string; text: string }> = {
  healthy: { dot: 'bg-emerald-400', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700' },
  watch:   { dot: 'bg-amber-400',   badge: 'bg-amber-50 border-amber-200 text-amber-700',       text: 'text-amber-700' },
  stalled: { dot: 'bg-red-400',     badge: 'bg-red-50 border-red-200 text-red-700',             text: 'text-red-700' },
}

function formatDaysAgo(isoDate: string | null): string {
  if (!isoDate) return 'first session'
  const then = new Date(isoDate)
  const now = new Date()
  const days = Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export function CoachPreSessionSnapshot({
  snapshot,
  clientName,
  nextActionText,
  confidenceField,
  momentumField,
  narrativeDriftFlag,
}: CoachPreSessionSnapshotProps) {
  const stalledCount = snapshot.stalled_lanes.filter((l) => l.state === 'stalled').length
  const watchCount = snapshot.stalled_lanes.filter((l) => l.state === 'watch').length
  const anyStalledOrWatch = stalledCount > 0 || watchCount > 0

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="rounded-xl border border-orange-200 bg-orange-50/40 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">
              Pre-Session Snapshot
            </p>
            <h2 className="text-[17px] font-bold text-slate-900 leading-tight">
              {clientName ? `What changed for ${clientName}` : 'What changed since last session'}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Baseline: {formatDaysAgo(snapshot.baseline_started_at)}
          </span>
        </div>
      </div>

      {/* Change summary - 4 numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New signals', value: snapshot.signals_since_last_session, warn: snapshot.signals_since_last_session === 0 },
          { label: 'Pipeline moves', value: snapshot.pipeline_changes_since_last_session, warn: snapshot.pipeline_changes_since_last_session === 0 },
          { label: 'Briefs reviewed', value: snapshot.brief_reviews_since_last_session, warn: false },
          { label: 'Interviews', value: snapshot.interviews_since_last_session, warn: false },
        ].map(({ label, value, warn }) => (
          <div
            key={label}
            className={`rounded-lg border p-4 text-center ${
              warn ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'
            }`}
          >
            <p className={`text-[24px] font-bold ${warn ? 'text-amber-600' : 'text-slate-900'}`}>
              {value}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lane health */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-[12px] font-semibold text-slate-700 mb-3">Activity lane health</h3>
        <div className="space-y-2">
          {snapshot.stalled_lanes.map((lane) => {
            const colors = STATE_COLORS[lane.state]
            return (
              <div
                key={lane.lane}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${colors.badge}`}
              >
                <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold ${colors.text}`}>
                    {LANE_LABELS[lane.lane]}
                  </p>
                  <p className="text-[12px] mt-0.5 text-slate-600 leading-relaxed">
                    {lane.reason}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Overdue actions */}
      {snapshot.overdue_actions > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/30 px-5 py-4">
          <p className="text-[12px] font-semibold text-red-700 mb-1">
            {snapshot.overdue_actions} overdue action{snapshot.overdue_actions !== 1 ? 's' : ''}
          </p>
          <p className="text-[12px] text-slate-600">
            Review with client at the start of session and confirm or reset commitment.
          </p>
        </div>
      )}

      {/* Confidence, momentum, narrative drift - Sprint ITS-2 fields */}
      {(confidenceField || momentumField || narrativeDriftFlag) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-[12px] font-semibold text-slate-700 mb-3">State signals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {confidenceField && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Confidence</p>
                <p className="text-[14px] font-semibold text-slate-800">{confidenceField}</p>
              </div>
            )}
            {momentumField && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Momentum</p>
                <p className="text-[14px] font-semibold text-slate-800">{momentumField}</p>
              </div>
            )}
            {narrativeDriftFlag && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Narrative drift</p>
                <p className="text-[14px] font-semibold text-amber-800">{narrativeDriftFlag}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended session opening */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <h3 className="text-[12px] font-semibold text-slate-700 mb-2">Recommended session opening</h3>
        <ul className="space-y-1.5 text-[13px] text-slate-600 list-none">
          {anyStalledOrWatch && (
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">→</span>
              Open with: "I noticed {stalledCount > 0 ? 'some stalled activity' : 'a few areas to watch'}-let me share what I see before we jump in."
            </li>
          )}
          {snapshot.overdue_actions > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">→</span>
              Address overdue {snapshot.overdue_actions === 1 ? 'action' : 'actions'} early: "What happened with [action]? Do we reset or close it?"
            </li>
          )}
          {nextActionText && (
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">→</span>
              Last committed action: <span className="italic">"{nextActionText}"</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-slate-400 mt-0.5">→</span>
            Today's goal: one strategic decision, one narrative adjustment, one confirmed next action with a deadline.
          </li>
        </ul>
      </div>

      {/* Active pipeline reminder */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px]">
        <span className="text-slate-500">Active pipeline companies</span>
        <span className="font-bold text-slate-900">{snapshot.active_pipeline_count}</span>
      </div>
    </div>
  )
}
