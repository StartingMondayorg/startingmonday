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
}

const CHANNEL_LABEL: Record<CompactTimelineModuleProps['channel'], string> = {
  coaches: 'coaches',
  outplacement: 'outplacement',
  executives: 'executives',
  search_firms: 'search firms',
}

/*
  This used to take a `theme: 'dark' | 'light'` prop and branch every surface and
  text colour on it. The semantic tokens resolve per theme on their own, so the
  prop had nothing left to decide and its two branches had drifted into
  incompatible pairings. One token set now covers both themes.
*/
export function CompactTimelineModule({
  channel,
  sourcePage,
  eyebrow,
  title,
  summary,
  steps,
}: CompactTimelineModuleProps) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl rounded-[1.75rem] border bg-card p-6 text-card-foreground shadow-xl sm:p-7">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="text-[24px] font-bold leading-[1.15] text-foreground sm:text-[28px]">{title}</h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">{summary}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={`${step.phase}-${index}`} className="rounded-xl border bg-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{step.phase}</p>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-foreground">{step.focus}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Visual cue: {step.visual}</p>
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
            className="inline-flex items-center rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/10"
          >
            Open full {CHANNEL_LABEL[channel]} timeline
          </TrackLink>
          <span className="text-[12px] text-muted-foreground">Low-cognitive-load view with full phase-by-phase features.</span>
        </div>
      </div>
    </section>
  )
}
