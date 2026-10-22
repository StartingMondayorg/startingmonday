'use client'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui'

export type SearchPostureValue = 'active' | 'exploring' | 'not_looking'

const POSTURES: { value: SearchPostureValue; label: string; sub: string }[] = [
  { value: 'active', label: 'Actively searching', sub: 'Daily moves; we press on timing.' },
  { value: 'exploring', label: 'Building relationships', sub: 'Steady touches; no rush.' },
  { value: 'not_looking', label: 'Not looking yet', sub: 'Watch and stay ready.' },
]

// R-4 (2026-10-21): posture is the one onboarding answer that shapes Zone 1 from
// the first render, so it is asked of everyone, with the role lane, on screen one.
export function StepPosture({
  value,
  onChange,
}: {
  value: string
  onChange: (v: SearchPostureValue) => void
}) {
  return (
    <div className="mt-8">
      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
        Where are you right now?
      </p>
      <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
        This sets the tone of your daily recommendation, not what we watch.
      </p>
      <ToggleGroup
        value={value ? [value] : []}
        onValueChange={(values) => {
          const next = values[0]
          if (next === 'active' || next === 'exploring' || next === 'not_looking') onChange(next)
        }}
        aria-label="Search posture"
        className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {POSTURES.map((p) => (
          <ToggleGroupItem
            key={p.value}
            value={p.value}
            className={[
              'h-auto min-h-[44px] flex-col items-start rounded-lg border px-3 py-3 text-left whitespace-normal',
              value === p.value
                ? '!border-primary/70 !bg-primary/20 !text-foreground'
                : '!border-border !bg-muted/40 !text-foreground hover:!border-border',
            ].join(' ')}
          >
            <span className="text-[13px] font-semibold">{p.label}</span>
            <span className={['mt-0.5 text-[12px]', value === p.value ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{p.sub}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
