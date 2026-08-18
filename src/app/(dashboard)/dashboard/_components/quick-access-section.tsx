import Link from 'next/link'
import { TrackLink } from '@/components/TrackLink'

type DashboardQuickAccessSectionProps = {
  isExecutiveMode: boolean
  executiveStageLabel: string
  isCoach: boolean
}

export function DashboardQuickAccessSection({
  isExecutiveMode,
  executiveStageLabel,
  isCoach,
}: DashboardQuickAccessSectionProps) {
  const indexLinks = isExecutiveMode
    ? (
      executiveStageLabel === 'Offer and Decision'
        ? [
            { href: '/dashboard/offers', label: 'Offer Tradeoffs' },
            { href: '/dashboard/strategy', label: 'No-go Criteria' },
            { href: '/dashboard/contacts', label: 'Reference Push' },
            { href: '/dashboard/calendar', label: 'Decision Timeline' },
            { href: '/dashboard/briefing', label: 'Risk Review' },
            { href: '/dashboard/wrap-up', label: 'Transition Plan' },
          ]
        : executiveStageLabel === 'Interviewing and Conversion'
          ? [
              { href: '/dashboard/strategy', label: 'Prep Brief' },
              { href: '/dashboard/signals', label: 'Signal Angle' },
              { href: '/dashboard/contacts', label: 'Warm Intros' },
              { href: '/dashboard/calendar', label: 'Follow-up SLA' },
              { href: '/dashboard/briefing', label: 'Daily Priorities' },
              { href: '/dashboard/positioning', label: 'Narrative Tighten' },
            ]
          : [
              { href: '/dashboard/briefing', label: 'Daily Briefing' },
              { href: '/dashboard/companies/new', label: 'Add Target' },
              { href: '/dashboard/contacts', label: 'Build Sponsor Map' },
              { href: '/dashboard/signals', label: 'Signals' },
              { href: '/dashboard/strategy', label: 'Strategy Brief' },
              { href: '/dashboard/profile', label: 'Profile Inputs' },
            ]
    )
    : [
        { href: '/dashboard/briefing', label: 'Daily Briefing' },
        { href: '/dashboard/strategy', label: 'Strategy Brief' },
        { href: '/dashboard/discover', label: 'Discover' },
        { href: '/dashboard/calendar', label: 'Calendar' },
        { href: '/optimize', label: 'LinkedIn' },
        { href: '/dashboard/positioning', label: 'Positioning' },
        { href: '/dashboard/profile', label: 'Configure Search' },
        ...(isCoach ? [{ href: '/dashboard/coach', label: 'My Clients' }] : []),
      ]

  return (
    <section id="quick-access" className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
      <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Index</h2>
      <div className="flex flex-wrap gap-2">
        {indexLinks.map((v) => (
          <TrackLink
            key={`${v.href}-${v.label}`}
            href={v.href}
            event="power_view_clicked"
            properties={{ target: v.label.toLowerCase().replace(/\s+/g, '_') }}
            className="text-[12px] text-slate-200 border border-white/20 rounded px-2.5 py-1.5 hover:border-white/40 transition-colors"
          >
            {v.label}
          </TrackLink>
        ))}
      </div>
    </section>
  )
}
