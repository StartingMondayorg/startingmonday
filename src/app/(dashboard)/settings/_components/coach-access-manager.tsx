'use client'

import { useEffect, useState } from 'react'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface CoachAccess {
  id: string
  member_email: string
  coach_id: string
  coach_name?: string | null
  coach_access_enabled: boolean
  access_level: 'read_only' | 'read_write' | string
  access_granted_at: string | null
  last_accessed_at: string | null
}

interface CoachActivityItem {
  id: string
  table_name: string
  action: string
  created_at: string
}

export function ClientCoachAccessManager() {
  const [coaches, setCoaches] = useState<CoachAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [activityByCoach, setActivityByCoach] = useState<Record<string, CoachActivityItem[]>>({})
  const [loadingActivityFor, setLoadingActivityFor] = useState<string | null>(null)

  useEffect(() => {
    async function loadCoaches() {
      try {
        setLoading(true)
        const res = await fetch('/api/client/coaches')
        if (!res.ok) throw new Error('Failed to load coaches')
        const data = await res.json()
        setCoaches(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadCoaches()
  }, [])

  async function toggleCoachAccess(coachId: string, enabled: boolean) {
    try {
      setUpdating(coachId)
      const res = await fetch(`/api/client/coach-access/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_access_enabled: enabled }),
      })
      if (!res.ok) throw new Error('Failed to update access')

      setCoaches((prev) =>
        prev.map((coach) =>
          coach.coach_id === coachId
            ? { ...coach, coach_access_enabled: enabled }
            : coach
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdating(null)
    }
  }

  async function revokeCoachAccess(coachId: string) {
    try {
      setUpdating(coachId)
      const res = await fetch(`/api/client/coach-access/${coachId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to revoke access')

      setCoaches((prev) => prev.filter((coach) => coach.coach_id !== coachId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdating(null)
    }
  }

  async function loadActivity(coachId: string) {
    try {
      setLoadingActivityFor(coachId)
      const res = await fetch(`/api/client/coach-access/${coachId}/activity`)
      if (!res.ok) throw new Error('Failed to load activity')
      const json = await res.json()
      setActivityByCoach((prev) => ({ ...prev, [coachId]: json.data || [] }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingActivityFor(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-slate-600">Loading coach access settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Coach Access Management</h2>
        <p className="text-sm text-slate-600">
          Control which coaches can view and edit your account data. Coaches can see your
          pipeline, signals, and briefs during active partnerships.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {coaches.length === 0 ? (
        <div className="border border-slate-200 rounded-lg p-8 text-center bg-slate-50">
          <p className="text-slate-600">No coaches have been invited yet.</p>
          <p className="text-sm text-slate-500 mt-2">
            Coaches will appear here when you invite them to preview your account.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map((coach) => (
            <div key={coach.coach_id} className="space-y-2">
            <div
              className="border border-slate-200 rounded-lg p-4 bg-white flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{coach.coach_name || coach.member_email}</p>
                {coach.coach_name && (
                  <p className="text-[12px] text-slate-500">{coach.member_email}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  <span>
                    Access:{' '}
                    <span
                      className={
                        coach.coach_access_enabled
                          ? 'font-medium text-green-600'
                          : 'font-medium text-slate-400'
                      }
                    >
                      {coach.coach_access_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </span>
                  {coach.access_level && (
                    <span>
                      Level:{' '}
                      <span className="font-medium text-slate-900">
                        {coach.access_level === 'read_only' ? 'Read-Only' : 'Read & Edit'}
                      </span>
                    </span>
                  )}
                  {coach.last_accessed_at && (
                    <span>
                      Last accessed:{' '}
                      <span className="font-medium text-slate-900">
                        {formatDateTime(coach.last_accessed_at)}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadActivity(coach.coach_id)}
                  disabled={loadingActivityFor === coach.coach_id}
                  className="px-3 py-2 rounded text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {loadingActivityFor === coach.coach_id ? 'Loading...' : 'View Activity'}
                </button>
                <button
                  onClick={() => toggleCoachAccess(coach.coach_id, !coach.coach_access_enabled)}
                  disabled={updating === coach.coach_id}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    coach.coach_access_enabled
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50'
                  }`}
                >
                  {coach.coach_access_enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => revokeCoachAccess(coach.coach_id)}
                  disabled={updating === coach.coach_id}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
            </div>

            {activityByCoach[coach.coach_id] && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">
                  Recent Coach Activity
                </p>
                {activityByCoach[coach.coach_id].length === 0 ? (
                  <p className="text-[12px] text-slate-500">No activity logged yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activityByCoach[coach.coach_id].map((item) => (
                      <p key={item.id} className="text-[12px] text-slate-600">
                        {formatDateTime(item.created_at)}: {item.action} {item.table_name.replace('_', ' ')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> When you enable coach access, your coach can view your pipeline,
          signals, briefs, and interview outcomes. They can see when you take actions and track
          your progress. All coach activity is logged for your reference.
        </p>
      </div>
    </div>
  )
}
