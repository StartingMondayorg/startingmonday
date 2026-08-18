'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markFollowUpDone } from '@/app/(dashboard)/dashboard/actions'
import { stripStaleRelativeTime } from '@/lib/outreach/follow-up-copy'

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
        <p className="text-[14px] font-semibold text-white leading-tight">{cleanAction || action}</p>
        {label && <p className="text-[12px] text-slate-400 mt-0.5">{label}</p>}
        {googleEventUrl && (
          <a
            href={googleEventUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[11px] text-orange-200 hover:text-orange-100 underline mt-1"
          >
            Add to Google Calendar
          </a>
        )}
      </div>
      <span className={`shrink-0 text-[11px] font-semibold mt-0.5 ${overdue || isToday ? 'text-rose-200' : 'text-slate-400'}`}>
        {dateLabel}
      </span>
      <button
        type="button"
        onClick={handleDone}
        disabled={pending}
        className="shrink-0 text-[12px] text-slate-200 border border-white/15 rounded px-3 py-1 hover:border-white/30 hover:bg-white/10 hover:text-white cursor-pointer bg-transparent disabled:opacity-50 min-h-[32px]"
      >
        {pending ? '…' : 'Done'}
      </button>
    </div>
  )
}
