import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui'
type DashboardDisclosureSectionProps = {
  id: string
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function DashboardDisclosureSection({
  id,
  title,
  defaultOpen = false,
  children,
}: DashboardDisclosureSectionProps) {
  const panelId = `${id}-panel`

  return (
    <Collapsible
      id={id}
      defaultOpen={defaultOpen}
      className="mb-8 rounded border border-border bg-card/70 overflow-hidden scroll-mt-24 shadow-lg"
    >
      <CollapsibleTrigger
        className="w-full cursor-pointer px-6 py-4 border-b border-border flex items-center justify-between"
        aria-controls={panelId}
      >
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">{title}</span>
        <span className="text-[11px] text-muted-foreground">Details</span>
      </CollapsibleTrigger>
      <CollapsibleContent id={panelId} className="px-6 py-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
