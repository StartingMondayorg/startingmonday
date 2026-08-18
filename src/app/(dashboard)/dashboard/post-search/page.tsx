import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { postSearchDigestFrequency, resolveCareerMode } from '@/lib/career-mode'
import { buildRelationshipMaintenancePlan } from '@/lib/post-search-relationship-loop'
import { summarizeRelationshipNetwork } from '@/lib/relationship-infrastructure'
import { evaluateNarrativeHealth } from '@/lib/narrative-health'
import { buildAlwaysOnIntelligencePulse } from '@/lib/intelligence/always-on-intelligence'

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
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-400 mb-2">Executive Career OS - Sprint 1</p>
        <h1 className="text-[30px] font-bold mb-3">Career Intelligence Mode</h1>
        <p className="text-[15px] text-slate-300 mb-8">
          {profile?.placement_company
            ? `Welcome back, ${firstName}. Your placement at ${profile.placement_company} is logged. We are now in maintenance mode.`
            : `Welcome back, ${firstName}. Your search is marked complete, so this dashboard is now focused on always-on career intelligence.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Tracked companies</p>
            <p className="text-[26px] font-semibold">{trackedCompanyCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Active contacts</p>
            <p className="text-[26px] font-semibold">{activeContactCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Digest cadence</p>
            <p className="text-[26px] font-semibold capitalize">{digestFrequency}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 mb-8">
          <h2 className="text-[13px] font-semibold text-slate-200 mb-3">Relationship network health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Coverage score</p>
              <p className="text-[24px] font-semibold text-slate-100">{relationshipSummary.coverageScore}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Covered types</p>
              <p className="text-[24px] font-semibold text-slate-100">{relationshipSummary.coveredTypes}/5</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Gap</p>
              <p className="text-[14px] font-semibold text-slate-100 leading-snug">{relationshipSummary.coverageGapLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-[13px] font-semibold text-slate-200">Narrative health</h2>
            <p className="text-[13px] tracking-[0.12em] text-slate-400">OS Sprint 3</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Narrative score</p>
              <p className="text-[24px] font-semibold text-slate-100">{narrativeHealth.score}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Health band</p>
              <p className="text-[18px] font-semibold capitalize text-slate-100">{narrativeHealth.band}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Versions captured</p>
              <p className="text-[24px] font-semibold text-slate-100">{narrativeVersionCount ?? 0}</p>
            </div>
          </div>
          {narrativeHealth.gaps.length > 0 && (
            <ul className="space-y-2 mb-4">
              {narrativeHealth.gaps.slice(0, 3).map((gap) => (
                <li key={gap} className="text-[13px] text-amber-300">- {gap}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/profile" className="px-4 py-2 rounded bg-orange-500 text-slate-900 text-[13px] font-semibold hover:bg-orange-400">
              Update positioning narrative
            </Link>
            <Link href="/dashboard/positioning" className="px-4 py-2 rounded border border-slate-700 text-[13px] font-semibold text-slate-300 hover:border-slate-500">
              Open positioning workspace
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-[13px] font-semibold text-slate-200">Always-on intelligence pulse</h2>
            <p className="text-[13px] tracking-[0.12em] text-slate-400">OS Sprint 4</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Signals (30d)</p>
              <p className="text-[24px] font-semibold text-slate-100">{intelligencePulse.signalsLast30Days}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-950/50 px-4 py-3 sm:col-span-2">
              <p className="text-[13px] tracking-[0.12em] text-slate-500 mb-1">Top signal clusters</p>
              {intelligencePulse.topSignalTypes.length === 0 ? (
                <p className="text-[13px] text-slate-400">No meaningful signal clusters in the last 30 days yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intelligencePulse.topSignalTypes.map((item) => (
                    <span key={item.type} className="px-2 py-1 rounded bg-cyan-950/50 border border-cyan-900 text-[13px] text-cyan-200">
                      {item.label}: {item.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {intelligencePulse.topCompanies.length > 0 && (
            <ul className="space-y-2 mb-4">
              {intelligencePulse.topCompanies.map((company) => (
                <li key={company.companyName} className="text-[13px] text-slate-300">
                  {company.companyName}: {company.signalCount} signals in 30 days
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/signals" className="px-4 py-2 rounded border border-slate-700 text-[13px] font-semibold text-slate-300 hover:border-slate-500">
              Open full signal stream
            </Link>
            <Link href="/dashboard/companies" className="px-4 py-2 rounded border border-slate-700 text-[13px] font-semibold text-slate-300 hover:border-slate-500">
              Re-rank tracked companies
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 mb-8">
          <p className="text-[13px] font-semibold text-slate-200 mb-3">Recent intelligence signals</p>
          {recentSignals.length === 0 ? (
            <p className="text-[13px] text-slate-400">No recent signals yet. Keep your target list active and we will keep monitoring.</p>
          ) : (
            <ul className="space-y-3">
              {recentSignals.map((signal) => (
                <li key={signal.id} className="border border-slate-800 rounded p-3">
                  <p className="text-[13px] text-slate-200">{signal.signal_summary}</p>
                  <p className="text-[13px] text-slate-500 mt-1">{signal.companies?.name ?? 'Target company'} - {signal.signal_date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 mb-8">
          <p className="text-[13px] font-semibold text-slate-200 mb-3">Relationship maintenance cadence</p>
          <ul className="space-y-3">
            {relationshipPlan.map((item) => (
              <li key={item.id} className="border border-slate-800 rounded p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] text-slate-200">{item.title}</p>
                  <p className="text-[13px] text-slate-500 capitalize">{item.cadence}</p>
                </div>
                <p className="text-[13px] font-semibold text-orange-300">Target: {item.targetCount}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/contacts" className="px-4 py-2 rounded bg-orange-500 text-slate-900 text-[13px] font-semibold hover:bg-orange-400">
            Maintain key relationships
          </Link>
          <Link href="/dashboard/companies" className="px-4 py-2 rounded border border-slate-700 text-[13px] font-semibold text-slate-300 hover:border-slate-500">
            Review tracked companies
          </Link>
          <Link href="/settings/billing" className="px-4 py-2 rounded border border-slate-700 text-[13px] font-semibold text-slate-300 hover:border-slate-500">
            Manage Monitor plan
          </Link>
        </div>
      </div>
    </div>
  )
}