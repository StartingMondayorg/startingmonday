'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Card } from '@/components/ui'
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
    return <div className="p-6 text-center text-muted-foreground">Loading coach access settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Coach Access Management</h2>
        <p className="text-sm text-muted-foreground">
          Control which coaches can view and edit your account data. Coaches can see your
          pipeline, signals, and briefs during active partnerships.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {coaches.length === 0 ? (
        <Card className="p-8 text-center bg-muted">
          <p className="text-muted-foreground">No coaches have been invited yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Coaches will appear here when you invite them to preview your account.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {coaches.map((coach) => (
            <div key={coach.coach_id} className="space-y-2">
            <Card
              className="p-4 flex-row items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground">{coach.coach_name || coach.member_email}</p>
                {coach.coach_name && (
                  <p className="text-[12px] text-muted-foreground">{coach.member_email}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    Access:{' '}
                    <span
                      className={
                        coach.coach_access_enabled
                          ? 'font-medium text-success'
                          : 'font-medium text-muted-foreground'
                      }
                    >
                      {coach.coach_access_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </span>
                  {coach.access_level && (
                    <span>
                      Level:{' '}
                      <span className="font-medium text-foreground">
                        {coach.access_level === 'read_only' ? 'Read-Only' : 'Read & Edit'}
                      </span>
                    </span>
                  )}
                  {coach.last_accessed_at && (
                    <span>
                      Last accessed:{' '}
                      <span className="font-medium text-foreground">
                        {formatDateTime(coach.last_accessed_at)}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => loadActivity(coach.coach_id)}
                  disabled={loadingActivityFor === coach.coach_id}
                  variant="secondary"
                  size="sm"
                >
                  {loadingActivityFor === coach.coach_id ? 'Loading...' : 'View Activity'}
                </Button>
                <Button
                  onClick={() => toggleCoachAccess(coach.coach_id, !coach.coach_access_enabled)}
                  disabled={updating === coach.coach_id}
                  variant={coach.coach_access_enabled ? 'outline' : 'secondary'}
                  size="sm"
                  className={
                    coach.coach_access_enabled
                      ? 'border-primary/30 bg-primary/10 text-primary-foreground hover:bg-primary'
                      : undefined
                  }
                >
                  {coach.coach_access_enabled ? 'Disable' : 'Enable'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        disabled={updating === coach.coach_id}
                        variant="destructive"
                        size="sm"
                      >
                        Revoke
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke coach access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {(coach.coach_name || coach.member_email)} will immediately lose access to your pipeline, signals, briefs, and interview outcomes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revokeCoachAccess(coach.coach_id)}>
                        Revoke access
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>

            {activityByCoach[coach.coach_id] && (
              <Card className="mt-2 bg-muted p-3">
                <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">
                  Recent Coach Activity
                </p>
                {activityByCoach[coach.coach_id].length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No activity logged yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activityByCoach[coach.coach_id].map((item) => (
                      <p key={item.id} className="text-[12px] text-muted-foreground">
                        {formatDateTime(item.created_at)}: {item.action} {item.table_name.replace('_', ' ')}
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            )}
            </div>
          ))}
        </div>
      )}

      <Alert variant="info">
        <AlertDescription>
          <strong>Note:</strong> When you enable coach access, your coach can view your pipeline,
          signals, briefs, and interview outcomes. They can see when you take actions and track
          your progress. All coach activity is logged for your reference.
        </AlertDescription>
      </Alert>
    </div>
  )
}
