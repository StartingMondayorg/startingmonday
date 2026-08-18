import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { ROUTING_THRESHOLDS } from '@/lib/intelligence/lead-scoring'
import { runLeadScoringNow } from './actions'

type LeadRow = {
  id: string
  name: string
  title: string | null
  channel: string | null
  lead_score: number | null
  lead_tier: 'hot' | 'warm' | 'nurture' | null
  lead_queue: 'hot' | 'warm' | 'nurture' | null
  created_at: string
}

type LeadScoringRun = {
  id: string
  trigger: 'admin' | 'cron'
  status: 'success' | 'failed'
  processed: number
  updated: number
  error_message: string | null
  created_at: string
}

function ageBucket(days: number): '0-7d' | '8-30d' | '31-90d' | '91+d' {
  if (days <= 7) return '0-7d'
  if (days <= 30) return '8-30d'
  if (days <= 90) return '31-90d'
  return '91+d'
}

function channelLabel(value: string | null): string {
  if (!value) return 'Unknown'
  const v = value.toLowerCase()
  if (v === 'linkedin') return 'LinkedIn'
  if (v === 'referral') return 'Referral'
  if (v === 'recruiter') return 'Recruiter'
  if (v === 'cold') return 'Cold'
  if (v === 'inbound') return 'Inbound'
  if (v === 'event') return 'Event'
  return value
}

function scoreClass(score: number): string {
  if (score >= ROUTING_THRESHOLDS.hot) return 'text-red-100 bg-red-500/15 border-red-300/20'
  if (score >= ROUTING_THRESHOLDS.warm) return 'text-amber-100 bg-amber-500/15 border-amber-300/20'
  return 'text-slate-300 bg-white/10 border-white/10'
}

export const metadata = { title: 'CRM - Admin' }

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ scored?: string; processed?: string; updated?: string; error?: string }>
}) {
  const { scored, processed, updated, error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const { data: rawLeads } = await admin
    .from('contacts')
    .select('id, name, title, channel, lead_score, lead_tier, lead_queue, created_at')
    .eq('status', 'active')
    .order('lead_score', { ascending: false })
    .limit(2000)

  const { data: rawRuns } = await admin
    .from('lead_scoring_runs')
    .select('id, trigger, status, processed, updated, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  const leads = (rawLeads ?? []) as LeadRow[]
  const runs = (rawRuns ?? []) as LeadScoringRun[]
  const totalLeads = leads.length
  const requestHeaders = await headers()
  const headerTime = Date.parse(requestHeaders.get('date') ?? '')
  const fallbackTime = leads.length > 0 ? new Date(leads[0].created_at).getTime() : 0
  const referenceNow = Number.isNaN(headerTime) ? fallbackTime : headerTime

  const byChannel: Record<string, { count: number; topScore: number }> = {}
  const byAge: Record<'0-7d' | '8-30d' | '31-90d' | '91+d', { count: number; topScore: number; avgScore: number }> = {
    '0-7d': { count: 0, topScore: 0, avgScore: 0 },
    '8-30d': { count: 0, topScore: 0, avgScore: 0 },
    '31-90d': { count: 0, topScore: 0, avgScore: 0 },
    '91+d': { count: 0, topScore: 0, avgScore: 0 },
  }
  const queueCounts: Record<'hot' | 'warm' | 'nurture', number> = { hot: 0, warm: 0, nurture: 0 }

  for (const lead of leads) {
    const score = lead.lead_score ?? 0
    const key = channelLabel(lead.channel)
    if (!byChannel[key]) byChannel[key] = { count: 0, topScore: 0 }
    byChannel[key].count += 1
    byChannel[key].topScore = Math.max(byChannel[key].topScore, score)

    const days = Math.max(0, Math.floor((referenceNow - new Date(lead.created_at).getTime()) / 86_400_000))
    const bucket = ageBucket(days)
    byAge[bucket].count += 1
    byAge[bucket].topScore = Math.max(byAge[bucket].topScore, score)
    byAge[bucket].avgScore += score

    const queue = lead.lead_queue ?? 'nurture'
    queueCounts[queue] += 1
  }

  for (const key of Object.keys(byAge) as Array<keyof typeof byAge>) {
    const row = byAge[key]
    row.avgScore = row.count > 0 ? Math.round(row.avgScore / row.count) : 0
  }

  const topLeads = leads.slice(0, 12)
  const topChannels = Object.entries(byChannel)
    .sort((a, b) => b[1].topScore - a[1].topScore)
    .slice(0, 8)

  const sortedChannelTotals = Object.entries(byChannel)
    .sort((a, b) => b[1].count - a[1].count)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#020617_100%)] font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-300">Monday</span>
          </span>
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">CRM</h1>
            <p className="text-[13px] text-slate-300 mt-1.5">Lead score, channel mix, and queue routing dashboard.</p>
          </div>
          <form action={runLeadScoringNow}>
            <button
              type="submit"
              className="bg-slate-900 text-white text-[13px] font-semibold px-4 py-2 rounded cursor-pointer border-0"
            >
              Run Scoring Now
            </button>
          </form>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <h2 className="sr-only">Quick actions</h2>
          <Link href="/dashboard/contacts" className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md hover:border-white/30 transition-colors">
            <p className="text-[13px] font-semibold text-white">Open contacts</p>
            <p className="text-[13px] text-slate-300 mt-1">Review active contacts and outreach status.</p>
          </Link>
          <Link href="/dashboard/outreach" className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md hover:border-white/30 transition-colors">
            <p className="text-[13px] font-semibold text-white">Open outreach</p>
            <p className="text-[13px] text-slate-300 mt-1">Run sends and clear follow-up queue.</p>
          </Link>
          <Link href="/dashboard/admin/outreach-analytics" className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md hover:border-white/30 transition-colors">
            <p className="text-[13px] font-semibold text-white">Open analytics</p>
            <p className="text-[13px] text-slate-300 mt-1">Compare delivery and response trends.</p>
          </Link>
        </section>

        {scored === '1' && (
          <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
            Lead scoring completed. Processed {processed ?? '0'} leads and updated {updated ?? '0'} records.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error === 'forbidden'
              ? 'You do not have permission to run lead scoring.'
              : 'Lead scoring failed. Please try again or check server logs.'}
          </div>
        )}

        <section id="crm-run-log" className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-6 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <div className="px-6 py-[14px] border-b border-white/10">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Scoring execution log</h2>
          </div>
          {runs.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-slate-400">No scoring runs logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-left">
                    <th className="px-6 py-2.5 font-semibold text-slate-400">Time</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Trigger</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400 text-right">Processed</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400 text-right">Updated</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td className="px-6 py-3 text-slate-200">
                        {new Date(run.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-300 uppercase tracking-wide text-[13px]">{run.trigger}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[13px] font-semibold ${run.status === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{run.processed}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{run.updated}</td>
                      <td className="px-4 py-3 text-slate-300">{run.error_message ?? 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="crm-kpis" className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Total leads</p>
            <p className="text-[30px] font-bold text-white mt-2 leading-none">{totalLeads}</p>
          </div>
          <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-red-100">Hot queue</p>
            <p className="text-[30px] font-bold text-red-100 mt-2 leading-none">{queueCounts.hot}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-amber-100">Warm queue</p>
            <p className="text-[30px] font-bold text-amber-100 mt-2 leading-none">{queueCounts.warm}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-300">Nurture queue</p>
            <p className="text-[30px] font-bold text-slate-200 mt-2 leading-none">{queueCounts.nurture}</p>
          </div>
        </section>

        <section id="crm-channel-mix" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">Customers by channel</p>
            <div className="space-y-2">
              {sortedChannelTotals.map(([channel, stats]) => (
                <div key={channel} className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-200 font-medium">{channel}</span>
                  <span className="text-slate-300">{stats.count}</span>
                </div>
              ))}
              {sortedChannelTotals.length === 0 && (
                <p className="text-[13px] text-slate-400">No leads yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">Top score by channel</p>
            <div className="space-y-2">
              {topChannels.map(([channel, stats]) => (
                <div key={channel} className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-200 font-medium">{channel}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[13px] font-semibold ${scoreClass(stats.topScore)}`}>
                    {stats.topScore}
                  </span>
                </div>
              ))}
              {topChannels.length === 0 && (
                <p className="text-[13px] text-slate-400">No channel scoring data yet.</p>
              )}
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">Lead age cohorts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(byAge) as Array<keyof typeof byAge>).map((bucket) => (
              <div key={bucket} className="border border-white/10 rounded p-4">
                <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-400">{bucket}</p>
                <p className="text-[24px] font-bold text-white mt-1 leading-none">{byAge[bucket].count}</p>
                <p className="text-[13px] text-slate-300 mt-1">Avg score: {byAge[bucket].avgScore}</p>
                <p className="text-[13px] text-slate-300">Top score: {byAge[bucket].topScore}</p>
              </div>
            ))}
          </div>
        </div>

        <section id="crm-top-leads" className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-[14px] border-b border-white/10">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Top lead scores</h2>
          </div>
          {topLeads.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-slate-400">No scored leads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-left">
                    <th className="px-6 py-2.5 font-semibold text-slate-400">Name</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Title</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Channel</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400">Queue</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-400 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topLeads.map((lead) => {
                    const score = lead.lead_score ?? 0
                    return (
                      <tr key={lead.id}>
                        <td className="px-6 py-3 font-semibold text-white">{lead.name}</td>
                        <td className="px-4 py-3 text-slate-300">{lead.title ?? '\u2014'}</td>
                        <td className="px-4 py-3 text-slate-300">{channelLabel(lead.channel)}</td>
                        <td className="px-4 py-3 text-slate-300 capitalize">{lead.lead_queue ?? 'nurture'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[13px] font-semibold ${scoreClass(score)}`}>
                            {score}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}


