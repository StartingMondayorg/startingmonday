import { Card, Skeleton } from '@/components/ui'
export default function StartLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Title skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-56 mb-3" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Progress skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-1.5 w-7 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3.5 w-24" />
        </div>

        {/* Task list skeleton */}
        <div className="flex flex-col gap-3 mb-8">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

