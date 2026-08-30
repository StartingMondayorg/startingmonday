import { Skeleton } from '@/components/ui'
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-background/72">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Skeleton className="h-3 w-24 bg-muted/60" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <Skeleton className="h-7 w-48 bg-muted/60 mb-3" />
          <Skeleton className="h-3.5 w-72 bg-muted/60" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-muted/40 p-5">
              <Skeleton className="h-4 w-1/3 bg-muted/60 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full bg-muted/60" />
                <Skeleton className="h-3.5 w-4/5 bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
