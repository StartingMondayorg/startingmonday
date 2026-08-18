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
    <section className="rounded-3xl border border-orange-400/25 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-lg shadow-black/10 sm:p-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">{eyebrow}</p>
      <h2 className="text-[20px] font-bold leading-tight text-white sm:text-[24px]">{title}</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-300">{body}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <TrackLink
          href={primaryHref}
          event={EVENT_NAMES.channelEntryClicked}
          logToUserEvents
          properties={{ channel: 'coaches', cta_label: primaryLabel, source_page: sourcePage }}
          className="inline-flex items-center justify-center rounded bg-orange-500 px-5 py-3 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-orange-600"
        >
          {primaryLabel}
        </TrackLink>
        <TrackLink
          href={secondaryHref}
          event={EVENT_NAMES.channelEntryClicked}
          logToUserEvents
          properties={{ channel: 'coaches', cta_label: secondaryLabel, source_page: sourcePage }}
          className="inline-flex items-center justify-center rounded border border-slate-600 px-5 py-3 text-[14px] font-semibold text-slate-100 transition-colors hover:border-slate-300"
        >
          {secondaryLabel}
        </TrackLink>
      </div>
    </section>
  )
}