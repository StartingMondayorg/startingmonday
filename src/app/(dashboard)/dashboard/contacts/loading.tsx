import { Card, Skeleton } from '@/components/ui'
export default function ContactsLoading() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Skeleton className="h-3 w-20 bg-muted" />
        </div>
      </header>

      <section aria-busy="true" aria-live="polite" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8">
          <Skeleton className="h-7 w-28 bg-muted/60 mb-2" />
          <Skeleton className="h-3.5 w-64 bg-muted/60" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Contact list skeleton */}
          <Card variant="glass" className="rounded border-border bg-muted/40 overflow-hidden gap-0 p-0">
            <div className="px-6 py-[18px] border-b border-border flex items-center justify-between">
              <Skeleton className="h-2.5 w-24 bg-muted/60" />
              <Skeleton className="h-2.5 w-16 bg-muted/60" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-36 bg-muted/60" />
                      <Skeleton className="h-4 w-16 bg-muted/60 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-28 bg-muted/60" />
                  </div>
                  <Skeleton className="h-3 w-10 bg-muted/60 mt-1" />
                </div>
              ))}
            </div>
          </Card>

          {/* Add contact form skeleton */}
          <Card variant="glass" className="rounded border-border bg-muted/40 p-5 space-y-4">
            <Skeleton className="h-2.5 w-20 bg-muted/60" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2 w-14 bg-muted/60" />
                <div className="h-9 bg-muted/40 border border-border rounded" />
              </div>
            ))}
            <Skeleton className="h-9 w-full bg-muted/60 mt-2" />
          </Card>

        </div>
      </section>
    </div>
  )
}
