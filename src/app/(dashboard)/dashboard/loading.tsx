import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
        </div>
      </header>

      <section aria-busy="true" aria-live="polite" className="max-w-4xl mx-auto px-6 py-10">
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
      </section>
    </div>
  )
}

