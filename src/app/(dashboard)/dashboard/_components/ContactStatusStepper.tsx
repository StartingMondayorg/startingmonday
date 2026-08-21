'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOutreachStatus } from '@/app/(dashboard)/dashboard/contacts/actions'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui'
export const STATUS_STEPS = [
  { value: 'prospect',          label: 'Prospect' },
  { value: 'reached_out',       label: 'Reached Out' },
  { value: 'in_conversation',   label: 'In Conversation' },
  { value: 'meeting_scheduled', label: 'Meeting Set' },
  { value: 'closed',            label: 'Closed' },
]

export const STATUS_CLS: Record<string, string> = {
  prospect:          'bg-muted text-muted-foreground',
  reached_out:       'bg-info/10 text-info',
  in_conversation:   'bg-warning/10 text-warning',
  meeting_scheduled: 'bg-success/10 text-success',
  closed:            'bg-muted text-muted-foreground',
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
    <ToggleGroup
      value={[currentStatus]}
      onValueChange={(values) => {
        const next = values.find((value) => value !== currentStatus)
        if (next) handleStep(next)
      }}
      className="flex-wrap gap-1.5"
    >
      {STATUS_STEPS.map((step, i) => {
        const isActive = step.value === currentStatus
        const isPast = i < currentIdx
        return (
          <ToggleGroupItem
            key={step.value}
            value={step.value}
            disabled={pending}
            className={[
              'text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50',
              // three states, as before: current, already passed, still ahead
              isActive
                ? 'bg-primary aria-pressed:bg-primary text-primary-foreground hover:bg-primary/90'
                : isPast
                  ? 'bg-secondary aria-pressed:bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-muted text-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            {step.label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
