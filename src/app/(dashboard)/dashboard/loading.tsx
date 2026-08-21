import { Card, Skeleton } from '@/components/ui'
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">

      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
        </div>
      </header>

      <main aria-busy="true" aria-live="polite" className="max-w-4xl mx-auto px-6 py-10">
        <Skeleton className="h-7 w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5">
              <Skeleton className="h-8 w-10 mb-2" />
              <Skeleton className="h-2.5 w-20" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-2.5 w-32 mb-4" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-full mb-3" />
          ))}
        </Card>
      </main>
    </div>
  )
}

