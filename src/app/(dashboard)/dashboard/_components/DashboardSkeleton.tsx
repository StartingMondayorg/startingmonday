export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <header className="border-b border-white/10 bg-slate-950/72">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-3" />
          <div className="h-3.5 w-72 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="h-4 w-1/3 bg-white/10 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-3.5 w-4/5 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

