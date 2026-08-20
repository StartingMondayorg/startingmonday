import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { sendWelcomeEmail } from './actions'
import { TIER_DISPLAY_NAMES } from '@/lib/billing/pricing'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'

type Filter = 'all' | 'trialing' | 'intelligence' | 'search' | 'executive'

const FILTER_LABELS: Record<Filter, string> = {
  all:         'All customers',
  trialing:    'Trialing',
  intelligence: TIER_DISPLAY_NAMES.passive,
  search:      TIER_DISPLAY_NAMES.active,
  executive:   TIER_DISPLAY_NAMES.executive,
}

const TIER_NAMES = TIER_DISPLAY_NAMES

type UserRow = {
  id: string
  email: string
  subscription_status: string
  subscription_tier: string | null
  created_at: string
  trial_ends_at: string | null
  signup_source: string | null
  first_company_added_at: string | null
}

function matchesFilter(u: UserRow, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'trialing') return u.subscription_status === 'trialing'
  if (filter === 'intelligence') return u.subscription_status === 'active' && u.subscription_tier === 'passive'
  if (filter === 'search')       return u.subscription_status === 'active' && u.subscription_tier === 'active'
  if (filter === 'executive')    return u.subscription_status === 'active' && u.subscription_tier === 'executive'
  return true
}

function daysLeft(trialEndsAt: string | null): string {
  if (!trialEndsAt) return '--'
  const diff = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Today'
  return `${diff}d`
}

function daysAgo(isoDate: string | undefined): string {
  if (!isoDate) return '--'
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d'
  return `${days}d`
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sent?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const { filter: rawFilter = 'all', sent } = await searchParams
  const filter: Filter = ['all', 'trialing', 'intelligence', 'search', 'executive'].includes(rawFilter)
    ? (rawFilter as Filter)
    : 'all'

  const admin = createAdminClient()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: allUsers }, { data: statsUsers }, { data: outreachRows }] = await Promise.all([
    // Filtered list for the table (trialing / active / past_due only)
    admin
      .from('users')
      .select('id, email, subscription_status, subscription_tier, created_at, trial_ends_at, signup_source, first_company_added_at')
      .in('subscription_status', ['trialing', 'active', 'past_due'])
      .order('created_at', { ascending: false }),
    // All users for conversion stats (includes canceled/inactive)
    admin
      .from('users')
      .select('id, subscription_status, subscription_tier, signup_source, created_at'),
    admin
      .from('outreach_logs')
      .select('user_id')
      .gte('sent_at', since7d),
  ])

  const outreachByUser: Record<string, number> = {}
  for (const row of outreachRows ?? []) {
    outreachByUser[row.user_id] = (outreachByUser[row.user_id] ?? 0) + 1
  }

  const users = (allUsers ?? []) as UserRow[]
  const allStatUsers = statsUsers ?? []

  // Activation score + last active per user
  const userIds = users.map(u => u.id)
  const since90d = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const [
    { data: profileRows },
    { data: companyRows },
    { data: briefRows },
    { data: contactRows },
    { data: followUpRows },
    { data: recentEventRows },
  ] = userIds.length > 0
    ? await Promise.all([
        admin.from('user_profiles').select('user_id, positioning_summary, briefing_time').in('user_id', userIds),
        admin.from('companies').select('user_id').in('user_id', userIds).is('archived_at', null),
        admin.from('briefs').select('user_id').in('user_id', userIds).eq('type', 'prep'),
        admin.from('contacts').select('user_id').in('user_id', userIds),
        admin.from('follow_ups').select('user_id').in('user_id', userIds),
        admin.from('user_events').select('user_id, created_at').in('user_id', userIds)
          .gte('created_at', since90d).order('created_at', { ascending: false }).limit(5000),
      ])
    : [
        { data: [] }, { data: [] }, { data: [] },
        { data: [] }, { data: [] }, { data: [] },
      ]

  const hasResume   = new Set(profileRows?.filter((p: { positioning_summary: string | null }) => (p.positioning_summary?.length ?? 0) >= 100).map((p: { user_id: string }) => p.user_id) ?? [])
  const hasBriefing = new Set(profileRows?.filter((p: { briefing_time: string | null }) => p.briefing_time).map((p: { user_id: string }) => p.user_id) ?? [])
  const hasCompany  = new Set(companyRows?.map((r: { user_id: string }) => r.user_id) ?? [])
  const hasBrief    = new Set(briefRows?.map((r: { user_id: string }) => r.user_id) ?? [])
  const hasContact  = new Set(contactRows?.map((r: { user_id: string }) => r.user_id) ?? [])
  const hasFollowUp = new Set(followUpRows?.map((r: { user_id: string }) => r.user_id) ?? [])

  const lastActiveMap: Record<string, string> = {}
  for (const e of (recentEventRows ?? []) as { user_id: string; created_at: string }[]) {
    if (!lastActiveMap[e.user_id]) lastActiveMap[e.user_id] = e.created_at
  }

  function activationScore(uid: string): number {
    return (hasResume.has(uid) ? 1 : 0) + (hasCompany.has(uid) ? 1 : 0) +
           (hasBrief.has(uid) ? 1 : 0) + (hasContact.has(uid) ? 1 : 0) +
           (hasBriefing.has(uid) ? 1 : 0) + (hasFollowUp.has(uid) ? 1 : 0)
  }

  // Conversion stats
  const converted = allStatUsers.filter(u => u.subscription_status === 'active').length
  const lapsed    = allStatUsers.filter(u => ['canceled', 'inactive'].includes(u.subscription_status)).length
  const trialing  = allStatUsers.filter(u => u.subscription_status === 'trialing').length
  const convRate  = (converted + lapsed) > 0
    ? Math.round((converted / (converted + lapsed)) * 100)
    : 0

  // Channel attribution (top sources among all users)
  const sourceMap: Record<string, number> = {}
  for (const u of allStatUsers) {
    const src = u.signup_source ?? 'direct'
    sourceMap[src] = (sourceMap[src] ?? 0) + 1
  }
  const topSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const counts = {
    all:          users.length,
    trialing:     users.filter(u => u.subscription_status === 'trialing').length,
    intelligence: users.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'passive').length,
    search:       users.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'active').length,
    executive:    users.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'executive').length,
  }

  const filteredUsers = users.filter(u => matchesFilter(u, filter))

  const statusBadgeVariant: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
    trialing:  'warning',
    active:    'success',
    past_due:  'destructive',
    canceled:  'secondary',
    inactive:  'secondary',
  }

  const cards: { filter: Filter; label: string; sublabel: string; accent: boolean }[] = [
    { filter: 'all',          label: String(counts.all),          sublabel: 'Active',        accent: false },
    { filter: 'trialing',     label: String(counts.trialing),     sublabel: 'Trialing',      accent: false },
    { filter: 'intelligence', label: String(counts.intelligence), sublabel: 'Monitor',  accent: false },
    { filter: 'search',       label: String(counts.search),       sublabel: 'Active',   accent: true  },
    { filter: 'executive',    label: String(counts.executive),    sublabel: 'Executive',     accent: false },
  ]

  const sendEmailAction = sendWelcomeEmail.bind(null)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#020617_100%)] font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-300">Monday</span>
          </span>
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-white leading-tight">Customers</h1>
          <p className="text-[13px] text-slate-300 mt-1.5">Trial and paid subscriber overview.</p>
        </div>

        {/* Conversion stats */}
        <Card variant="glass" className="p-6 mb-6">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-5">Conversion overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-[28px] font-bold text-white leading-none">{trialing}</p>
              <p className="text-[13px] text-slate-400 mt-1">Active trials</p>
            </div>
            <div>
              <p className="text-[28px] font-bold text-orange-300 leading-none">{converted}</p>
              <p className="text-[13px] text-slate-400 mt-1">Converted</p>
            </div>
            <div>
              <p className="text-[28px] font-bold text-white leading-none">{lapsed}</p>
              <p className="text-[13px] text-slate-400 mt-1">Lapsed</p>
            </div>
            <div>
              <p className="text-[28px] font-bold text-white leading-none">{convRate}%</p>
              <p className="text-[13px] text-slate-400 mt-1">Conv. rate</p>
              <p className="text-[13px] text-slate-300 mt-0.5">of closed trials</p>
            </div>
          </div>

          {/* Channel attribution */}
          <div className="border-t border-white/10 pt-5">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Signups by source</p>
            <div className="flex flex-wrap gap-2">
              {topSources.map(([src, count]) => (
                <Badge key={src} variant="outline" className="gap-1.5 text-[13px] bg-white/5 border-white/10 px-3 py-1.5">
                  <span className="font-semibold text-slate-200">{src}</span>
                  <span className="text-slate-400">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Stat cards */}
        <Tabs value={filter} className="mb-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-transparent p-0 h-auto w-full">
            {cards.map(card => (
              <TabsTrigger
                key={card.filter}
                value={card.filter}
                render={<Link href={`/dashboard/admin/customers?filter=${card.filter}`} />}
                className="flex-col items-start rounded h-auto p-5 border border-white/10 bg-white/5 hover:border-white/30 data-active:bg-orange-400 data-active:border-orange-300/30 data-active:shadow-none"
              >
                <div className={`text-[30px] font-bold leading-none text-white ${card.accent ? 'text-orange-300' : ''}`}>
                  {card.label}
                </div>
                <div className="text-[13px] mt-2 font-semibold tracking-wide text-slate-400">
                  {card.sublabel}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card variant="glass" className="p-0">
          <div className="px-6 py-[18px] border-b border-white/10">
            <span className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">
              {FILTER_LABELS[filter]} ({filteredUsers.length})
            </span>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-slate-400">No customers in this segment yet.</p>
          ) : (
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-white/5">
                  <TableHead className="px-6 py-2.5 font-semibold text-slate-400">Email</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Plan</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Status</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400">Joined</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-center hidden sm:table-cell">Score</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 hidden md:table-cell">Last active</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 hidden lg:table-cell">Source</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-center">Onboard</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-center">Co. added</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 hidden sm:table-cell">Trial ends</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-right hidden sm:table-cell">7d outreach</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-slate-400 text-right">Welcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => {
                  const wasSent = sent === u.id
                  return (
                    <TableRow key={u.id} className={wasSent ? 'bg-green-50' : undefined}>
                      <TableCell className="px-6 py-3 font-semibold text-white max-w-[180px] truncate">
                        {u.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-300">
                        {TIER_NAMES[u.subscription_tier ?? 'free'] ?? 'Free'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={statusBadgeVariant[u.subscription_status] ?? 'secondary'}>
                          {u.subscription_status.charAt(0).toUpperCase() + u.subscription_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center hidden sm:table-cell">
                        {(() => {
                          const score = activationScore(u.id)
                          const color = score >= 5 ? 'text-green-600' : score >= 3 ? 'text-amber-600' : 'text-slate-400'
                          return <span className={`font-bold ${color}`}>{score}/6</span>
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-300 hidden md:table-cell whitespace-nowrap">
                        {daysAgo(lastActiveMap[u.id])}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-400 font-mono text-[13px] hidden lg:table-cell">
                        {u.signup_source ?? '--'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {u.first_company_added_at
                          ? <span className="text-green-600 font-bold">&#10003;</span>
                          : <span className="text-slate-200">--</span>}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {u.first_company_added_at
                          ? <span className="text-green-600 font-bold">&#10003;</span>
                          : <span className="text-slate-200">--</span>}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-slate-300 hidden sm:table-cell whitespace-nowrap">
                        {u.subscription_status === 'trialing' ? daysLeft(u.trial_ends_at) : '--'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-slate-200 tabular-nums font-semibold hidden sm:table-cell">
                        {outreachByUser[u.id] ?? 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {wasSent ? (
                          <span className="text-[13px] font-bold text-green-700">Sent</span>
                        ) : (
                          <form action={sendEmailAction.bind(null, u.id, filter)}>
                            <Button type="submit" variant="outline" size="sm" className="whitespace-nowrap">
                              Send welcome
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>

      </main>
    </div>
  )
}


