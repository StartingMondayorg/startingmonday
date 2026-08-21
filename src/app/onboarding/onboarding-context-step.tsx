'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui'
type ContextOption = {
  key: string
  label: string
  hint: string
}

type ContextCard = {
  id: string
  title: string
  status: string
  complete: boolean
}

const LOCATION_OPTIONS: ContextOption[] = [
  { key: 'new_york', label: 'New York', hint: 'In-person heavy opportunities' },
  { key: 'bay_area', label: 'Bay Area', hint: 'Platform and product-heavy roles' },
  { key: 'remote_us', label: 'Remote (US)', hint: 'Distributed leadership teams' },
  { key: 'london', label: 'London', hint: 'Global and EMEA scope' },
]

const SECTOR_OPTIONS: ContextOption[] = [
  { key: 'saas', label: 'B2B SaaS', hint: 'Revenue and GTM depth' },
  { key: 'ai_data', label: 'AI / Data', hint: 'Applied AI transformation' },
  { key: 'fintech', label: 'Fintech', hint: 'Regulated growth environments' },
  { key: 'healthcare', label: 'Healthcare', hint: 'Complex stakeholder ecosystems' },
]

const COMP_OPTIONS: ContextOption[] = [
  { key: 'base_bonus', label: 'Base + Bonus', hint: 'Predictable cash-heavy package' },
  { key: 'equity_weighted', label: 'Equity-weighted', hint: 'Upside with medium cash floor' },
  { key: 'balanced', label: 'Balanced', hint: 'Cash and upside in equal measure' },
]

const POSITIONING_OPTIONS: ContextOption[] = [
  { key: 'operator', label: 'Execution Operator', hint: 'Scale teams and delivery cadence' },
  { key: 'transformer', label: 'Transformation Lead', hint: 'Drive change across functions' },
  { key: 'builder', label: 'Builder', hint: 'Create new systems and foundations' },
  { key: 'stabilizer', label: 'Stabilizer', hint: 'Calm complexity and de-risk operations' },
]

const BRIEFING_OPTIONS: ContextOption[] = [
  { key: '06:00', label: '6:00 AM', hint: 'Early-market open' },
  { key: '07:00', label: '7:00 AM', hint: 'Default daily cadence' },
  { key: '08:00', label: '8:00 AM', hint: 'Pre-meeting planning' },
  { key: '09:00', label: '9:00 AM', hint: 'Start-of-day review' },
]

const OPTION_ITEM_BASE = 'flex-col h-auto items-start justify-start text-left rounded border px-4 py-3 whitespace-normal transition-colors cursor-pointer'
const OPTION_ITEM_ACTIVE = '!border-primary/70 !bg-primary/20 !text-foreground'
const OPTION_ITEM_INACTIVE = '!border-border !bg-muted/40 !text-foreground hover:!border-border'

function OptionGroup({
  title,
  options,
  selected,
  onToggle,
  multi,
}: {
  title: string
  options: ContextOption[]
  selected: string[]
  onToggle: (v: string[]) => void
  multi: boolean
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">{title}</p>
      <ToggleGroup
        value={selected}
        onValueChange={onToggle}
        multiple={multi}
        className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {options.map((opt) => {
          const active = selected.includes(opt.key)
          return (
            <ToggleGroupItem
              key={opt.key}
              value={opt.key}
              className={[OPTION_ITEM_BASE, active ? OPTION_ITEM_ACTIVE : OPTION_ITEM_INACTIVE].join(' ')}
            >
              <p className="text-[13px] font-semibold">{active ? '✓ ' : ''}{opt.label}</p>
              <p className={['text-[12px] mt-1', active ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{opt.hint}</p>
              {!multi && active && <p className="text-[10px] mt-1 text-primary uppercase tracking-[0.12em]">Selected</p>}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

export function OnboardingContextStep({
  targetLocations,
  sectors,
  compensation,
  positioning,
  briefingTime,
  onTargetLocations,
  onSectors,
  onCompensation,
  onPositioning,
  onBriefingTime,
}: {
  targetLocations: string[]
  sectors: string[]
  compensation: string[]
  positioning: string[]
  briefingTime: string
  onTargetLocations: (v: string[]) => void
  onSectors: (v: string[]) => void
  onCompensation: (v: string[]) => void
  onPositioning: (v: string[]) => void
  onBriefingTime: (v: string) => void
}) {
  const completedCount = [
    targetLocations.length > 0,
    sectors.length > 0,
    compensation.length > 0,
    positioning.length > 0,
    !!briefingTime,
  ].filter(Boolean).length

  const cards: ContextCard[] = [
    {
      id: 'target-locations',
      title: 'Target locations',
      status: targetLocations.length > 0 ? `${targetLocations.length} selected` : 'Not set',
      complete: targetLocations.length > 0,
    },
    {
      id: 'preferred-sectors',
      title: 'Preferred sectors',
      status: sectors.length > 0 ? `${sectors.length} selected` : 'Not set',
      complete: sectors.length > 0,
    },
    {
      id: 'compensation-preference',
      title: 'Comp preference',
      status: compensation.length > 0 ? 'Selected' : 'Not set',
      complete: compensation.length > 0,
    },
    {
      id: 'briefing-time',
      title: 'Briefing time',
      status: briefingTime ? `${briefingTime} configured` : 'Not set',
      complete: !!briefingTime,
    },
    {
      id: 'positioning-style',
      title: 'Positioning style',
      status: positioning.length > 0 ? 'Selected' : 'Not set',
      complete: positioning.length > 0,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Add optional search context.
        </h1>
        <p className="text-[15px] text-muted-foreground">
          This sharpens recommendations and prioritization. You can skip and refine later from the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {cards.map((card) => (
          <a
            key={card.id}
            href={`#${card.id}`}
            className={[
              'rounded border px-4 py-3 transition-colors',
              card.complete
                ? 'border-primary/70 bg-primary/20 text-foreground'
                : 'border-border bg-muted/40 text-foreground hover:border-border',
            ].join(' ')}
          >
            <p className="text-[12px] font-bold tracking-[0.08em] uppercase">{card.title}</p>
            <p className="text-[12px] mt-1 opacity-90">{card.complete ? `Complete - ${card.status}` : card.status}</p>
          </a>
        ))}
      </div>

      <section id="target-locations">
        <OptionGroup
          title="Target locations"
          options={LOCATION_OPTIONS}
          selected={targetLocations}
          onToggle={onTargetLocations}
          multi
        />
      </section>

      <section id="preferred-sectors">
        <OptionGroup
          title="Preferred sectors"
          options={SECTOR_OPTIONS}
          selected={sectors}
          onToggle={onSectors}
          multi
        />
      </section>

      <section id="compensation-preference">
        <OptionGroup
          title="Compensation preference"
          options={COMP_OPTIONS}
          selected={compensation}
          onToggle={onCompensation}
          multi={false}
        />
      </section>

      <section id="briefing-time" className="flex flex-col gap-2.5">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Briefing time</p>
        <ToggleGroup
          value={briefingTime ? [briefingTime] : []}
          onValueChange={(values) => {
            if (values[0]) onBriefingTime(values[0])
          }}
          className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {BRIEFING_OPTIONS.map((opt) => {
            const active = briefingTime === opt.key
            return (
              <ToggleGroupItem
                key={opt.key}
                value={opt.key}
                className={[
                  'flex-col h-auto items-start justify-start text-left rounded border px-3 py-3 whitespace-normal transition-colors cursor-pointer',
                  active ? OPTION_ITEM_ACTIVE : OPTION_ITEM_INACTIVE,
                ].join(' ')}
              >
                <p className="text-[13px] font-semibold">{opt.label}</p>
                <p className={['text-[11px] mt-1', active ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>{opt.hint}</p>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </section>

      <section id="positioning-style">
        <OptionGroup
          title="Positioning style"
          options={POSITIONING_OPTIONS}
          selected={positioning}
          onToggle={onPositioning}
          multi={false}
        />
      </section>

      <p className="text-[12px] text-muted-foreground">
        {completedCount}/5 context blocks selected. More context improves ranking precision but is optional.
      </p>
    </div>
  )
}
