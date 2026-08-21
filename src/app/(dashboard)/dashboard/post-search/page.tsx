import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { postSearchDigestFrequency, resolveCareerMode } from '@/lib/career-mode'
import { buildRelationshipMaintenancePlan } from '@/lib/outreach/post-search-relationship-loop'
import { summarizeRelationshipNetwork } from '@/lib/outreach/relationship-infrastructure'
import { evaluateNarrativeHealth } from '@/lib/narrative-health'
import { buildAlwaysOnIntelligencePulse } from '@/lib/intelligence/always-on-intelligence'
import { Badge, Button, Card } from '@/components/ui'
export const metadata = { title: 'Career Intelligence Mode - Starting Monday' }

type ProfileRow = {
  full_name: string | null
  placed_at: string | null
  placement_company: string | null
  search_status: string | null
  briefing_frequency: string | null
  positioning_summary: string | null
  linkedin_headline: string | null
  linkedin_about: string | null
}

type SignalRow = {
  id: string
  signal_type: string
  signal_summary: string
  signal_date: string
  companies: { name: string } | null
}

export default async function PostSearchDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profileRaw }, { count: trackedCompanyCount }, { count: activeContactCount }, { data: rawSignals }, { data: rawPulseSignals }, { data: rawContacts }, { count: narrativeVersionCount }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, placed_at, placement_company, search_status, briefing_frequency, positioning_summary, linkedin_headline, linkedin_about')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('archived_at', null),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, signal_date, companies(name)')
      .eq('user_id', user.id)
      .order('signal_date', { ascending: false })
      .limit(5),
    supabase
      .from('company_signals')
      .select('id, signal_type, signal_summary, signal_date, companies(name)')
      .eq('user_id', user.id)
      .order('signal_date', { ascending: false })
      .limit(120),
    supabase
      .from('contacts')
      .select('contact_type, channel, title')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('narrative_versions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileRaw as ProfileRow | null
  const mode = resolveCareerMode({ placedAt: profile?.placed_at, searchStatus: profile?.search_status })
  if (mode !== 'post_search') redirect('/dashboard')

  const digestFrequency = postSearchDigestFrequency({ briefingFrequency: profile?.briefing_frequency })
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const recentSignals = (rawSignals ?? []) as unknown as SignalRow[]
  const pulseSignals = (rawPulseSignals ?? []) as unknown as SignalRow[]
  const relationshipPlan = buildRelationshipMaintenancePlan({ activeContacts: activeContactCount ?? 0 })
  const relationshipSummary = summarizeRelationshipNetwork((rawContacts ?? []) as Array<{ contact_type?: string | null; channel?: string | null; title?: string | null }>)
  const intelligencePulse = buildAlwaysOnIntelligencePulse(pulseSignals)
  const narrativeHealth = evaluateNarrativeHealth({
    positioningSummary: profile?.positioning_summary,
    linkedinHeadline: profile?.linkedin_headline,
    linkedinAbout: profile?.linkedin_about,
    narrativeVersionCount: narrativeVersionCount ?? 0,
  })

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Executive Career OS - Sprint 1</p>
        <h1 className="text-[30px] font-bold mb-3">Career Intelligence Mode</h1>
        <p className="text-[15px] text-muted-foreground mb-8">
          {profile?.placement_company
            ? `Welcome back, ${firstName}. Your placement at ${profile.placement_company} is logged. We are now in maintenance mode.`
            : `Welcome back, ${firstName}. Your search is marked complete, so this dashboard is now focused on always-on career intelligence.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card variant="glass" className="p-4">
            <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Tracked companies</p>
            <p className="text-[26px] font-semibold">{trackedCompanyCount ?? 0}</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Active contacts</p>
            <p className="text-[26px] font-semibold">{activeContactCount ?? 0}</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Digest cadence</p>
            <p className="text-[26px] font-semibold capitalize">{digestFrequency}</p>
          </Card>
        </div>

        <Card variant="glass" className="p-5 mb-8">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Relationship network health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Coverage score</p>
              <p className="text-[24px] font-semibold text-foreground">{relationshipSummary.coverageScore}</p>
            </Card>
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Covered types</p>
              <p className="text-[24px] font-semibold text-foreground">{relationshipSummary.coveredTypes}/5</p>
            </Card>
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Gap</p>
              <p className="text-[14px] font-semibold text-foreground leading-snug">{relationshipSummary.coverageGapLabel}</p>
            </Card>
          </div>
        </Card>

        <Card variant="glass" className="p-5 mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Narrative health</h2>
            <p className="text-[13px] tracking-[0.12em] text-muted-foreground">OS Sprint 3</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Narrative score</p>
              <p className="text-[24px] font-semibold text-foreground">{narrativeHealth.score}</p>
            </Card>
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Health band</p>
              <p className="text-[18px] font-semibold capitalize text-foreground">{narrativeHealth.band}</p>
            </Card>
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Versions captured</p>
              <p className="text-[24px] font-semibold text-foreground">{narrativeVersionCount ?? 0}</p>
            </Card>
          </div>
          {narrativeHealth.gaps.length > 0 && (
            <ul className="space-y-2 mb-4">
              {narrativeHealth.gaps.slice(0, 3).map((gap) => (
                <li key={gap} className="text-[13px] text-warning">- {gap}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/dashboard/profile" />}>
              Update positioning narrative
            </Button>
            <Button render={<Link href="/dashboard/positioning" />} variant="outline">
              Open positioning workspace
            </Button>
          </div>
        </Card>

        <Card variant="glass" className="p-5 mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-[13px] font-semibold text-foreground">Always-on intelligence pulse</h2>
            <p className="text-[13px] tracking-[0.12em] text-muted-foreground">OS Sprint 4</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Card variant="glass" className="bg-background/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Signals (30d)</p>
              <p className="text-[24px] font-semibold text-foreground">{intelligencePulse.signalsLast30Days}</p>
            </Card>
            <Card variant="glass" className="bg-background/50 px-4 py-3 sm:col-span-2">
              <p className="text-[13px] tracking-[0.12em] text-muted-foreground mb-1">Top signal clusters</p>
              {intelligencePulse.topSignalTypes.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No meaningful signal clusters in the last 30 days yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intelligencePulse.topSignalTypes.map((item) => (
                    <Badge key={item.type} variant="outline" className="bg-info/10 border-info/30 text-info">
                      {item.label}: {item.count}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>
          {intelligencePulse.topCompanies.length > 0 && (
            <ul className="space-y-2 mb-4">
              {intelligencePulse.topCompanies.map((company) => (
                <li key={company.companyName} className="text-[13px] text-muted-foreground">
                  {company.companyName}: {company.signalCount} signals in 30 days
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/dashboard/signals" />} variant="outline">
              Open full signal stream
            </Button>
            <Button render={<Link href="/dashboard/companies" />} variant="outline">
              Re-rank tracked companies
            </Button>
          </div>
        </Card>

        <Card variant="glass" className="p-5 mb-8">
          <p className="text-[13px] font-semibold text-foreground mb-3">Recent intelligence signals</p>
          {recentSignals.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No recent signals yet. Keep your target list active and we will keep monitoring.</p>
          ) : (
            <ul className="space-y-3">
              {recentSignals.map((signal) => (
                <li key={signal.id} className="border border-border rounded p-3">
                  <p className="text-[13px] text-foreground">{signal.signal_summary}</p>
                  <p className="text-[13px] text-muted-foreground mt-1">{signal.companies?.name ?? 'Target company'} - {signal.signal_date}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="glass" className="p-5 mb-8">
          <p className="text-[13px] font-semibold text-foreground mb-3">Relationship maintenance cadence</p>
          <ul className="space-y-3">
            {relationshipPlan.map((item) => (
              <li key={item.id} className="border border-border rounded p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] text-foreground">{item.title}</p>
                  <p className="text-[13px] text-muted-foreground capitalize">{item.cadence}</p>
                </div>
                <p className="text-[13px] font-semibold text-primary">Target: {item.targetCount}</p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard/contacts" />}>
            Maintain key relationships
          </Button>
          <Button render={<Link href="/dashboard/companies" />} variant="outline">
            Review tracked companies
          </Button>
          <Button render={<Link href="/settings/billing" />} variant="outline">
            Manage Monitor plan
          </Button>
        </div>
      </div>
    </div>
  )
}