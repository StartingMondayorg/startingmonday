import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { addSignalFollowUp, generateSignalOutreach, requestSignalRefresh } from './actions'
import { DraftPanel } from '@/app/(dashboard)/dashboard/_components/DraftPanel'
import { SignalOutreachGate } from '@/app/(dashboard)/dashboard/_components/SignalOutreachGate'
import { captureServerEvent } from '@/lib/posthog-server'
import { logEvent } from '@/lib/events'
import { rankSignals } from '@/lib/intelligence/intelligence-quality'
import { buildSignalTranslation } from '../signal-orientation'
import {
  applyDashboardSignalContract,
  DASHBOARD_COMPANY_SIGNAL_LIMIT,
  DASHBOARD_PATTERN_ALERT_LIMIT,
} from '@/lib/intelligence/dashboard-signal-contract'
import { SignalFilterBar } from './filter-bar'
import { Alert, AlertDescription, Badge, Button, Card, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui'
const PAGE_SIZE = 25

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  funding:        'Funding',
  exec_departure: 'Exec Departure',
  exec_hire:      'Exec Hire',
  acquisition:    'Acquisition',
  expansion:      'Expansion',
  layoffs:        'Layoffs',
  ipo:            'IPO',
  new_product:    'New Product',
  award:          'Award',
}

export const metadata = { title: 'Signals' }

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; type?: string; page?: string; scan?: string }>
}) {
  const { company: companyFilter, type: typeFilter, page: pageParam, scan: scanStatus } = await searchParams
  const page = Math.max(0, parseInt(pageParam ?? '0', 10) || 0)
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role_type, search_persona, positioning_summary, target_titles, target_sectors')
    .eq('user_id', user.id)
    .single()

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('name', { ascending: true })

  const [{ data: rawCompanySignals }, { data: rawPatternSignals }] = await Promise.all([
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, signal_date, source_kind, confidence, company_id, companies(id, name)')
      .eq('user_id', user.id)
      .neq('signal_type', 'pattern_alert')
      .gte('signal_date', since7d)
      .order('signal_date', { ascending: false })
      .limit(DASHBOARD_COMPANY_SIGNAL_LIMIT),
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, signal_date, source_kind, confidence, company_id, companies(id, name)')
      .eq('user_id', user.id)
      .eq('signal_type', 'pattern_alert')
      .gte('signal_date', since14d)
      .order('signal_date', { ascending: false })
      .limit(DASHBOARD_PATTERN_ALERT_LIMIT),
  ])

  type Signal = {
    id: string
    signal_type: string
    signal_summary: string
    outreach_angle?: string | null
    outreach_draft?: { subject: string; body: string } | null
    signal_date: string
    source_url?: string | null
    source_kind: string | null
    confidence: number | null
    relevance_score?: number | null
    company_id: string
    companies: { id: string; name: string } | Array<{ id: string; name: string }> | null
  }

  const contractSignals = ([...(rawCompanySignals ?? []), ...(rawPatternSignals ?? [])] as unknown as Signal[])
  const { mergedSignals } = applyDashboardSignalContract(contractSignals, {
    companySince: since7d,
    patternSince: since14d,
  })

  const companyOptionsMap = new Map<string, string>()
  for (const company of companies ?? []) {
    if (company?.id && company?.name) companyOptionsMap.set(company.id, company.name)
  }
  for (const signal of mergedSignals) {
    const companyRef = Array.isArray(signal.companies) ? signal.companies[0] : signal.companies
    if (companyRef?.id && companyRef?.name && !companyOptionsMap.has(companyRef.id)) {
      companyOptionsMap.set(companyRef.id, companyRef.name)
    }
  }
  const companyFilterOptions = Array.from(companyOptionsMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const observedSignalTypes = Array.from(new Set(mergedSignals.map((signal) => signal.signal_type).filter(Boolean)))
  const fallbackSignalTypes = [...Object.keys(SIGNAL_TYPE_LABELS), 'pattern_alert']
  const typeFilterOptions = (observedSignalTypes.length > 0 ? observedSignalTypes : fallbackSignalTypes)
    .map((value) => ({
      value,
      label: SIGNAL_TYPE_LABELS[value] ?? value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const contractFilteredSignals = mergedSignals
    .filter((signal) => !companyFilter || signal.company_id === companyFilter)
    .filter((signal) => !typeFilter || signal.signal_type === typeFilter)

  // Fetch first active contact per company for "Draft outreach" links
  const signalCompanyIds = [...new Set(contractFilteredSignals.map(s => s.company_id).filter(Boolean))]
  const contactByCompany = new Map<string, { id: string; name: string }>()
  if (signalCompanyIds.length > 0) {
    const { data: contactRows } = await supabase
      .from('contacts')
      .select('id, name, company_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('company_id', signalCompanyIds)
      .order('name')
    for (const c of (contactRows ?? [])) {
      if (c.company_id && !contactByCompany.has(c.company_id)) {
        contactByCompany.set(c.company_id, { id: c.id, name: c.name })
      }
    }
  }

  const rankedSignals = rankSignals(contractFilteredSignals, {
    roleType: profile?.role_type,
    searchPersona: profile?.search_persona,
  })

  const rankedOrFallback = rankedSignals.length > 0
    ? rankedSignals
    : contractFilteredSignals.map((signal) => ({ signal, score: 0, confidence: signal.confidence ?? 0, relevance: signal.relevance_score ?? 0 }))

  // Warm signals (companies with a known contact) float to the top after ranking.
  const sortedSignals = rankedOrFallback
    .map((entry) => ({ ...entry.signal, _score: entry.score, _confidence: entry.confidence, _relevance: entry.relevance }))
    .sort((a, b) => {
      const warmDelta = (contactByCompany.has(a.company_id) ? 0 : 1) - (contactByCompany.has(b.company_id) ? 0 : 1)
      if (warmDelta !== 0) return warmDelta
      return b._score - a._score
    })

  const totalPages = Math.max(1, Math.ceil(sortedSignals.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const signalList = sortedSignals.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const hasFilters = !!(companyFilter || typeFilter)

  const rolesFormingSignal = signalList[0] ?? null

  const suppressedCount = Math.max(0, contractSignals.length - mergedSignals.length)

  if (sortedSignals.length > 0) {
    captureServerEvent(user.id, 'signals_page_viewed', { signal_count: sortedSignals.length, page: safePage })
    await logEvent(user.id, 'signals_page_viewed', { signal_count: sortedSignals.length, page: safePage })
  }

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.company) sp.set('company', params.company)
    if (params.type) sp.set('type', params.type)
    if (params.page && params.page !== '0') sp.set('page', params.page)
    const qs = sp.toString()
    return `/dashboard/signals${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-2">
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Signals' },
          ]}
        />
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-[30px] font-bold text-foreground">Company Signals</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {sortedSignals.length} signal{sortedSignals.length !== 1 ? 's' : ''} detected
            </p>
          </div>
          <Link href="/dashboard" className="ml-auto text-[13px] font-semibold text-muted-foreground hover:text-primary transition-colors">
            Back to dashboard
          </Link>
        </div>

        {rolesFormingSignal && (
          <Alert variant="warning" className="mb-6">
            <AlertDescription className="text-current">
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase mb-1">Roles forming now</p>
              <p className="text-[15px] font-semibold text-foreground">
                {rolesFormingSignal.companies ? `${Array.isArray(rolesFormingSignal.companies) ? rolesFormingSignal.companies[0]?.name : rolesFormingSignal.companies.name} may be opening a role window.` : 'A role window may be opening.'}
              </p>
              <p className="text-[12px] mt-1.5 leading-relaxed">
                {rolesFormingSignal.signal_summary}
              </p>
              <p className="text-[12px] mt-1.5">
                Use this as a hypothesis, then move through a relationship before the posting becomes public.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <SignalFilterBar
            companyFilter={companyFilter}
            typeFilter={typeFilter}
            companyFilterOptions={companyFilterOptions}
            typeFilterOptions={typeFilterOptions}
          />

          <form action={requestSignalRefresh}>
            <input
              type="hidden"
              name="return_to"
              value={buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage) })}
            />
            <Button
              type="submit"
              variant="outline"
              className="border-primary/40 bg-primary/20 text-primary hover:bg-primary/30"
            >
              Run signal scan now
            </Button>
          </form>
        </div>

        {scanStatus === 'started' && (
          <Alert variant="success" className="mb-5">
            <AlertDescription>
              Signal scan started. This can take a couple of minutes; refresh this page to see the newest results.
            </AlertDescription>
          </Alert>
        )}
        {scanStatus === 'unavailable' && (
          <Alert variant="warning" className="mb-5">
            <AlertDescription>
              On-demand scans are not configured in this environment yet. Set WORKER_URL and WORKER_SECRET to enable this button.
            </AlertDescription>
          </Alert>
        )}
        {scanStatus === 'failed' && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>
              Could not start a scan right now. Please try again in a moment.
            </AlertDescription>
          </Alert>
        )}

        {/* Signal list */}
        {signalList.length > 0 && (
          <div className="mb-4">
            <p className="text-[13px] text-muted-foreground italic leading-relaxed">
              Use signals as a reason to reconnect with someone who already knows you. Cold outreach on a signal rarely lands at the executive level.
            </p>
            {suppressedCount > 0 && (
              <p className="text-[13px] text-muted-foreground mt-1">
                Suppressed {suppressedCount} low-confidence or stale signal{suppressedCount !== 1 ? 's' : ''} using Sprint 5 quality filters.
              </p>
            )}
          </div>
        )}
        {signalList.length === 0 ? (
          <Card variant="glass" className="p-10 text-center">
            <p className="text-[14px] text-muted-foreground">
              {hasFilters ? 'No signals match your filters.' : 'No signals yet. Signals are detected when the scanner runs (Mon, Wed, Fri).'}
            </p>
          </Card>
        ) : (
          <Card variant="glass" className="overflow-hidden mb-6">
            <div className="divide-y divide-border">
              {signalList.map(sig => {
                const co = Array.isArray(sig.companies) ? (sig.companies[0] ?? null) : sig.companies
                const dateLabel = new Date(sig.signal_date + 'T12:00:00Z').toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
                const typeLabel = SIGNAL_TYPE_LABELS[sig.signal_type] ?? sig.signal_type.replace(/_/g, ' ')

                const contact = contactByCompany.get(sig.company_id)
                const companyContext = co
                  ? { id: co.id, name: co.name }
                  : { id: sig.company_id, name: 'the company' }
                const translation = buildSignalTranslation(
                  {
                    signal_type: sig.signal_type,
                    signal_summary: sig.signal_summary,
                    outreach_angle: sig.outreach_angle ?? null,
                  },
                  profile,
                  companyContext,
                  contact?.id ?? null,
                )

                return (
                  <div key={sig.id} className="px-6 py-5">
                    <div className="flex items-start gap-2 flex-wrap mb-2">
                      {co && (
                        <Link
                          href={`/dashboard/companies/${co.id}`}
                          className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {co.name}
                        </Link>
                      )}
                      <Badge variant="default">{typeLabel}</Badge>
                      <span className="text-[13px] text-muted-foreground ml-auto">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary">Confidence {sig._confidence}</Badge>
                      <Badge variant="info">Relevance {sig._relevance}</Badge>
                      {sig.source_kind && (
                        <Badge variant="success">{sig.source_kind}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.5fr_0.8fr] gap-3 mt-4">
                      <Card variant="glass" className="p-4">
                        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">What happened</p>
                        <p className="text-[13px] text-foreground leading-relaxed">{translation.whatHappened}</p>
                      </Card>
                      <Card variant="glass" className="p-4">
                        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Why it may matter for your search</p>
                        <p className="text-[13px] text-foreground leading-relaxed">{translation.whyItMatters}</p>
                      </Card>
                      <Card variant="glass" className="p-4 flex flex-col gap-3">
                        <div>
                          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">What to do next</p>
                          <p className="text-[13px] text-foreground leading-relaxed">{translation.nextStepLabel}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button render={<Link href={translation.nextStepHref} />}>
                            Open {translation.nextStepVerb}
                          </Button>
                          <form action={addSignalFollowUp}>
                            <input type="hidden" name="company_name" value={co?.name ?? ''} />
                            <input type="hidden" name="signal_summary" value={sig.signal_summary} />
                            <Button type="submit" variant="outline" className="w-full">
                              + Follow up in 5 days
                            </Button>
                          </form>
                        </div>
                      </Card>
                    </div>
                    {sig.outreach_angle && (
                      <p className="text-[12px] text-muted-foreground italic mt-3 leading-relaxed">Original angle: {sig.outreach_angle}</p>
                    )}
                    {sig.outreach_draft && (
                      <div className="mt-3"><DraftPanel draft={sig.outreach_draft} /></div>
                    )}
                    {sig.source_url && (
                      <Button
                        variant="link"
                        className="mt-3 h-auto p-0 text-[13px] text-muted-foreground hover:text-foreground"
                        render={<a href={sig.source_url} target="_blank" rel="noopener noreferrer" />}
                      >
                        Source link
                      </Button>
                    )}
                    {!sig.outreach_draft && !contact && co ? (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Button variant="outline" render={<Link href={`/dashboard/contacts?company_id=${co.id}`} />}>
                          + Add contact at {co.name}
                        </Button>
                        <Button variant="outline" render={<Link href={`/dashboard/companies/${co.id}/prep?stage=informal_meeting`} />}>
                          Prep a conversation
                        </Button>
                      </div>
                    ) : null}
                    {contact && !sig.outreach_draft && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Button
                          className="bg-success/20 text-success hover:bg-success/30 border-success/35"
                          render={<Link href={`/dashboard/contacts/${contact.id}/outreach`} />}
                        >
                          Draft outreach to {contact.name}
                        </Button>
                      </div>
                    )}
                    {!sig.outreach_draft && (
                      <div className="mt-3">
                        <SignalOutreachGate
                          signalId={sig.id}
                          companyName={co?.name ?? null}
                          action={generateSignalOutreach}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="justify-between">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={safePage > 0 ? buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage - 1) }) : '#'}
                  className={safePage === 0 ? 'opacity-40 pointer-events-none' : ''}
                />
              </PaginationItem>
            </PaginationContent>
            <span className="text-[13px] text-muted-foreground">
              Page {safePage + 1} of {totalPages}
            </span>
            <PaginationContent>
              <PaginationItem>
                <PaginationNext
                  href={safePage < totalPages - 1 ? buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage + 1) }) : '#'}
                  className={safePage >= totalPages - 1 ? 'opacity-40 pointer-events-none' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </div>
  )
}
