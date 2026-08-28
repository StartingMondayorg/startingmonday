'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { FeedbackItem } from '@/lib/database.types'
import { Alert, AlertDescription, Badge, Button, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
type FeedbackStatus = 'new' | 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'declined'

const STATUS_BADGE_VARIANT: Record<FeedbackStatus, 'secondary' | 'info' | 'outline' | 'warning' | 'success' | 'destructive'> = {
  new: 'secondary',
  under_review: 'info',
  planned: 'outline',
  in_progress: 'warning',
  shipped: 'success',
  declined: 'destructive',
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  declined: 'Declined',
}

type StatusHistoryItem = {
  id: string
  old_status: string | null
  new_status: string
  changed_by: string
  change_note: string | null
  created_at: string
  user_profiles: { full_name: string } | null
}

export default function FeedbackDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<FeedbackItem | null>(null)
  const [history, setHistory] = useState<StatusHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<FeedbackStatus | ''>('')
  const [changeNote, setChangeNote] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`/api/feedback/items?search=${params.id}`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        const found = data.items.find((i: FeedbackItem) => i.id === params.id)
        if (found) {
          setItem(found)
          setNewStatus(found.status as FeedbackStatus)
          setStaffNotes(found.staff_notes || '')
        }
      }

      // Fetch status history
      const histRes = await fetch(`/api/feedback/items/${params.id}/status`)
      const histData = await histRes.json()
      if (histData.history) {
        setHistory(histData.history)
      }
    } catch (err) {
      console.error('Error fetching:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || !item || newStatus === item.status) {
      setUpdateError('Please select a different status')
      return
    }

    setIsUpdating(true)
    setUpdateError('')
    setUpdateSuccess(false)

    try {
      const res = await fetch(`/api/feedback/items/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          change_note: changeNote,
          staff_notes: staffNotes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      setUpdateSuccess(true)
      setChangeNote('')
      fetchFeedback()
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Feedback item not found</p>
          <Link href="/dashboard/admin/feedback" className="text-primary mt-4 inline-block">
            ← Back to Feedback
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard/admin/feedback" className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
            ← Feedback Admin
          </Link>
          <h1 className="text-[16px] font-bold text-foreground truncate">{item.title}</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
{/* Item Details */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-foreground mb-2">{item.title}</h2>
              <p className="text-[13px] text-muted-foreground mb-3">{item.body}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">
                  {item.category}
                </Badge>
                <Badge variant={STATUS_BADGE_VARIANT[item.status as FeedbackStatus]}>
                  {STATUS_LABELS[item.status as FeedbackStatus]}
                </Badge>
              </div>
            </div>
            <div className="text-right text-[12px] text-muted-foreground">
              <p><strong>Votes:</strong> {item.vote_count}</p>
              <p><strong>Comments:</strong> {item.comment_count}</p>
              <p className="mt-2"><strong>By:</strong> {item.user_profiles?.full_name || 'Unknown'}</p>
            </div>
          </div>

          <Card className="bg-muted border-border p-3 text-[12px] text-muted-foreground space-y-1">
            <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(item.updated_at).toLocaleString()}</p>
            {item.first_staff_response_at && (
              <p><strong>First Response:</strong> {new Date(item.first_staff_response_at).toLocaleString()}</p>
            )}
            {item.status_decided_at && (
              <p><strong>Decision Made:</strong> {new Date(item.status_decided_at).toLocaleString()}</p>
            )}
          </Card>
        </section>

        {/* Status Update Form */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-[16px] font-bold text-foreground">Update Status</h3>

          {updateError && (
            <Alert variant="destructive">
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}
          {updateSuccess && (
            <Alert variant="success">
              <AlertDescription>Status updated successfully</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="status-select" className="block text-[12px] font-semibold text-foreground mb-2">
                Status
              </Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FeedbackStatus)}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[12px] font-semibold text-foreground mb-2">
                Change Note (visible to user)
              </Label>
              <Textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="E.g., 'We're working on this bug and expect to ship in v2.1'"
                rows={2}
              />
            </div>

            <div>
              <Label className="block text-[12px] font-semibold text-foreground mb-2">
                Internal Staff Notes
              </Label>
              <Textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Internal notes about this item"
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || newStatus === item.status}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </section>

        {/* Status History */}
        {history.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-foreground">Status History</h3>
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={entry.id} className="border-l-2 border-primary/30 pl-4 pb-3">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">
                        {entry.old_status || 'Created'} → {entry.new_status}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        by {entry.user_profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                  {entry.change_note && (
                    <p className="text-[12px] text-muted-foreground italic">"{entry.change_note}"</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
