import Link from 'next/link'

export function HomepageBriefTeaser({ ctaAsTextLink = false }: { ctaAsTextLink?: boolean }) {
  return (
    <section id="example-walkthrough" data-first-mile-section="homepage_brief_teaser" className="border-y border-border bg-background/50 px-4 py-14 sm:px-6 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:1px_360px]">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Illustrative Example</p>
          <h2 className="mb-3 font-serif text-[1.5rem] leading-tight text-foreground sm:text-[1.9rem]">
            Example: how a leader enters the shortlist before the posting goes live.
          </h2>
          <p className="mb-2 text-[15px] leading-relaxed text-foreground">
            If useful, open one walkthrough and see how the sequence works in practice.
          </p>

          <Link
            href="/demo"
            className={ctaAsTextLink
              ? 'inline-flex items-center min-h-[44px] text-[14px] font-semibold text-primary-foreground underline underline-offset-4 transition-colors hover:text-foreground'
              : 'inline-flex items-center min-h-[44px] rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary'}
          >
            Open full example brief
          </Link>
        </div>
      </div>
    </section>
  )
}
