import { TrackLink } from './TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'

type CoachValueNudgeProps = {
  eyebrow?: string
  title: string
  body: string
  sourcePage: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function CoachValueNudge({
  eyebrow = 'Coach value',
  title,
  body,
  sourcePage,
  primaryHref = '/partners#apply',
  primaryLabel = 'Request the coach preview',
  secondaryHref = '/for-coaches',
  secondaryLabel = 'Return to coach preview',
}: CoachValueNudgeProps) {
  return (
    <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-card to-background p-5 text-foreground shadow-lg shadow-muted/10 sm:p-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h2 className="text-[20px] font-bold leading-tight text-foreground sm:text-[24px]">{title}</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <TrackLink
          href={primaryHref}
          event={EVENT_NAMES.channelEntryClicked}
          logToUserEvents
          properties={{ channel: 'coaches', cta_label: primaryLabel, source_page: sourcePage }}
          className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {primaryLabel}
        </TrackLink>
        <TrackLink
          href={secondaryHref}
          event={EVENT_NAMES.channelEntryClicked}
          logToUserEvents
          properties={{ channel: 'coaches', cta_label: secondaryLabel, source_page: sourcePage }}
          className="inline-flex items-center justify-center rounded border border-border px-5 py-3 text-[14px] font-semibold text-foreground transition-colors"
        >
          {secondaryLabel}
        </TrackLink>
      </div>
    </section>
  )
}