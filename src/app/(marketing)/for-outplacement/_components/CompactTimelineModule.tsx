import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'

type CompactTimelineStep = {
  phase: string
  focus: string
  visual: string
}

type CompactTimelineModuleProps = {
  channel: 'coaches' | 'outplacement' | 'executives' | 'search_firms'
  sourcePage: string
  eyebrow: string
  title: string
  summary: string
  steps: CompactTimelineStep[]
  theme?: 'dark' | 'light'
}

const CHANNEL_LABEL: Record<CompactTimelineModuleProps['channel'], string> = {
  coaches: 'coaches',
  outplacement: 'outplacement',
  executives: 'executives',
  search_firms: 'search firms',
}

export function CompactTimelineModule({
  channel,
  sourcePage,
  eyebrow,
  title,
  summary,
  steps,
  theme = 'dark',
}: CompactTimelineModuleProps) {
  const isDark = theme === 'dark'

  return (
    <section className={isDark ? 'px-4 py-10 sm:px-6' : 'px-4 py-10 sm:px-6 sm:py-12'}>
      <div
        className={[
          'mx-auto max-w-5xl rounded-[1.75rem] border p-6 sm:p-7',
          isDark
            ? 'border-white/12 bg-white/[0.04] text-slate-100 shadow-[0_24px_90px_rgba(15,23,42,0.2)]'
            : 'border-slate-200 bg-slate-50 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)]',
        ].join(' ')}
      >
        <p className={[
          'mb-2 text-[11px] font-bold uppercase tracking-[0.16em]',
          isDark ? 'text-orange-200' : 'text-orange-600',
        ].join(' ')}>{eyebrow}</p>
        <h2 className={[
          'text-[24px] font-bold leading-[1.15] sm:text-[28px]',
          isDark ? 'text-white' : 'text-slate-900',
        ].join(' ')}>{title}</h2>
        <p className={[
          'mt-2 max-w-3xl text-[14px] leading-relaxed',
          isDark ? 'text-slate-200' : 'text-slate-600',
        ].join(' ')}>{summary}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={`${step.phase}-${index}`}
              className={[
                'rounded-xl border p-4',
                isDark ? 'border-white/12 bg-slate-950/45' : 'border-slate-200 bg-white',
              ].join(' ')}
            >
              <p className={[
                'text-[11px] font-semibold uppercase tracking-[0.12em]',
                isDark ? 'text-orange-200' : 'text-orange-600',
              ].join(' ')}>{step.phase}</p>
              <p className={[
                'mt-2 text-[14px] font-semibold leading-snug',
                isDark ? 'text-white' : 'text-slate-900',
              ].join(' ')}>{step.focus}</p>
              <p className={[
                'mt-2 text-[12px] leading-relaxed',
                isDark ? 'text-slate-300' : 'text-slate-600',
              ].join(' ')}>Visual cue: {step.visual}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TrackLink
            href={`/channels/feature-map?channel=${channel}`}
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{
              channel,
              cta_label: 'mini_timeline_open_full',
              source_page: sourcePage,
              destination: '/channels/feature-map',
              destination_channel: channel,
            }}
            className={[
              'inline-flex items-center rounded px-4 py-2 text-[13px] font-semibold transition-colors',
              isDark ? 'bg-orange-500 text-slate-950 hover:bg-orange-600' : 'bg-slate-900 text-white hover:bg-slate-700',
            ].join(' ')}
          >
            Open full {CHANNEL_LABEL[channel]} timeline
          </TrackLink>
          <span className={[
            'text-[12px]',
            isDark ? 'text-slate-300' : 'text-slate-500',
          ].join(' ')}>Low-cognitive-load view with full phase-by-phase features.</span>
        </div>
      </div>
    </section>
  )
}
