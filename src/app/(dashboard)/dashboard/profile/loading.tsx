import { Skeleton } from '@/components/ui'
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">

      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Skeleton className="h-3 w-20 bg-muted" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8">
          <Skeleton className="h-7 w-20 bg-muted mb-2" />
          <Skeleton className="h-3.5 w-48 bg-muted" />
        </div>

        <div className="bg-card border border-border rounded p-8 max-w-xl space-y-6">

          {/* Radio group skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-2 w-20 bg-muted mb-3" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 bg-muted border border-border" />
            ))}
          </div>

          {/* Text field skeletons */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2 w-24 bg-muted" />
              <Skeleton className="h-10 bg-muted border border-border" />
            </div>
          ))}

          {/* Textarea skeleton */}
          <div className="space-y-1.5">
            <Skeleton className="h-2 w-32 bg-muted" />
            <Skeleton className="h-24 bg-muted border border-border" />
          </div>

          <Skeleton className="h-10 w-28 bg-muted" />

        </div>
      </main>
    </div>
  )
}

