'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { markFollowUpDone, updateFollowUp } from '@/app/(dashboard)/dashboard/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
          <Input
            ref={inputRef}
            name="action"
            defaultValue={action}
            aria-label="Action text"
            className="border-white/20 bg-slate-900 text-[14px] font-semibold text-slate-100 focus-visible:border-orange-300/60"
          />
          <div className="flex items-center gap-3">
            <Input
              type="date"
              name="due_date"
              defaultValue={dueDate}
              aria-label="Due date"
              className="w-auto border-white/20 bg-slate-900 text-[13px] text-slate-100 focus-visible:border-orange-300/60"
            />
            {companyName && (
              <span className="text-[12px] text-slate-400">{companyName}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={savePending}
              >
                {savePending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDone}
        disabled={donePending}
        className="text-slate-400 border-white/20 hover:border-white/40 hover:text-slate-200 bg-transparent"
      >
        {donePending ? '…' : 'Done'}
      </Button>
    </div>
  )
}
