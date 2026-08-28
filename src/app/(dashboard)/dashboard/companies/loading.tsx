import { SkeletonTable, Skeleton } from '@/app/(dashboard)/dashboard/_components/Skeleton'

export default function CompaniesLoading() {
  return (
    <div className="min-h-screen bg-muted font-sans">
      <div className="h-14 bg-primary" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28 rounded" />
        </div>
        <SkeletonTable rows={8} />
      </main>
    </div>
  )
}
