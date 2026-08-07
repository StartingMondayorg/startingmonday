import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '../logout-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { addSignalFollowUp, generateSignalOutreach, requestSignalRefresh } from './actions'
import { DraftPanel } from '@/components/DraftPanel'
import { SignalOutreachGate } from '@/components/SignalOutreachGate'
import { captureServerEvent } from '@/lib/posthog-server'
import { logEvent } from '@/lib/events'
import { rankSignals } from '@/lib/intelligence-quality'
import { buildSignalTranslation } from '../signal-orientation'
import { buildPharmaSignalInputFromSignal, shouldSurfacePharmaSignal } from '@/lib/pharma-signal-scoring'
import {
  applyDashboardSignalContract,
  DASHBOARD_COMPANY_SIGNAL_LIMIT,
  DASHBOARD_PATTERN_ALERT_LIMIT,
} from '@/lib/dashboard-signal-contract'

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

  const pharmaAnnotatedSignals = rankedOrFallback.map((entry) => {
    const pharmaInput = buildPharmaSignalInputFromSignal({
      signalType: entry.signal.signal_type,
      companyName: entry.signal.companies && !Array.isArray(entry.signal.companies) ? entry.signal.companies.name : undefined,
      description: entry.signal.signal_summary,
      sourceKind: entry.signal.source_kind,
      signalDate: entry.signal.signal_date,
    })
    const pharmaScore = shouldSurfacePharmaSignal(pharmaInput)
    return {
      ...entry,
      _pharmaRelevant: pharmaScore,
      _pharmaInput: pharmaInput,
    }
  })

  // Warm signals (companies with a known contact) float to the top after ranking.
  const sortedSignals = pharmaAnnotatedSignals
    .map((entry) => ({
      ...entry.signal,
      _score: entry.score,
      _confidence: entry.confidence,
      _relevance: entry.relevance,
      _pharmaRelevant: entry._pharmaRelevant,
      _pharmaInput: entry._pharmaInput,
    }))
    .sort((a, b) => {
      const pharmaDelta = Number(b._pharmaRelevant) - Number(a._pharmaRelevant)
      if (pharmaDelta !== 0) return pharmaDelta
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-md border border-slate-700 px-3 text-[13px] font-semibold text-slate-200 hover:text-white hover:border-slate-500"
            >
              Dashboard
            </Link>
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
            <h1 className="text-[30px] font-bold text-white">Company Signals</h1>
            <p className="text-[13px] text-slate-300 mt-0.5">
              {sortedSignals.length} signal{sortedSignals.length !== 1 ? 's' : ''} detected
            </p>
          </div>
          <Link href="/dashboard" className="ml-auto text-[13px] font-semibold text-slate-300 hover:text-orange-200 transition-colors">
            Back to dashboard
          </Link>
        </div>

        {rolesFormingSignal && (
          <div className="mb-6 rounded-xl border border-orange-300/35 bg-orange-500/10 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-orange-200 mb-1">Roles forming now</p>
            <p className="text-[15px] font-semibold text-white">
              {rolesFormingSignal.companies ? `${Array.isArray(rolesFormingSignal.companies) ? rolesFormingSignal.companies[0]?.name : rolesFormingSignal.companies.name} may be opening a role window.` : 'A role window may be opening.'}
            </p>
            <p className="text-[12px] text-slate-200 mt-1.5 leading-relaxed">
              {rolesFormingSignal.signal_summary}
            </p>
            <p className="text-[12px] text-slate-300 mt-1.5">
              Use this as a hypothesis, then move through a relationship before the posting becomes public.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
        <form method="GET" className="flex flex-wrap gap-3">
          <label className="sr-only">Filter by company</label>
          <select
            name="company"
            aria-label="Filter by company"
            defaultValue={companyFilter ?? ''}
            className="text-[13px] border border-white/20 rounded px-3 py-1.5 bg-white/5 text-slate-100 focus:outline-none focus:border-orange-300/50"
          >
            <option value="">All companies</option>
            {companyFilterOptions.map((companyOption) => (
              <option key={companyOption.id} value={companyOption.id}>{companyOption.name}</option>
            ))}
          </select>

          <label className="sr-only">Filter by type</label>
          <select
            name="type"
            aria-label="Filter by type"
            defaultValue={typeFilter ?? ''}
            className="text-[13px] border border-white/20 rounded px-3 py-1.5 bg-white/5 text-slate-100 focus:outline-none focus:border-orange-300/50"
          >
            <option value="">All types</option>
            {typeFilterOptions.map((typeOption) => (
              <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
            ))}
          </select>

          <button
            type="submit"
            className="text-[13px] font-semibold text-slate-100 border border-white/20 bg-white/5 rounded px-3 py-1.5 hover:bg-white/10 cursor-pointer transition-colors"
          >
            Filter
          </button>

          {hasFilters && (
            <Link
              href="/dashboard/signals"
              className="text-[13px] text-slate-400 hover:text-slate-200 py-1.5 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

          <form action={requestSignalRefresh}>
          <input
            type="hidden"
            name="return_to"
            value={buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage) })}
          />
          <button
            type="submit"
            className="text-[13px] font-semibold text-orange-100 border border-orange-300/40 bg-orange-500/20 rounded px-3 py-1.5 hover:bg-orange-500/30 cursor-pointer transition-colors"
          >
            Run signal scan now
          </button>
          </form>
        </div>

        {scanStatus === 'started' && (
          <p className="mb-5 rounded-md border border-emerald-300/35 bg-emerald-500/12 px-3 py-2 text-[13px] text-emerald-100">
            Signal scan started. This can take a couple of minutes; refresh this page to see the newest results.
          </p>
        )}
        {scanStatus === 'unavailable' && (
          <p className="mb-5 rounded-md border border-amber-300/35 bg-amber-500/12 px-3 py-2 text-[13px] text-amber-100">
            On-demand scans are not configured in this environment yet. Set WORKER_URL and WORKER_SECRET to enable this button.
          </p>
        )}
        {scanStatus === 'failed' && (
          <p className="mb-5 rounded-md border border-rose-300/35 bg-rose-500/12 px-3 py-2 text-[13px] text-rose-100">
            Could not start a scan right now. Please try again in a moment.
          </p>
        )}

        {/* Signal list */}
        {signalList.length > 0 && (
          <div className="mb-4">
            <p className="text-[13px] text-slate-300 italic leading-relaxed">
              Use signals as a reason to reconnect with someone who already knows you. Cold outreach on a signal rarely lands at the executive level.
            </p>
            {suppressedCount > 0 && (
              <p className="text-[13px] text-slate-400 mt-1">
                Suppressed {suppressedCount} low-confidence or stale signal{suppressedCount !== 1 ? 's' : ''} using Sprint 5 quality filters.
              </p>
            )}
          </div>
        )}
        {signalList.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-[14px] text-slate-300">
              {hasFilters ? 'No signals match your filters.' : 'No signals yet. Signals are detected when the scanner runs (Mon, Wed, Fri).'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-white/5 overflow-hidden mb-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="divide-y divide-white/10">
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
                          className="text-[14px] font-semibold text-white hover:text-orange-200 transition-colors"
                        >
                          {co.name}
                        </Link>
                      )}
                      <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-orange-500/20 text-orange-100 border border-orange-300/35">
                        {typeLabel}
                      </span>
                      <span className="text-[13px] text-slate-400 ml-auto">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-white/10 text-slate-200 border border-white/15">
                        Confidence {sig._confidence}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-blue-500/20 text-blue-100 border border-blue-300/35">
                        Relevance {sig._relevance}
                      </span>
                      {sig.source_kind && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-300/35">
                          {sig.source_kind}
                        </span>
                      )}
                      {sig._pharmaRelevant && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-violet-500/20 text-violet-100 border border-violet-300/35">
                          Pharma-relevant
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.5fr_0.8fr] gap-3 mt-4">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">What happened</p>
                        <p className="text-[13px] text-slate-200 leading-relaxed">{translation.whatHappened}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Why it may matter for your search</p>
                        <p className="text-[13px] text-slate-200 leading-relaxed">{translation.whyItMatters}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                        <div>
                          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">What to do next</p>
                          <p className="text-[13px] text-slate-200 leading-relaxed">{translation.nextStepLabel}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link
                            href={translation.nextStepHref}
                            className="text-[13px] font-semibold text-orange-100 hover:text-white bg-orange-500/20 hover:bg-orange-500/30 border border-orange-300/35 px-3 py-1.5 rounded transition-colors text-center"
                          >
                            Open {translation.nextStepVerb}
                          </Link>
                          <form action={addSignalFollowUp}>
                            <input type="hidden" name="company_name" value={co?.name ?? ''} />
                            <input type="hidden" name="signal_summary" value={sig.signal_summary} />
                            <button
                              type="submit"
                              className="w-full text-[13px] font-semibold text-slate-200 hover:text-white border border-white/20 hover:border-white/35 bg-white/5 px-3 py-1.5 rounded transition-colors cursor-pointer"
                            >
                              + Follow up in 5 days
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                    {sig.outreach_angle && (
                      <p className="text-[12px] text-slate-400 italic mt-3 leading-relaxed">Original angle: {sig.outreach_angle}</p>
                    )}
                    {sig.outreach_draft && (
                      <div className="mt-3"><DraftPanel draft={sig.outreach_draft} /></div>
                    )}
                    {sig.source_url && (
                      <a
                        href={sig.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-[13px] text-slate-400 hover:text-slate-200 underline transition-colors"
                      >
                        Source link
                      </a>
                    )}
                    {!sig.outreach_draft && !contact && co ? (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/dashboard/contacts?company_id=${co.id}`}
                          className="text-[13px] font-semibold text-slate-200 hover:text-white border border-white/20 hover:border-white/35 bg-white/5 px-3 py-1.5 rounded transition-colors"
                        >
                          + Add contact at {co.name}
                        </Link>
                        <Link
                          href={`/dashboard/companies/${co.id}/prep?stage=informal_meeting`}
                          className="text-[13px] font-semibold text-slate-300 hover:text-white border border-white/20 hover:border-white/35 bg-white/5 px-3 py-1.5 rounded transition-colors"
                        >
                          Prep a conversation
                        </Link>
                      </div>
                    ) : null}
                    {contact && !sig.outreach_draft && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/dashboard/contacts/${contact.id}/outreach`}
                          className="text-[13px] font-semibold text-emerald-100 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-300/35 px-3 py-1.5 rounded transition-colors"
                        >
                          Draft outreach to {contact.name}
                        </Link>
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
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Link
              href={safePage > 0 ? buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage - 1) }) : '#'}
              className={`text-[13px] font-semibold px-4 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 ${safePage === 0 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              Previous
            </Link>
            <span className="text-[13px] text-slate-300">
              Page {safePage + 1} of {totalPages}
            </span>
            <Link
              href={safePage < totalPages - 1 ? buildUrl({ company: companyFilter, type: typeFilter, page: String(safePage + 1) }) : '#'}
              className={`text-[13px] font-semibold px-4 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 ${safePage >= totalPages - 1 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              Next
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

