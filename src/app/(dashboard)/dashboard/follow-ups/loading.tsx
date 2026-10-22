import { Card, Skeleton } from '@/components/ui'
export default function Loading() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="h-14 border-b border-border bg-background/80" />
      <section aria-busy="true" aria-live="polite" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32 bg-muted/60 mb-2" />
            <Skeleton className="h-4 w-40 bg-muted/60" />
          </div>
          <Skeleton className="h-8 w-40 bg-muted/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="glass" className="p-4">
              <Skeleton className="h-4 w-28 bg-muted/60 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-muted/60" />
                <Skeleton className="h-3 w-5/6 bg-muted/60" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

