'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { markFollowUpDone, updateFollowUp } from '@/app/(dashboard)/dashboard/actions'

interface Props {
  id: string
  action: string
  dueDate: string
  dateLabel: string
  isToday: boolean
  companyName?: string
}

export function FollowUpItem({ id, action, dueDate, dateLabel, isToday, companyName }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [donePending, startDone] = useTransition()
  const [savePending, startSave] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleDone() {
    setHidden(true)
    const fd = new FormData()
    fd.append('id', id)
    startDone(async () => {
      await markFollowUpDone(fd)
      router.refresh()
    })
  }

  function handleSave(fd: FormData) {
    startSave(async () => {
      await updateFollowUp(fd)
      setEditing(false)
      router.refresh()
    })
  }

  if (hidden) return null

  if (editing) {
    return (
      <div className="px-6 py-4">
        <form action={handleSave} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <input
            ref={inputRef}
            name="action"
            defaultValue={action}
            aria-label="Action text"
            className="w-full border border-white/20 rounded px-3 py-2 text-[14px] font-semibold text-slate-100 bg-slate-900 focus:outline-none focus:border-orange-300/60"
          />
          <div className="flex items-center gap-3">
            <input
              type="date"
              name="due_date"
              defaultValue={dueDate}
              aria-label="Due date"
              className="border border-white/20 rounded px-3 py-1.5 text-[13px] text-slate-100 bg-slate-900 focus:outline-none focus:border-orange-300/60"
            />
            {companyName && (
              <span className="text-[12px] text-slate-400">{companyName}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="submit"
                disabled={savePending}
                className="text-[12px] text-slate-950 bg-orange-500 rounded px-3 py-1.5 hover:bg-orange-400 cursor-pointer disabled:opacity-50"
              >
                {savePending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-[12px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <button
        type="button"
        onClick={startEdit}
        className="flex-1 min-w-0 text-left group cursor-pointer"
      >
        <div className="text-[14px] font-semibold text-slate-100 truncate group-hover:text-white">
          {action}
        </div>
        {companyName && (
          <div className="text-[12px] text-slate-400 mt-0.5">{companyName}</div>
        )}
      </button>

      <span className={`text-[12px] font-semibold shrink-0 ${isToday ? 'text-slate-400' : 'text-rose-300'}`}>
        {dateLabel}
      </span>

      <button
        type="button"
        onClick={handleDone}
        disabled={donePending}
        className="text-[12px] text-slate-400 border border-white/20 rounded px-3 py-1 hover:border-white/40 hover:text-slate-200 cursor-pointer bg-transparent disabled:opacity-50"
      >
        {donePending ? '…' : 'Done'}
      </button>
    </div>
  )
}
