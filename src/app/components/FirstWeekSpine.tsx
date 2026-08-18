import Link from 'next/link'
import spine from '@/content/first-week-spine.json'

export function FirstWeekSpine() {
  return (
    <section
      id="first-week"
      data-first-mile-section="homepage_first_week_spine"
      className="border-b border-white/10 bg-slate-950/70 px-4 py-16 sm:px-6 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:1px_640px]"
      aria-labelledby="first-week-heading"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">What to expect</p>
        <h2 id="first-week-heading" className="font-display mb-10 text-[28px] font-semibold leading-[1.06] text-white sm:text-[36px]">
          {spine.heading}
        </h2>
        <ol className="space-y-7">
          {spine.steps.map((step, i) => (
            <li key={step.label} className="flex gap-5">
              <span className="font-display shrink-0 text-[22px] font-semibold leading-none text-orange-300 sm:text-[26px]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-orange-200">{step.label}</p>
                <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-slate-200/95">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function FirstWeekSpineCondensed() {
  return (
    <section
      data-first-mile-section="persona_first_week_spine"
      className="border-b border-white/10 bg-slate-950/70 px-4 py-10 sm:px-6"
      aria-label="Your first week"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Your first week</p>
        <ul className="space-y-2">
          {spine.condensed.map((line) => (
            <li key={line} className="text-[14px] leading-relaxed text-slate-200/95">{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] font-semibold text-slate-300">{spine.trustLine}</p>
      </div>
    </section>
  )
}

export function TrustLineCta({ ctaHref = '/signup', ctaLabel = 'Get access', children }: { ctaHref?: string; ctaLabel?: string; children?: React.ReactNode }) {
  return (
    <section
      data-first-mile-section="homepage_trust_cta"
      className="border-b border-white/10 bg-slate-950/80 px-4 py-14 text-center sm:px-6"
      aria-label="Get started"
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-5 text-[14px] font-semibold text-slate-200">{spine.trustLine}</p>
        {children ?? (
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-[14px] font-bold text-slate-950 transition-colors hover:bg-orange-600"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
