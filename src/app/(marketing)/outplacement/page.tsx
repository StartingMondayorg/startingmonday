import type { Metadata } from 'next'
import { TrackLink } from '@/app/components/TrackLink'
import { ChannelMicroProductRail } from '@/app/components/ChannelMicroProductRail'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'

export const metadata: Metadata = {
  title: 'Outplacement Channel | Starting Monday',
  description:
    'For outplacement providers improving cohort momentum, interview readiness, and measurable placement outcomes with less counselor admin load.',
  alternates: {
    canonical: 'https://startingmonday.app/outplacement',
  },
  openGraph: {
    title: 'Outplacement Channel | Starting Monday',
    description:
      'Outcome-focused operating layer for outplacement cohorts with board-safe KPI and trust framing.',
    url: 'https://startingmonday.app/outplacement',
  },
}

export default function OutplacementChannelPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-4">Outplacement channel</p>
        <h1 className="text-[34px] sm:text-[44px] font-bold leading-[1.05] tracking-tight mb-4">
          Improve cohort momentum with measurable execution.
        </h1>
        <p className="text-[16px] text-foreground leading-relaxed max-w-3xl mb-7">
          Starting Monday gives outplacement programs a practical operating layer for signals, prep, accountability, and day-30 decision quality without custom rollout complexity.
        </p>

        <div className="rounded-lg border border-success/70 bg-success/36 p-4 mb-8 shadow-lg">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-success mb-1">Trust and procurement readiness</p>
          <p className="text-[13px] text-success leading-relaxed">
            Board-safe claims, KPI definitions for day 30, 60, and 90, and explicit role boundaries for counselors and program operators.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <TrackLink
            href="/outplacement/personas"
            event={EVENT_NAMES.personaRouteSelected}
            logToUserEvents
            properties={{ channel: 'outplacement', persona: 'persona_hub', source_route: '/outplacement', target_route: '/outplacement/personas' }}
            className="inline-block bg-muted text-foreground text-[14px] font-semibold px-5 py-3 rounded hover:bg-primary transition-colors"
          >
            Explore buyer roles
          </TrackLink>
          <TrackLink
            href="/for-outplacement"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'outplacement', cta_label: 'Open outplacement journey', source_page: '/outplacement' }}
            className="inline-block bg-primary text-primary-foreground text-[14px] font-semibold px-5 py-3 rounded hover:bg-primary/90 transition-colors"
          >
            Open outplacement journey
          </TrackLink>
          <TrackLink
            href="/for-outplacement/trust-pack"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'outplacement', cta_label: 'Review trust pack', source_page: '/outplacement' }}
            className="inline-block border border-border text-foreground text-[14px] font-semibold px-5 py-3 rounded transition-colors"
          >
            Review trust pack
          </TrackLink>
        </div>

        <ChannelMicroProductRail channel="outplacement" sourceRoute="/outplacement" />

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded border border-border bg-muted/[0.08] p-4 shadow-lg">
            <p className="text-[12px] font-semibold text-foreground mb-2">Program outcome focus</p>
            <p className="text-[13px] text-foreground leading-relaxed">Placement momentum, prep readiness, and intervention visibility at cohort scale.</p>
          </div>
          <div className="rounded border border-border bg-muted/[0.08] p-4 shadow-lg">
            <p className="text-[12px] font-semibold text-foreground mb-2">Low-friction pilot</p>
            <p className="text-[13px] text-foreground leading-relaxed">No-custom launch defaults with a 30-day pass/fail operator scorecard.</p>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
