import type { ReactNode } from 'react'

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
    <details id={id} open={defaultOpen} suppressHydrationWarning className="mb-8 rounded border border-white/10 bg-slate-900/70 overflow-hidden scroll-mt-24 shadow-[0_14px_34px_rgba(2,6,23,0.35)]">
      <summary
        className="cursor-pointer list-none px-6 py-4 border-b border-white/10 flex items-center justify-between"
        aria-controls={panelId}
      >
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-300">{title}</span>
        <span className="text-[11px] text-slate-500">Details</span>
      </summary>
      <div id={panelId} className="px-6 py-6">
        {children}
      </div>
    </details>
  )
}
