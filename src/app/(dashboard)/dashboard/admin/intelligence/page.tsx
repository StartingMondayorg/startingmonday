import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { IntelligenceAdminClient } from './client'
import { SearchLagContextPanel } from './SearchLagContextPanel'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

type DiscoverSummary = {
  generatedEvents30d: number
  runCreatedEvents30d: number
  openedEvents30d: number
  outreachStarts30d: number
  recommendedContactsAdded30d: number
  addedCompanies30d: number
  recommendationCount30d: number
  avgFit30d: number
  peopleCoverage30d: number
  highConfidencePeopleCoverage30d: number
  narrativeOpenRate30d: number
  outreachStartRate30d: number
  suggestedPeopleAcceptanceRate30d: number
  watchlistAddRate30d: number
  watchlistLiftVsBaselinePct: number | null
}

export default async function AdminIntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString()
  const addRateBaseline = Number(process.env.DISCOVER_ADD_TO_WATCHLIST_BASELINE_RATE ?? '')
  const hasAddRateBaseline = Number.isFinite(addRateBaseline) && addRateBaseline > 0

  const [companiesRes, recommendationRowsRes, generatedEventsRes, runCreatedEventsRes, openedEventsRes, recommendationAddedEventsRes, outreachStartedEventsRes, companyAddedEventsRes, activeCampaignsRes, stalledCampaignsRes, dueFollowUpsRes, companyLagStatsRes, industryLagStatsRes, roleLagStatsRes] = await Promise.all([
    admin
      .from('intelligence_companies')
      .select('slug, company_name, sector, website, is_featured, created_at')
      .order('created_at', { ascending: false }),
    (admin as any)
      .from('company_recommendations')
      .select('fit, suggested_people, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500),
    (admin as any)
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'discover_recommendations_generated')
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'discover_run_created')
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'discover_recommendation_opened')
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'discover_recommendation_added')
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'discover_outreach_started')
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('user_events')
      .select('properties, created_at')
      .eq('event_name', 'company_added')
      .gte('created_at', thirtyDaysAgo)
      .limit(500),
    (admin as any)
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null)
      .in('stage', ['applied', 'interviewing', 'offer']),
    (admin as any)
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null)
      .lt('updated_at', new Date(Date.now() - 14 * 86400_000).toISOString()),
    (admin as any)
      .from('follow_ups')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().slice(0, 10)),
    (admin as any)
      .from('company_tenure_stats')
      .select('company_name, title_normalized, median_search_lag_days, sample_size, updated_at')
      .eq('stats_version', 'search-lag-stats-v1')
      .order('sample_size', { ascending: false })
      .limit(5),
    (admin as any)
      .from('industry_tenure_stats')
      .select('sic_code, company_stage, title_normalized, median_search_lag_days, sample_size, updated_at')
      .eq('stats_version', 'search-lag-stats-v1')
      .order('sample_size', { ascending: false })
      .limit(5),
    (admin as any)
      .from('search_lag_role_stats')
      .select('title_normalized, median_search_lag_days, p25_search_lag_days, p75_search_lag_days, sample_size, updated_at')
      .eq('stats_version', 'search-lag-stats-v1')
      .order('sample_size', { ascending: false })
      .limit(8),
  ])

  const companies = companiesRes.data ?? []
  const recommendationRows = (recommendationRowsRes.data ?? []) as Array<{ fit: number | null; suggested_people: unknown }>
  const companyAddedEvents = (companyAddedEventsRes.data ?? []) as Array<{ properties: { source?: string } | null }>

  let totalFit = 0
  let fitCount = 0
  let withPeople = 0
  let withHighConfidencePeople = 0

  for (const row of recommendationRows) {
    if (typeof row.fit === 'number') {
      totalFit += row.fit
      fitCount += 1
    }
    if (!Array.isArray(row.suggested_people) || row.suggested_people.length === 0) continue

    withPeople += 1
    const hasHighConfidence = row.suggested_people.some((person) => {
      const confidence = typeof (person as { confidence?: unknown })?.confidence === 'number'
        ? (person as { confidence: number }).confidence
        : 0
      return confidence >= 0.7
    })
    if (hasHighConfidence) withHighConfidencePeople += 1
  }

  const addedCompaniesFromDiscover = companyAddedEvents.filter((event) => {
    const source = event?.properties?.source
    return typeof source === 'string' && source.startsWith('discover')
  }).length

  const generatedEvents30d = generatedEventsRes.count ?? 0
  const runCreatedEvents30d = runCreatedEventsRes.count ?? 0
  const openedEvents30d = openedEventsRes.count ?? 0
  const outreachStarts30d = outreachStartedEventsRes.count ?? 0
  const recommendedContactsAdded30d = recommendationAddedEventsRes.count ?? 0

  const narrativeOpenRate30d = generatedEvents30d > 0 ? openedEvents30d / generatedEvents30d : 0
  const outreachStartRate30d = openedEvents30d > 0 ? outreachStarts30d / openedEvents30d : 0
  const suggestedPeopleAcceptanceRate30d = openedEvents30d > 0 ? recommendedContactsAdded30d / openedEvents30d : 0
  const watchlistAddRate30d = openedEvents30d > 0 ? addedCompaniesFromDiscover / openedEvents30d : 0
  const watchlistLiftVsBaselinePct = hasAddRateBaseline
    ? ((watchlistAddRate30d - addRateBaseline) / addRateBaseline) * 100
    : null

  const activeCampaigns = activeCampaignsRes.count ?? 0
  const stalledCampaigns = stalledCampaignsRes.count ?? 0
  const dueFollowUps = dueFollowUpsRes.count ?? 0
  const companyLagStats = companyLagStatsRes.data ?? []
  const industryLagStats = industryLagStatsRes.data ?? []
  const roleLagStats = roleLagStatsRes.data ?? []
  const lagUpdatedAt = [...companyLagStats, ...industryLagStats, ...roleLagStats]
    .map((row) => row.updated_at as string | null)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null

  const discoverSummary: DiscoverSummary = {
    generatedEvents30d,
    runCreatedEvents30d,
    openedEvents30d,
    outreachStarts30d,
    recommendedContactsAdded30d,
    addedCompanies30d: addedCompaniesFromDiscover,
    recommendationCount30d: recommendationRows.length,
    avgFit30d: fitCount > 0 ? totalFit / fitCount : 0,
    peopleCoverage30d: recommendationRows.length > 0 ? withPeople / recommendationRows.length : 0,
    highConfidencePeopleCoverage30d: recommendationRows.length > 0 ? withHighConfidencePeople / recommendationRows.length : 0,
    narrativeOpenRate30d,
    outreachStartRate30d,
    suggestedPeopleAcceptanceRate30d,
    watchlistAddRate30d,
    watchlistLiftVsBaselinePct,
  }

  const cadenceScore = Math.min(100, Math.round((discoverSummary.outreachStarts30d / 50) * 100))
  const followThroughScore = Math.max(0, 100 - Math.min(100, dueFollowUps * 2))
  const conversionScore = Math.max(0, Math.min(100, activeCampaigns * 2))
  const adminCampaignHealthScore = Math.round((cadenceScore * 0.4) + (followThroughScore * 0.35) + (conversionScore * 0.25))

  // Signal pipeline health (canonical event layer, last 30 days).
  type SourceMetricRow = {
    source_key: string
    classify_calls: number
    classify_failures: number
    signals_written: number
    signals_skipped: number
    events_created: number
    events_merged: number
  }
  const [sourceMetricsRes, eventsCreatedRes, eventsCorroboratedRes, dlqDepthRes] = await Promise.all([
    (admin as any)
      .from('source_run_metrics')
      .select('source_key, classify_calls, classify_failures, signals_written, signals_skipped, events_created, events_merged')
      .gte('run_started_at', thirtyDaysAgo)
      .limit(2000),
    (admin as any)
      .from('company_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo),
    (admin as any)
      .from('company_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)
      .gt('corroboration_count', 1),
    (admin as any)
      .from('ingest_dlq')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null),
  ])

  const sourceMetricRows: SourceMetricRow[] = (sourceMetricsRes?.data ?? []) as SourceMetricRow[]
  const pipelineBySource = new Map<string, SourceMetricRow>()
  for (const row of sourceMetricRows) {
    const existing = pipelineBySource.get(row.source_key)
    if (existing) {
      existing.classify_calls += row.classify_calls ?? 0
      existing.classify_failures += row.classify_failures ?? 0
      existing.signals_written += row.signals_written ?? 0
      existing.signals_skipped += row.signals_skipped ?? 0
      existing.events_created += row.events_created ?? 0
      existing.events_merged += row.events_merged ?? 0
    } else {
      pipelineBySource.set(row.source_key, { ...row })
    }
  }
  const pipelineSources = [...pipelineBySource.values()].sort((a, b) => b.signals_written - a.signals_written)
  const pipelineTotals = pipelineSources.reduce(
    (acc, row) => ({
      classifyCalls: acc.classifyCalls + row.classify_calls,
      classifyFailures: acc.classifyFailures + row.classify_failures,
      signalsWritten: acc.signalsWritten + row.signals_written,
      signalsSkipped: acc.signalsSkipped + row.signals_skipped,
      eventsCreated: acc.eventsCreated + row.events_created,
      eventsMerged: acc.eventsMerged + row.events_merged,
    }),
    { classifyCalls: 0, classifyFailures: 0, signalsWritten: 0, signalsSkipped: 0, eventsCreated: 0, eventsMerged: 0 },
  )
  const eventVolume = pipelineTotals.eventsCreated + pipelineTotals.eventsMerged
  const dedupMergeRate = eventVolume > 0 ? pipelineTotals.eventsMerged / eventVolume : 0
  const classifyFailureRate = pipelineTotals.classifyCalls > 0 ? pipelineTotals.classifyFailures / pipelineTotals.classifyCalls : 0
  const events30d = eventsCreatedRes?.count ?? 0
  const corroborated30d = eventsCorroboratedRes?.count ?? 0
  const corroborationRate = events30d > 0 ? corroborated30d / events30d : 0
  const dlqDepth = dlqDepthRes?.count ?? 0

  // Outcome labels (moat metrics).
  type OpeningRow = { label_source: string; canonical_company_id: string }
  type PrecursorRow = {
    event_type: string
    sector: string | null
    role_family: string | null
    n_events: number
    n_preceded: number
    hit_rate: number
    median_days_to_opening: number | null
  }
  const [openingsRes, labeledEventsRes, canonicalCompaniesRes, precursorRes] = await Promise.all([
    (admin as any)
      .from('role_openings')
      .select('label_source, canonical_company_id')
      .limit(5000),
    (admin as any)
      .from('event_outcome_labels')
      .select('id', { count: 'exact', head: true }),
    (admin as any)
      .from('canonical_companies')
      .select('id', { count: 'exact', head: true }),
    (admin as any)
      .from('precursor_stats')
      .select('event_type, sector, role_family, n_events, n_preceded, hit_rate, median_days_to_opening')
      .is('sector', null)
      .is('role_family', null)
      .gte('n_events', 5)
      .order('hit_rate', { ascending: false })
      .limit(5),
  ])

  const openingRows: OpeningRow[] = (openingsRes?.data ?? []) as OpeningRow[]
  const openingsBySource = openingRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.label_source] = (acc[row.label_source] ?? 0) + 1
    return acc
  }, {})
  const labeledCompanies = new Set(openingRows.map(r => r.canonical_company_id)).size
  const canonicalCompanyCount = canonicalCompaniesRes?.count ?? 0
  const labelCoverage = canonicalCompanyCount > 0 ? labeledCompanies / canonicalCompanyCount : 0
  const labeledEventCount = labeledEventsRes?.count ?? 0
  const topPrecursors: PrecursorRow[] = (precursorRes?.data ?? []) as PrecursorRow[]

  // For each company, fetch signal count and recent tokens
  const companyData = await Promise.all(
    (companies ?? []).map(async co => {
      const [{ count }, { data: tokens }] = await Promise.all([
        admin
          .from('company_signals')
          .select('id', { count: 'exact', head: true })
          .ilike('companies.name', co.company_name)
          .not('companies', 'is', null),
        admin
          .from('intelligence_access_tokens')
          .select('id, label, expires_at, created_at')
          .eq('company_slug', co.slug)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      return { ...co, signalCount: count ?? 0, tokens: tokens ?? [] }
    })
  )

  return (
    <main className="space-y-5">
      <h1 className="sr-only">Intelligence Admin</h1>
      <nav className="sr-only" aria-label="Intelligence admin quick actions">
        <Link href="/dashboard/admin">Back to admin home</Link>
        <Link href="/dashboard/admin/social">Open social admin</Link>
        <Link href="/dashboard/admin/speakers">Open speakers admin</Link>
      </nav>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <SearchLagContextPanel
          roleStats={roleLagStats}
          companyCohortCount={companyLagStats.length}
          lastUpdatedAt={lagUpdatedAt}
        />
        <Card className="p-5 sm:p-6 mb-5">
          <h2 className="text-[15px] font-bold text-foreground mb-3">Campaign health monitor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Health Score</div>
              <div className="text-[18px] font-bold text-foreground">{adminCampaignHealthScore}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Active Campaigns</div>
              <div className="text-[18px] font-bold text-foreground">{activeCampaigns}</div>
            </Card>
            <Card className="px-3 py-2.5 border-warning/30 bg-warning/10">
              <div className="text-[10px] tracking-[0.08em] text-warning font-bold">Stalled 14+ Days</div>
              <div className="text-[18px] font-bold text-warning">{stalledCampaigns}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Overdue Follow-ups</div>
              <div className="text-[18px] font-bold text-foreground">{dueFollowUps}</div>
            </Card>
          </div>
          <p className="text-[12px] text-muted-foreground mt-3">Monitor stalled campaign count daily and trigger outreach triage when stalled campaigns increase week over week.</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Discover conversion + quality (last 30 days)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Generated</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.generatedEvents30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Runs</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.runCreatedEvents30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Opened</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.openedEvents30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Contact Adds</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.recommendedContactsAdded30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Outreach Starts</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.outreachStarts30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Added</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.addedCompanies30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Avg Fit</div>
              <div className="text-[18px] font-bold text-foreground">{discoverSummary.avgFit30d.toFixed(1)}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">People Coverage</div>
              <div className="text-[18px] font-bold text-foreground">{Math.round(discoverSummary.peopleCoverage30d * 100)}%</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">High-Conf People</div>
              <div className="text-[18px] font-bold text-foreground">{Math.round(discoverSummary.highConfidencePeopleCoverage30d * 100)}%</div>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Narrative Open Rate</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[16px] font-bold text-foreground">{Math.round(discoverSummary.narrativeOpenRate30d * 100)}%</span>
                <Badge variant={discoverSummary.narrativeOpenRate30d >= 0.35 ? 'success' : 'warning'}>
                  {discoverSummary.narrativeOpenRate30d >= 0.35 ? 'On target' : 'Below target'}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Target: 35%+</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Outreach Start Rate</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[16px] font-bold text-foreground">{Math.round(discoverSummary.outreachStartRate30d * 100)}%</span>
                <Badge variant={discoverSummary.outreachStartRate30d >= 0.2 ? 'success' : 'warning'}>
                  {discoverSummary.outreachStartRate30d >= 0.2 ? 'On target' : 'Below target'}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Target: 20%+</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Suggested People Acceptance</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[16px] font-bold text-foreground">{Math.round(discoverSummary.suggestedPeopleAcceptanceRate30d * 100)}%</span>
                <Badge variant={discoverSummary.suggestedPeopleAcceptanceRate30d >= 0.15 ? 'success' : 'warning'}>
                  {discoverSummary.suggestedPeopleAcceptanceRate30d >= 0.15 ? 'On target' : 'Below target'}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Target: 15%+</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Add-to-Watchlist Lift</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[16px] font-bold text-foreground">
                  {discoverSummary.watchlistLiftVsBaselinePct === null ? 'N/A' : `${Math.round(discoverSummary.watchlistLiftVsBaselinePct)}%`}
                </span>
                {discoverSummary.watchlistLiftVsBaselinePct !== null && (
                  <Badge variant={discoverSummary.watchlistLiftVsBaselinePct >= 25 ? 'success' : 'warning'}>
                    {discoverSummary.watchlistLiftVsBaselinePct >= 25 ? 'On target' : 'Below target'}
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Target: +25% vs baseline</div>
            </Card>
          </div>

          <p className="text-[12px] text-muted-foreground mt-3">
            Open-to-add conversion: {discoverSummary.openedEvents30d > 0 ? Math.round((discoverSummary.addedCompanies30d / discoverSummary.openedEvents30d) * 100) : 0}%
            {discoverSummary.watchlistLiftVsBaselinePct === null ? ' (set DISCOVER_ADD_TO_WATCHLIST_BASELINE_RATE to enable lift calculation)' : ''}
          </p>
        </Card>

        <Card className="p-5 sm:p-6 mt-5">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Signal pipeline health (last 30 days)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Canonical Events</div>
              <div className="text-[18px] font-bold text-foreground">{events30d}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Dedup Merge Rate</div>
              <div className="text-[18px] font-bold text-foreground">{Math.round(dedupMergeRate * 100)}%</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Corroborated Events</div>
              <div className="text-[18px] font-bold text-foreground">{Math.round(corroborationRate * 100)}%</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Signals Written</div>
              <div className="text-[18px] font-bold text-foreground">{pipelineTotals.signalsWritten}</div>
            </Card>
            <Card className={`px-3 py-2.5 ${classifyFailureRate <= 0.03 ? '' : 'border-warning/30 bg-warning/10'}`}>
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Classify Failure Rate</div>
              <div className="text-[18px] font-bold text-foreground">{(classifyFailureRate * 100).toFixed(1)}%</div>
            </Card>
            <Card className={`px-3 py-2.5 ${dlqDepth <= 50 ? '' : 'border-warning/30 bg-warning/10'}`}>
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">DLQ Depth</div>
              <div className="text-[18px] font-bold text-foreground">{dlqDepth}</div>
            </Card>
          </div>

          {pipelineSources.length > 0 ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Source</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Classified</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Written</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Skipped</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Events New</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Events Merged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineSources.slice(0, 12).map(row => (
                    <TableRow key={row.source_key}>
                      <TableCell className="text-[12px] font-semibold text-foreground">{row.source_key}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.classify_calls}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.signals_written}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.signals_skipped}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.events_created}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.events_merged}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-3">No pipeline runs recorded yet. Metrics appear after the next signal-job run on the canonical event layer.</p>
          )}
        </Card>

        <Card className="p-5 sm:p-6 mt-5">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Outcome labels (prediction loop)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Role Openings</div>
              <div className="text-[18px] font-bold text-foreground">{openingRows.length}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Label Coverage</div>
              <div className="text-[18px] font-bold text-foreground">{Math.round(labelCoverage * 100)}%</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Labeled Events</div>
              <div className="text-[18px] font-bold text-foreground">{labeledEventCount}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Career Scan</div>
              <div className="text-[18px] font-bold text-foreground">{openingsBySource.career_scan ?? 0}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Exec Hire</div>
              <div className="text-[18px] font-bold text-foreground">{openingsBySource.exec_hire ?? 0}</div>
            </Card>
            <Card className="px-3 py-2.5">
              <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Proxy Diff</div>
              <div className="text-[18px] font-bold text-foreground">{openingsBySource.proxy_diff ?? 0}</div>
            </Card>
          </div>

          {topPrecursors.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Top precursors (90-day window, n ≥ 5), internal only</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Event Type</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">N</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Preceded</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Hit Rate</TableHead>
                    <TableHead className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold uppercase">Median Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPrecursors.map(row => (
                    <TableRow key={row.event_type}>
                      <TableCell className="text-[12px] font-semibold text-foreground">{row.event_type}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.n_events}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.n_preceded}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{(row.hit_rate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">{row.median_days_to_opening ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-3">No precursor stats yet. Aggregates appear after the nightly precursor-stats job runs with closed-window labeled events.</p>
          )}
        </Card>
      </section>

      <IntelligenceAdminClient
        companies={companyData}
        appUrl={APP_URL}
      />
    </main>
  )
}
