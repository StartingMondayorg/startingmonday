import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Skeleton className="h-3 w-20 bg-slate-700" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8">
          <Skeleton className="h-7 w-20 bg-slate-200 mb-2" />
          <Skeleton className="h-3.5 w-48 bg-slate-200" />
        </div>

        <div className="bg-white border border-slate-200 rounded p-8 max-w-xl space-y-6">

          {/* Radio group skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-2 w-20 bg-slate-100 mb-3" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 bg-slate-50 border border-slate-200" />
            ))}
          </div>

          {/* Text field skeletons */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2 w-24 bg-slate-100" />
              <Skeleton className="h-10 bg-slate-50 border border-slate-200" />
            </div>
          ))}

          {/* Textarea skeleton */}
          <div className="space-y-1.5">
            <Skeleton className="h-2 w-32 bg-slate-100" />
            <Skeleton className="h-24 bg-slate-50 border border-slate-200" />
          </div>

          <Skeleton className="h-10 w-28 bg-slate-200" />

        </div>
      </main>
    </div>
  )
}

