import type { StartingMondayHeroProofCase } from '@/lib/starting-monday-hero-content'

type SignalTimelineCardProps = {
  proofCase: StartingMondayHeroProofCase
  altText: string
  expanded?: boolean
}

export function SignalTimelineCard({ proofCase, altText, expanded = false }: SignalTimelineCardProps) {
  return (
    <figure
      aria-label={altText}
      className={`rounded-[1.6rem] border border-info/20 bg-background/90 p-5 text-foreground shadow-2xl sm:p-6 ${expanded ? 'w-full' : 'h-full'}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Signal timeline</p>
          <h2 className="mt-2 text-[20px] font-semibold leading-tight text-foreground sm:text-[22px]">
            [{proofCase.descriptor}]
          </h2>
        </div>
        <span className="rounded-full border border-info/25 bg-info/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-info">
          Public record
        </span>
      </div>

      <ol className="space-y-3" aria-label="Public signal events">
        {proofCase.events.map((event) => (
          <li key={`${event.date}-${event.event}`} className="grid grid-cols-[auto_1fr] gap-3 border-l border-info/30 pl-4">
            <time className="text-[11px] font-semibold uppercase tracking-[0.08em] text-info" dateTime={event.isoDate}>
              {event.date}
            </time>
            <p className="text-[13px] leading-relaxed text-foreground">
              {event.event}
              {event.sourceClass && <span className="text-muted-foreground"> ({event.sourceClass})</span>}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-[13px] font-semibold text-foreground">{proofCase.status}</p>
      </div>

      <figcaption className="sr-only">{proofCase.caption}</figcaption>
    </figure>
  )
}
