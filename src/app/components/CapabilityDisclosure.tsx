import type { ReactNode } from 'react'

/**
 * CapabilityDisclosure
 *
 * Renders a clear visual separation between features that are live today
 * and features that are on the product roadmap. Used wherever copy
 * previously mixed present and future capability claims.
 *
 * Usage:
 * <CapabilityDisclosure
 *   live={['Pipeline tracking', 'Prep briefs', 'Signal alerts']}
 *   roadmap={[
 *     { label: 'Salesforce sync', eta: 'Q3 2026' },
 *     { label: 'HubSpot integration', eta: 'Q3 2026' },
 *     { label: 'API access for custom workflows', eta: 'Enterprise, Q4 2026' },
 *   ]}
 * />
 */

interface RoadmapItem {
  label: string
  eta?: string
}

interface CapabilityDisclosureProps {
  live: string[]
  roadmap: RoadmapItem[]
  className?: string
}

export function CapabilityDisclosure({ live, roadmap, className = '' }: CapabilityDisclosureProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-600 mb-3">
            Live today
          </p>
          <ul className="space-y-2">
            {live.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-slate-700">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 bg-slate-50">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-600 mb-3">
            On the roadmap
          </p>
          <ul className="space-y-2">
            {roadmap.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-[13px] text-slate-600">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden="true">◷</span>
                <span>
                  {item.label}
                  {item.eta && (
                    <span className="ml-1 text-[11px] text-slate-400">({item.eta})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
