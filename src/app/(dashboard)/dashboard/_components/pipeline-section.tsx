import Link from 'next/link'
import { PipelineFilter } from '../PipelineFilter'
import { EmptyState, EMPTY_ICONS } from '@/app/(dashboard)/dashboard/_components/EmptyState'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'

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
    <Card variant="glass" id="pipeline" className="gap-0 rounded overflow-hidden shadow-[0_14px_34px_rgba(2,6,23,0.35)] py-0">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="group w-full cursor-pointer px-6 py-[18px] border-b border-white/10 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-400">
            Pipeline
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-slate-400">
              {hasFilters && totalFiltered === 0
                ? `0 of ${totalCount}`
                : totalPages > 1 || hasFilters
                  ? `${start + 1}-${Math.min(start + pageSize, totalFiltered)} of ${totalFiltered}`
                  : totalCount} {totalCount === 1 ? 'company' : 'companies'}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              <span className="group-data-panel-open:hidden">Expand</span>
              <span className="hidden group-data-panel-open:inline">Collapse</span>
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>

      <div className="px-4 sm:px-6 pt-3 flex justify-end">
        <Button size="sm" variant="outline" className="border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700" render={<Link href="/dashboard/companies/new" />}>
          Add company
        </Button>
      </div>

      <PipelineFilter q={q} stage={stage} stages={stageOptions} />

      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow className="bg-slate-950/70 border-b border-white/10 hover:bg-slate-950/70">
              <TableHead className="py-2.5 pl-6 pr-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-slate-400">
                Company
              </TableHead>
              <TableHead className="py-2.5 px-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-slate-400 hidden sm:table-cell">
                Sector
              </TableHead>
              <TableHead className="py-2.5 px-4 text-left text-[10px] font-bold tracking-[0.09em] uppercase text-slate-400">
                Stage
              </TableHead>
              <TableHead className="py-2.5 pl-4 pr-6 text-right text-[10px] font-bold tracking-[0.09em] uppercase text-slate-400">
                Fit <span className="normal-case font-normal text-slate-500">/10</span>
              </TableHead>
              <TableHead className="py-2.5 pl-2 pr-6 text-right text-[10px] font-bold tracking-[0.09em] uppercase text-slate-400">
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
                      <p className="text-[14px] text-slate-400">No companies match that filter.</p>
                      {q && (
                        <a
                          href={`/dashboard/companies/new?name=${encodeURIComponent(q)}`}
                          className="mt-3 inline-block text-[13px] font-semibold text-orange-200 hover:underline"
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
                const s = stageMap[co.stage] ?? { label: co.stage, cls: 'bg-slate-100 text-slate-500' }
                const contactCount = contactCountMap.get(co.id) ?? 0
                return (
                  <TableRow
                    key={co.id}
                    className={i < filtered.length - 1 ? 'border-b border-white/5 hover:bg-transparent' : 'hover:bg-transparent'}
                  >
                    <TableCell className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/companies/${co.id}`} className="text-[14px] font-semibold text-slate-100 hover:text-white">{co.name}</Link>
                        {contactCount > 0 && (
                          <Badge variant="outline" className="shrink-0 border-white/10 bg-white/10 text-slate-300">
                            {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
                          </Badge>
                        )}
                      </div>
                      {co.notes && (
                        <div className="text-[12px] text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-[340px]">
                          {co.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-[13px] text-slate-500 hidden sm:table-cell">
                      {co.sector?.trim() ? co.sector : '—'}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Badge className={`tracking-[0.04em] ${s.cls}`}>
                        {s.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 pl-4 pr-6 text-right text-[14px] font-bold text-slate-100">
                      {co.fit_score ?? '-'}
                    </TableCell>
                    <TableCell className="py-3.5 pl-2 pr-6 text-right">
                      <Button size="sm" variant="outline" className="border-white/20 hover:border-white/35" render={<Link href={`/dashboard/companies/${co.id}/prep`} />}>
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
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[12px] text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              {page > 0 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/dashboard?${new URLSearchParams({ ...(q ? { q } : {}), ...(stage ? { stage } : {}), page: String(page - 1) }).toString()}`}
                    className="text-slate-200 border-white/15 hover:border-white/30"
                  />
                </PaginationItem>
              )}
              {page < totalPages - 1 && (
                <PaginationItem>
                  <PaginationNext
                    href={`/dashboard?${new URLSearchParams({ ...(q ? { q } : {}), ...(stage ? { stage } : {}), page: String(page + 1) }).toString()}`}
                    className="text-slate-200 border-white/15 hover:border-white/30"
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
            className="text-[12px] text-slate-400 hover:text-slate-200 transition-colors"
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
