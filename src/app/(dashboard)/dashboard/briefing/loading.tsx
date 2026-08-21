export default function BriefingLoading() {
  return (
    <div className="min-h-screen bg-card/85 font-sans text-foreground">

      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="h-3 w-28 bg-muted/60 rounded animate-pulse" />
        </div>
      </header>

      <section aria-busy="true" aria-live="polite" className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header skeleton */}
        <div className="rounded-t-2xl border border-border bg-muted/40 px-5 sm:px-8 py-7 shadow-xl backdrop-blur-md">
          <div className="h-2 w-24 bg-muted/60 rounded animate-pulse mb-4" />
          <div className="h-7 w-52 bg-muted/60 rounded animate-pulse mb-3" />
          <div className="h-3 w-36 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Stats bar skeleton */}
        <div className="bg-muted/40 border-x border-border grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border backdrop-blur-md">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-4 px-3 text-center">
              <div className="h-6 w-8 bg-muted/60 rounded animate-pulse mx-auto mb-2" />
              <div className="h-2 w-14 bg-muted/60 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Body skeleton */}
        <div className="rounded-b-2xl border border-border border-t-0 bg-muted/40 px-5 sm:px-8 py-6 sm:py-8 shadow-xl backdrop-blur-md">

          {/* Generating message */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[13px] text-muted-foreground">Assembling your briefing...</p>
          </div>

          {/* Intro skeleton */}
          <div className="mb-8 space-y-2">
            <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-muted/60 rounded animate-pulse" />
          </div>

          {/* Section skeleton */}
          <div className="mb-8">
            <div className="h-2 w-28 bg-muted/60 rounded animate-pulse mb-4 pb-3 border-b border-border" />
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-r space-y-2 backdrop-blur-md">
              <div className="h-4 w-32 bg-warning/20 rounded animate-pulse" />
              <div className="h-3.5 w-full bg-warning/20 rounded animate-pulse" />
              <div className="h-3.5 w-3/4 bg-warning/20 rounded animate-pulse" />
            </div>
          </div>

          {/* Section skeleton 2 */}
          <div className="mb-8">
            <div className="h-2 w-24 bg-muted/60 rounded animate-pulse mb-4" />
            <div className="p-4 bg-muted/40 border border-border rounded-r space-y-2 backdrop-blur-md">
              <div className="h-4 w-40 bg-muted/60 rounded animate-pulse" />
              <div className="h-3.5 w-full bg-muted/60 rounded animate-pulse" />
              <div className="h-3.5 w-2/3 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Starting Monday &middot; Daily Intelligence Briefing
        </p>

      </section>
    </div>
  )
}

