'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOutreachStatus } from '@/app/(dashboard)/dashboard/contacts/actions'

export const STATUS_STEPS = [
  { value: 'prospect',          label: 'Prospect' },
  { value: 'reached_out',       label: 'Reached Out' },
  { value: 'in_conversation',   label: 'In Conversation' },
  { value: 'meeting_scheduled', label: 'Meeting Set' },
  { value: 'closed',            label: 'Closed' },
]

export const STATUS_CLS: Record<string, string> = {
  prospect:          'bg-slate-100 text-slate-500',
  reached_out:       'bg-blue-50 text-blue-600',
  in_conversation:   'bg-amber-50 text-amber-700',
  meeting_scheduled: 'bg-green-50 text-green-700',
  closed:            'bg-slate-100 text-slate-400',
}

export function ContactStatusStepper({
  contactId,
  currentStatus,
}: {
  contactId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const currentIdx = STATUS_STEPS.findIndex(s => s.value === currentStatus)

  function handleStep(value: string) {
    if (value === currentStatus || pending) return
    startTransition(async () => {
      await updateOutreachStatus(contactId, value)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUS_STEPS.map((step, i) => {
        const isActive = step.value === currentStatus
        const isPast = i < currentIdx
        return (
          <button
            key={step.value}
            type="button"
            onClick={() => handleStep(step.value)}
            disabled={pending}
            className={[
              'text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer border-0 disabled:opacity-50',
              isActive
                ? 'bg-slate-900 text-white'
                : isPast
                  ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100',
            ].join(' ')}
          >
            {step.label}
          </button>
        )
      })}
    </div>
  )
}
