import { SkeletonCard, Skeleton } from '@/app/(dashboard)/dashboard/_components/Skeleton'

export default function SignalsLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <div className="h-14 bg-primary" />
      <main aria-busy="true" aria-live="polite" className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-7 w-24 mb-6" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
