import { Card, Skeleton } from '@/components/ui'
export default function StrategyLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">

      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Skeleton className="h-3 w-20 bg-muted" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8">
          <Skeleton className="h-7 w-56 mb-2" />
          <Skeleton className="h-3.5 w-80" />
        </div>

        <Card className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
          <div className="pt-2">
            <Skeleton className="h-10 w-48" />
          </div>
        </Card>

      </main>
    </div>
  )
}

