import { Card, Skeleton as SkeletonBase } from '@/components/ui'
export function Skeleton({ className = '' }: { className?: string }) {
  return <SkeletonBase className={className} />
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card variant="default" className={`gap-0 p-5 ${className}`}>
      <Skeleton className="h-4 w-24 mb-3" />
      <SkeletonText lines={2} />
    </Card>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} variant="default" className="gap-0 p-3 sm:p-5">
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-2.5 w-16" />
        </Card>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card variant="default" className="gap-0 p-0">
      <div className="px-6 py-4 border-b border-border">
        <Skeleton className="h-3.5 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-4 flex-1 max-w-[180px]" />
            <Skeleton className="h-4 flex-1 max-w-[100px] hidden sm:block" />
            <Skeleton className="h-6 w-20 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </Card>
  )
}
