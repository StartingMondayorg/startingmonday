'use client'
import { Card, ToggleGroup, ToggleGroupItem } from '@/components/ui'

export function StepBriefingTime({
  value,
  onChange,
  emailNudgesOptIn,
  onEmailNudgesOptIn,
}: {
  value: string
  onChange: (v: string) => void
  emailNudgesOptIn: boolean
  onEmailNudgesOptIn: (v: boolean) => void
}) {
  const TIMES = [
    { label: '6:00 AM', value: '06:00' },
    { label: '6:30 AM', value: '06:30' },
    { label: '7:00 AM', value: '07:00' },
    { label: '7:30 AM', value: '07:30' },
    { label: '8:00 AM', value: '08:00' },
    { label: '8:30 AM', value: '08:30' },
    { label: '9:00 AM', value: '09:00' },
  ]

  const tz = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'your local time'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          When do you want your daily briefing?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Each morning: signals from your target companies, actions due, and your search momentum - assembled overnight.
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: consistent timing turns insight into action before opportunities cool off.
        </p>
      </div>

      <ToggleGroup
        value={value ? [value] : []}
        onValueChange={(values) => {
          if (values[0]) onChange(values[0])
        }}
        className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3"
      >
        {TIMES.map(t => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            className={[
              'h-auto border rounded-lg px-4 py-3.5 text-[15px] font-semibold transition-all cursor-pointer',
              value === t.value
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            {t.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <p className="text-[12px] text-muted-foreground">
        Delivered in {tz}. You can change this anytime from your profile.
      </p>

      <Card variant="glass" className="rounded-lg border-border bg-muted/40 p-4">
        <p className="text-[13px] font-semibold text-foreground mb-1">Trial tips by email - your choice</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          Your search is private. Beyond your daily briefing, we only send occasional trial tips if you say yes here.
          You can change this anytime in Settings.
        </p>
        <ToggleGroup
          value={[emailNudgesOptIn ? 'yes' : 'no']}
          onValueChange={(values) => {
            if (values[0]) onEmailNudgesOptIn(values[0] === 'yes')
          }}
          aria-label="Trial tip emails"
          className="flex w-full gap-2"
        >
          <ToggleGroupItem
            value="no"
            className={[
              'h-auto flex-1 border rounded-lg px-4 py-3 min-h-[44px] text-[13px] font-semibold transition-all cursor-pointer',
              !emailNudgesOptIn
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            No thanks - briefing only
          </ToggleGroupItem>
          <ToggleGroupItem
            value="yes"
            className={[
              'h-auto flex-1 border rounded-lg px-4 py-3 min-h-[44px] text-[13px] font-semibold transition-all cursor-pointer',
              emailNudgesOptIn
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            Yes, send trial tips
          </ToggleGroupItem>
        </ToggleGroup>
      </Card>
    </div>
  )
}