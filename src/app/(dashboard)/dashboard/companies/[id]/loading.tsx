import { Skeleton } from '@/app/(dashboard)/dashboard/_components/Skeleton'
import { Card } from '@/components/ui'
export default function CompanyDetailLoading() {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">

      <header className="bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Skeleton className="h-3 w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Company header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-64 mb-2" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>

        {/* Content sections */}
        <div className="space-y-4">

          <Card variant="glass" className="p-6 space-y-3">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>

          <Card variant="glass" className="gap-0 p-0 overflow-hidden">
            <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-6 space-y-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-20 w-full" />
          </Card>

        </div>
      </main>
    </div>
  )
}

