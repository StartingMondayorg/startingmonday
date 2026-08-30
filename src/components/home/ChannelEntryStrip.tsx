'use client'

import { useSearchParams } from 'next/navigation'
import { TrackLink } from '@/app/components/TrackLink'
import { CHANNEL_ROUTE_SPECS } from '@/lib/channel-ia'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { isEnabledFlag } from '@/lib/feature-flags'

export function ChannelEntryStrip() {
  const experimentEnabled = isEnabledFlag(process.env.NEXT_PUBLIC_CHANNEL_ENTRY_AB_TEST)
  const params = useSearchParams()
  const paramVariant = params.get('ce_variant')
  const variant: 'control' | 'emphasis' = paramVariant === 'emphasis' ? 'emphasis' : 'control'

  const title = variant === 'emphasis' ? 'Pick your channel and move fast' : 'Choose your channel'

  return (
    <section className="border-b border-border bg-background/80 px-4 py-5 sm:px-6 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {title}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNEL_ROUTE_SPECS.map((spec) => (
            <TrackLink
              key={spec.channel}
              href={spec.route}
              event={EVENT_NAMES.channelEntryClicked}
              logToUserEvents
              properties={{
                channel: spec.channel,
                cta_label: spec.primaryCtaLabel,
                source_page: '/',
                experiment_variant: experimentEnabled ? variant : 'disabled',
              }}
              className="block rounded-2xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:border-primary/60 hover:bg-muted/60"
            >
              <p className="text-[13px] font-semibold text-foreground">{spec.label}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{spec.hero}</p>
              <p className="mt-2 text-[11px] text-primary">{spec.trust}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">{spec.primaryCtaLabel}</p>
            </TrackLink>
          ))}
        </div>
      </div>
    </section>
  )
}
