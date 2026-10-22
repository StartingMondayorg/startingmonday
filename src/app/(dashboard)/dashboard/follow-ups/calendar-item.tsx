'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markFollowUpDone } from '@/app/(dashboard)/dashboard/actions'
import { stripStaleRelativeTime } from '@/lib/outreach/follow-up-copy'
import { Badge, Button } from '@/components/ui'
type Props = {
  id: string
  action: string
  dueDate: string
  googleEventUrl?: string | null
  today: string
  overdue: boolean
  label: string
}

export function CalendarItemClient({ id, action, dueDate, googleEventUrl, today, overdue, label }: Props) {
  const router = useRouter()
  const [hidden, setHidden] = useState(false)
  const [pending, startTransition] = useTransition()

  if (hidden) return null

  const isToday = dueDate === today
  const cleanAction = stripStaleRelativeTime(action)
  const dateLabel = isToday
    ? 'Today'
    : new Date(dueDate + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

  function handleDone() {
    setHidden(true)
    const fd = new FormData()
    fd.append('id', id)
    startTransition(async () => {
      await markFollowUpDone(fd)
      router.refresh()
    })
  }

  return (
    <div className="px-5 py-3.5 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground leading-tight">{cleanAction || action}</p>
        {label && <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>}
        {googleEventUrl && (
          <Button
            variant="link"
            className="h-auto p-0 text-[11px] text-primary mt-1"
            render={<a href={googleEventUrl} target="_blank" rel="noreferrer" />}
          >
            Add to Google Calendar
          </Button>
        )}
      </div>
      {overdue || isToday ? (
        <Badge variant="destructive" className="shrink-0 mt-0.5">{dateLabel}</Badge>
      ) : (
        <span className="shrink-0 text-[11px] font-semibold mt-0.5 text-muted-foreground">
          {dateLabel}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleDone}
        disabled={pending}
        className="shrink-0 text-[12px] text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground min-h-[32px]"
      >
        {pending ? '…' : 'Done'}
      </Button>
    </div>
  )
}
