import { TrackLink } from '@/app/components/TrackLink'
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
            ? 'border-border bg-muted/[0.04] text-foreground shadow-2xl'
            : 'border-border bg-muted text-foreground shadow-xl',
        ].join(' ')}
      >
        <p className={[
          'mb-2 text-[11px] font-bold uppercase tracking-[0.16em]',
          'text-primary',
        ].join(' ')}>{eyebrow}</p>
        <h2 className={[
          'text-[24px] font-bold leading-[1.15] sm:text-[28px]',
          'text-foreground',
        ].join(' ')}>{title}</h2>
        <p className={[
          'mt-2 max-w-3xl text-[14px] leading-relaxed',
          isDark ? 'text-foreground' : 'text-muted-foreground',
        ].join(' ')}>{summary}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={`${step.phase}-${index}`}
              className={[
                'rounded-xl border p-4',
                isDark ? 'border-border bg-background/45' : 'border-border bg-primary',
              ].join(' ')}
            >
              <p className={[
                'text-[11px] font-semibold uppercase tracking-[0.12em]',
                'text-primary',
              ].join(' ')}>{step.phase}</p>
              <p className={[
                'mt-2 text-[14px] font-semibold leading-snug',
                'text-foreground',
              ].join(' ')}>{step.focus}</p>
              <p className={[
                'mt-2 text-[12px] leading-relaxed',
                'text-muted-foreground',
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
              isDark ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-card text-foreground hover:bg-muted',
            ].join(' ')}
          >
            Open full {CHANNEL_LABEL[channel]} timeline
          </TrackLink>
          <span className={[
            'text-[12px]',
            'text-muted-foreground',
          ].join(' ')}>Low-cognitive-load view with full phase-by-phase features.</span>
        </div>
      </div>
    </section>
  )
}
