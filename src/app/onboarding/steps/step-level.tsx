'use client'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui'
import type { RoleFamily, RoleTitle } from '@/lib/role-taxonomy'
import type { SearchPersona } from '../onboarding-helpers'

export type RoleTrackOption = {
  value: RoleTitle
  roleFamily: RoleFamily
  persona: SearchPersona
  label: string
  sub: string
}

export const ROLE_TRACK_OPTIONS: RoleTrackOption[] = [
  { value: 'manager', roleFamily: 'leadership', persona: 'director', label: 'Manager', sub: 'Leadership track for first-line managers' },
  { value: 'senior_director', roleFamily: 'leadership', persona: 'director', label: 'Senior Director', sub: 'Leadership track for org-level scope' },
  { value: 'avp', roleFamily: 'leadership', persona: 'vp', label: 'AVP / VP', sub: 'Leadership track with broad business ownership' },
  { value: 'executive', roleFamily: 'leadership', persona: 'csuite', label: 'Executive', sub: 'C-suite and enterprise leadership path' },
  { value: 'principal', roleFamily: 'technical_leadership', persona: 'director', label: 'Principal', sub: 'Technical leadership without direct org management' },
  { value: 'architect', roleFamily: 'technical_leadership', persona: 'director', label: 'Architect', sub: 'Architecture and platform strategy path' },
  { value: 'technical_lead', roleFamily: 'technical_leadership', persona: 'director', label: 'Technical Lead', sub: 'Hands-on technical leadership track' },
  { value: 'program_manager', roleFamily: 'delivery_leadership', persona: 'director', label: 'Program Manager', sub: 'Cross-functional delivery leadership path' },
  { value: 'tpm', roleFamily: 'delivery_leadership', persona: 'director', label: 'Technical Program Manager', sub: 'Technical delivery and execution path' },
  { value: 'project_manager', roleFamily: 'delivery_leadership', persona: 'director', label: 'Project Manager', sub: 'Execution-focused delivery leadership path' },
]

export function StepLevel({
  roleTitles,
  onToggle,
}: {
  roleTitles: RoleTitle[]
  onToggle: (v: RoleTrackOption) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          Which role lanes are you targeting?
        </h1>
        <p className="text-[15px] text-muted-foreground">
          Choose every lane you want us to watch. Your first pick leads the workflow.
        </p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Why this matters: we use these lanes to surface the earliest opportunities that match your next move.
        </p>
      </div>
      <ToggleGroup
        multiple
        value={roleTitles}
        onValueChange={(values) => {
          const optAdded = ROLE_TRACK_OPTIONS.find(o => values.includes(o.value) && !roleTitles.includes(o.value))
          const optRemoved = ROLE_TRACK_OPTIONS.find(o => !values.includes(o.value) && roleTitles.includes(o.value))
          const changed = optAdded ?? optRemoved
          if (changed) onToggle(changed)
        }}
        className="grid w-full grid-cols-2 gap-3"
      >
        {ROLE_TRACK_OPTIONS.map(opt => {
          const selected = roleTitles.includes(opt.value)
          const isPrimary = roleTitles[0] === opt.value
          return (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className={[
                'h-auto text-left border rounded-lg px-5 py-4 flex items-center justify-between transition-all cursor-pointer',
                selected
                  ? '!border-primary/70 !bg-primary/20 !text-foreground'
                  : '!border-border !bg-muted/40 hover:!border-border',
              ].join(' ')}
            >
              <div>
                <div className="text-[15px] font-semibold text-foreground">
                  {opt.label}
                  {isPrimary && roleTitles.length > 1 && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Primary</span>
                  )}
                </div>
                <div className={['text-[13px] mt-0.5', selected ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>
                  {opt.sub}
                </div>
              </div>
              {selected && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 ml-4">
                  <circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.2" />
                  <path d="M5 9l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}