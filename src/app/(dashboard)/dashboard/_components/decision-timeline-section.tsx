import Link from 'next/link'
import { Alert, AlertDescription, Badge, Button, Card, Label, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ToggleGroup, ToggleGroupItem } from '@/components/ui'
type DecisionTimelineItem = {
  id: string
  name: string
  stageLabel: string
  nextDecisionMarker: string
  decisionWindowLabel: string
  daysSinceUpdate: number | null
  stalled: boolean
  ownerLabel: string
  href: string
}

type DashboardDecisionTimelineSectionProps = {
  roleLensLabel: string
  items: DecisionTimelineItem[]
  stalledCount: number
  sort: 'stalled_desc' | 'recent_desc' | 'name_asc'
  page: number
  totalPages: number
  updateDecisionOwner: (formData: FormData) => void | Promise<void>
}

export function DashboardDecisionTimelineSection({
  roleLensLabel,
  items,
  stalledCount,
  sort,
  page,
  totalPages,
  updateDecisionOwner,
}: DashboardDecisionTimelineSectionProps) {
  const currentSort = sort

  function withParams(nextPage: number, nextSort?: string) {
    const qp = new URLSearchParams()
    qp.set('focus', 'health')
    qp.set('timelinePage', String(nextPage))
    qp.set('timelineSort', nextSort ?? currentSort)
    return `/dashboard?${qp.toString()}`
  }

  return (
    <Card className="mb-6 border-border bg-background/55 p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Decision timeline engine</p>
          <h2 className="text-[19px] font-bold text-foreground mt-1">Required next-decision markers</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Every campaign carries a next irreversible decision marker with owner and timing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border bg-card/80 text-foreground">Viewing as {roleLensLabel}</Badge>
          <Badge variant={stalledCount > 0 ? 'warning' : 'success'}>
            {stalledCount > 0 ? `${stalledCount} stalled 14d+` : 'No stalled campaigns'}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-muted-foreground">Sort:</span>
        <ToggleGroup value={[currentSort]} className="gap-2">
          <ToggleGroupItem
            value="stalled_desc"
            render={<Link href={withParams(0, 'stalled_desc')} />}
            className={`rounded border px-2 py-1 text-[11px] font-semibold ${currentSort === 'stalled_desc' ? 'border-border bg-muted/60 text-foreground' : 'border-border bg-card/80 text-muted-foreground hover:text-foreground'}`}
          >
            Stalled first
          </ToggleGroupItem>
          <ToggleGroupItem
            value="recent_desc"
            render={<Link href={withParams(0, 'recent_desc')} />}
            className={`rounded border px-2 py-1 text-[11px] font-semibold ${currentSort === 'recent_desc' ? 'border-border bg-muted/60 text-foreground' : 'border-border bg-card/80 text-muted-foreground hover:text-foreground'}`}
          >
            Recently moved
          </ToggleGroupItem>
          <ToggleGroupItem
            value="name_asc"
            render={<Link href={withParams(0, 'name_asc')} />}
            className={`rounded border px-2 py-1 text-[11px] font-semibold ${currentSort === 'name_asc' ? 'border-border bg-muted/60 text-foreground' : 'border-border bg-card/80 text-muted-foreground hover:text-foreground'}`}
          >
            Name A-Z
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {items.length === 0 ? (
        <Alert className="mt-4 border-border bg-card/70">
          <AlertDescription className="text-[13px] text-muted-foreground">
            No campaigns yet. Add your first target to initialize timeline markers.
          </AlertDescription>
          <Link href="/dashboard/companies/new" className="inline-block mt-2 text-[13px] font-semibold text-foreground underline underline-offset-2 hover:text-primary">
            Add first campaign
          </Link>
        </Alert>
      ) : (
        <div className="mt-4 space-y-2.5">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`p-3 ${item.stalled ? 'border-warning/40 bg-warning/10' : 'border-border bg-card/70'}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link href={item.href} className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
                  <p className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">{item.name}</p>
                  <p className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Stage: {item.stageLabel}</p>
                </Link>
                <div className="text-[12px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Owner:</span> {item.ownerLabel === 'Account owner' ? 'You (account owner)' : item.ownerLabel}
                </div>
              </div>

              <Link
                href={item.href}
                className="mt-2 block rounded border border-border bg-background/70 px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-1">Next irreversible decision marker</p>
                <p className="text-[13px] text-foreground leading-relaxed">{item.nextDecisionMarker}</p>
              </Link>

              <Link
                href={item.href}
                className="mt-2 flex flex-col gap-1 rounded-sm sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <p className="text-[12px] text-muted-foreground">Suggested decision window: {item.decisionWindowLabel}</p>
                <p className={`text-[12px] ${item.stalled ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
                  Last moved: {item.daysSinceUpdate === null ? 'Unknown' : item.daysSinceUpdate === 0 ? 'today' : item.daysSinceUpdate === 1 ? 'yesterday' : `${item.daysSinceUpdate} days ago`}
                </p>
              </Link>

              <form action={updateDecisionOwner} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="company_id" value={item.id} />
                <Label className="text-[11px] font-normal text-muted-foreground" htmlFor={`owner-${item.id}`}>Decision owner</Label>
                <Select
                  name="decision_owner"
                  defaultValue={['Account owner', 'Coach', 'Partner', 'Admin'].includes(item.ownerLabel) ? item.ownerLabel : 'Account owner'}
                >
                  <SelectTrigger id={`owner-${item.id}`} className="border-border text-[12px] text-foreground bg-card/90">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Account owner">Account owner</SelectItem>
                    <SelectItem value="Coach">Coach</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="link" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">Save</Button>
              </form>

              <Link href={item.href} className="inline-block mt-2 text-[12px] font-semibold text-foreground underline underline-offset-2 hover:text-primary">
                Edit campaign details
              </Link>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-3 justify-between">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={withParams(Math.max(0, page - 1))}
                className={`text-[12px] font-semibold ${page === 0 ? 'pointer-events-none text-muted-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              />
            </PaginationItem>
          </PaginationContent>
          <p className="text-[12px] text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext
                href={withParams(Math.min(totalPages - 1, page + 1))}
                className={`text-[12px] font-semibold ${page >= totalPages - 1 ? 'pointer-events-none text-muted-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Card>
  )
}
