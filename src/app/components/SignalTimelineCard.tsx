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
      className={`rounded-[1.6rem] border border-cyan-200/20 bg-slate-950/90 p-5 text-slate-100 shadow-[0_30px_90px_rgba(2,6,23,0.38)] sm:p-6 ${expanded ? 'w-full' : 'h-full'}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Signal timeline</p>
          <h2 className="mt-2 text-[20px] font-semibold leading-tight text-white sm:text-[22px]">
            [{proofCase.descriptor}]
          </h2>
        </div>
        <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
          Public record
        </span>
      </div>

      <ol className="space-y-3" aria-label="Public signal events">
        {proofCase.events.map((event) => (
          <li key={`${event.date}-${event.event}`} className="grid grid-cols-[auto_1fr] gap-3 border-l border-cyan-200/30 pl-4">
            <time className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-100" dateTime={event.isoDate}>
              {event.date}
            </time>
            <p className="text-[13px] leading-relaxed text-slate-200">
              {event.event}
              {event.sourceClass && <span className="text-slate-400"> ({event.sourceClass})</span>}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[13px] font-semibold text-white">{proofCase.status}</p>
      </div>

      <figcaption className="sr-only">{proofCase.caption}</figcaption>
    </figure>
  )
}
