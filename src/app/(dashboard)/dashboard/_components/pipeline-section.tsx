import Link from 'next/link'
import { PipelineFilter } from '../PipelineFilter'
import { EmptyState, EMPTY_ICONS } from '@/app/(dashboard)/dashboard/_components/EmptyState'
import { Badge, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type CompanyRow = {
  id: string
  name: string
  sector: string | null
  stage: string
  fit_score: number | null
  notes: string | null
}

type StageLabel = {
  key: string
  label: string
}

type StageMap = Record<string, { label: string; cls: string }>

type Props = {
  q: string
  stage: string
  page: number
  start: number
  pageSize: number
  totalCount: number
  totalFiltered: number
  totalPages: number
  hasFilters: boolean
  filtered: CompanyRow[]
  contactCountMap: Map<string, number>
  stageMap: StageMap
  stageOptions: StageLabel[]
  activationResumeDone: boolean
  showWrapUpLink: boolean
}

export function DashboardPipelineSection(props: Props) {
  const {
    q,
    stage,
    page,
    start,
    pageSize,
    totalCount,
    totalFiltered,
    totalPages,
    hasFilters,
    filtered,
    contactCountMap,
    stageMap,
    stageOptions,
    activationResumeDone,
    showWrapUpLink,
  } = props

  return (
    <Card variant="glass" id="pipeline" className="gap-0 rounded overflow-hidden shadow-lg py-0">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="group w-full cursor-pointer px-6 py-[18px] border-b border-border flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-muted-foreground">
            Pipeline
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-muted-foreground">
              {hasFilters && totalFiltered === 0
                ? `0 of ${totalCount}`
                : totalPages > 1 || hasFilters
                  ? `${start + 1}-${Math.min(start + pageSize, totalFiltered)} of ${totalFiltered}`
                  : totalCount} {totalCount === 1 ? 'company' : 'companies'}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              <span className="group-data-panel-open:hidden">Expand</span>
              <span className="hidden group-data-panel-open:inline">Collapse</span>
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>

      <div className="px-4 sm:px-6 pt-3 flex justify-end">
        <Button size="sm" variant="outline" className="border-border bg-muted hover:bg-muted/90" render={<Link href="/dashboard/companies/new" />}>
          Add company
        </Button>
      </div>

      <PipelineFilter q={q} stage={stage} stages={stageOptions} />

      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow className="bg-background/70 border-b border-border">
              <TableHead className="py-2.5 pl-6 pr-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">
                Company
              </TableHead>
              <TableHead className="py-2.5 px-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground hidden sm:table-cell">
                Sector
              </TableHead>
              <TableHead className="py-2.5 px-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">
                Stage
              </TableHead>
              <TableHead className="py-2.5 pl-4 pr-6 text-right text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">
                Fit <span className="normal-case font-normal text-muted-foreground">/10</span>
              </TableHead>
              <TableHead className="py-2.5 pl-2 pr-6 text-right text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">
                Brief
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  {totalCount === 0 ? (
                    !activationResumeDone ? (
                      <EmptyState
                        icon={EMPTY_ICONS.companies}
                        title="Start here: upload your resume"
                        body="Paste your LinkedIn profile text or upload your resume. It's what drives prep briefs, daily briefings, and every AI response you get."
                        cta={{ label: 'Profile', href: '/dashboard/profile' }}
                      />
                    ) : (
                      <EmptyState
                        icon={EMPTY_ICONS.companies}
                        title="No target companies yet"
                        body="Add companies you want to work for. We'll scan for signals - exec moves, funding, openings - and alert you when the timing is right. Then use the briefing to decide who to contact first."
                        cta={{ label: 'First company', href: '/dashboard/companies/new' }}
                      />
                    )
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[14px] text-muted-foreground">No companies match that filter.</p>
                      {q && (
                        <a
                          href={`/dashboard/companies/new?name=${encodeURIComponent(q)}`}
                          className="mt-3 inline-block text-[13px] font-semibold text-primary hover:underline"
                        >
                          Use &ldquo;{q}&rdquo; as pipeline draft →
                        </a>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((co, i) => {
                const s = stageMap[co.stage] ?? { label: co.stage, cls: 'bg-muted text-muted-foreground' }
                const contactCount = contactCountMap.get(co.id) ?? 0
                return (
                  <TableRow
                    key={co.id}
                    className={i < filtered.length - 1 ? 'border-b border-border hover:bg-transparent' : 'hover:bg-transparent'}
                  >
                    <TableCell className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/companies/${co.id}`} className="text-[14px] font-semibold text-muted-foreground hover:text-foreground">{co.name}</Link>
                        {contactCount > 0 && (
                          <Badge variant="outline" className="shrink-0 border-border bg-muted/60 text-muted-foreground">
                            {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
                          </Badge>
                        )}
                      </div>
                      {co.notes && (
                        <div className="text-[12px] text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-[340px]">
                          {co.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-[13px] text-muted-foreground hidden sm:table-cell">
                      {co.sector?.trim() ? co.sector : '—'}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Badge className={`tracking-[0.04em] ${s.cls}`}>
                        {s.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 pl-4 pr-6 text-right text-[14px] font-bold text-foreground">
                      {co.fit_score ?? '-'}
                    </TableCell>
                    <TableCell className="py-3.5 pl-2 pr-6 text-right">
                      <Button size="sm" variant="outline" className="border-border" render={<Link href={`/dashboard/companies/${co.id}/prep`} />}>
                        Get brief
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              {page > 0 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/dashboard?${new URLSearchParams({ ...(q ? { q } : {}), ...(stage ? { stage } : {}), page: String(page - 1) }).toString()}`}
                    className="text-foreground border-border"
                  />
                </PaginationItem>
              )}
              {page < totalPages - 1 && (
                <PaginationItem>
                  <PaginationNext
                    href={`/dashboard?${new URLSearchParams({ ...(q ? { q } : {}), ...(stage ? { stage } : {}), page: String(page + 1) }).toString()}`}
                    className="text-foreground border-border"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Search wrap-up link - discreet, for users who found a role outside the pipeline */}
      {showWrapUpLink && (
        <div className="mt-10 text-center">
          <Link
            href="/dashboard/wrap-up"
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Did your search wrap up? Mark it complete.
          </Link>
        </div>
      )}
      </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
