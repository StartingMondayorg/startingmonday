import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { WHITE_LABEL_TIERS, WHITE_LABEL_TRACKS, formatDollarAmount, formatWhiteLabelTierPrice, resolveWhiteLabelSettings } from '@/lib/white-label'
import { Badge, Card } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Firm Admin View | Starting Monday',
  description: 'Compare by book and by cohort to manage counselor load, quality, and program consistency.',
}

type PartnerRow = { id: string; name: string }
type PartnerWithWhiteLabelRow = {
  id: string
  name: string
  email: string | null
  user_id: string | null
  white_label_brand_name: string | null
  white_label_track_id: string | null
  white_label_tier_id: string | null
  white_label_primary_color: string | null
  white_label_accent_color: string | null
  white_label_support_email: string | null
  white_label_logo_url: string | null
}
type AttributionRow = { partner_id: string; signup_user_id: string; attributed_at: string }
type UserEventRow = { user_id: string; created_at: string }
type OutreachRow = { user_id: string; sent_at: string }
type FollowUpRow = { user_id: string; due_date: string; status: string; next_action_status: string }

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function toPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function cohortKeyFromIso(isoDate: string): string {
  const d = new Date(isoDate)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

function riskLabel(rate: number): 'on_track' | 'watch' | 'needs_attention' {
  if (rate >= 70) return 'on_track'
  if (rate >= 45) return 'watch'
  return 'needs_attention'
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length
  return Number(Math.sqrt(variance).toFixed(1))
}

export default async function FirmAdminViewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: partnerByUserRaw } = await admin
    .from('partners')
    .select('id, name, email, user_id, white_label_brand_name, white_label_track_id, white_label_tier_id, white_label_primary_color, white_label_accent_color, white_label_support_email, white_label_logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  const partnerByUser = (partnerByUserRaw ?? null) as PartnerWithWhiteLabelRow | null
  let partner = partnerByUser
  if (!partner && user.email) {
    const { data: partnerByEmailRaw } = await admin
      .from('partners')
      .select('id, name, email, user_id, white_label_brand_name, white_label_track_id, white_label_tier_id, white_label_primary_color, white_label_accent_color, white_label_support_email, white_label_logo_url')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle()
    partner = (partnerByEmailRaw ?? null) as PartnerWithWhiteLabelRow | null
    if (partner && !partner.user_id) {
      await admin.from('partners').update({ user_id: user.id }).eq('id', partner.id)
      partner.user_id = user.id
    }
  }

  const whiteLabelSettings = partner ? resolveWhiteLabelSettings({
    brandName: partner.white_label_brand_name ?? undefined,
    trackId: (partner.white_label_track_id ?? undefined) as 'executive_transition' | 'professional_transition' | undefined,
    tierId: (partner.white_label_tier_id ?? undefined) as 'solo' | 'boutique' | 'outplacement' | undefined,
    primaryColor: partner.white_label_primary_color ?? undefined,
    accentColor: partner.white_label_accent_color ?? undefined,
    supportEmail: partner.white_label_support_email ?? undefined,
    logoUrl: partner.white_label_logo_url,
    fallbackBrandName: partner.name,
    fallbackSupportEmail: partner.email,
  }) : null

  const { data: partnerOwnerRows } = await supabase
    .from('partners')
    .select('id, name')
    .eq('is_active', true)
    .eq('user_id', user.id)

  const { data: pilotRowsRaw } = await supabase
    .from('partner_pilots')
    .select('partner_name')
    .eq('program_owner_user_id', user.id)
    .limit(100)
  const pilotRows = (pilotRowsRaw ?? []) as Array<{ partner_name: string }>

  const pilotNames = Array.from(new Set(pilotRows.map((row) => row.partner_name).filter(Boolean)))
  const { data: pilotPartnerRows } = pilotNames.length > 0
    ? await supabase.from('partners').select('id, name').in('name', pilotNames)
    : { data: [] as PartnerRow[] }

  const partnerMap = new Map<string, PartnerRow>()
  for (const row of (partnerOwnerRows ?? []) as PartnerRow[]) partnerMap.set(row.id, row)
  for (const row of (pilotPartnerRows ?? []) as PartnerRow[]) partnerMap.set(row.id, row)

  const partners = Array.from(partnerMap.values())
  const partnerIds = partners.map((row) => row.id)

  const { data: attributions } = partnerIds.length > 0
    ? await supabase
      .from('referral_attributions')
      .select('partner_id, signup_user_id, attributed_at')
      .in('partner_id', partnerIds)
      .limit(200000)
    : { data: [] as AttributionRow[] }

  const attributedRows = (attributions ?? []) as AttributionRow[]
  const userIds = Array.from(new Set(attributedRows.map((row) => row.signup_user_id)))

  const since30 = isoDaysAgo(30)
  const since14 = isoDaysAgo(14)
  const nowIso = new Date().toISOString()

  const [eventsRes, outreachRes, followUpsRes] = userIds.length > 0
    ? await Promise.all([
      supabase.from('user_events').select('user_id, created_at').in('user_id', userIds).gte('created_at', since30).limit(200000),
      supabase.from('outreach_logs').select('user_id, sent_at').in('user_id', userIds).gte('sent_at', since30).limit(200000),
      supabase.from('follow_ups').select('user_id, due_date, status, next_action_status').in('user_id', userIds).limit(200000),
    ])
    : [
      { data: [] as UserEventRow[] },
      { data: [] as OutreachRow[] },
      { data: [] as FollowUpRow[] },
    ]

  const eventRows = (eventsRes.data ?? []) as UserEventRow[]
  const outreachRows = (outreachRes.data ?? []) as OutreachRow[]
  const followUpRows = (followUpsRes.data ?? []) as FollowUpRow[]

  const events14 = new Set(eventRows.filter((row) => row.created_at >= since14).map((row) => row.user_id))
  const outreach14 = new Set(outreachRows.filter((row) => row.sent_at >= since14).map((row) => row.user_id))
  const activeUsers = new Set<string>([...events14, ...outreach14])

  const overdueByUser = new Map<string, number>()
  for (const row of followUpRows) {
    const status = normalizeStatus(row.next_action_status || row.status)
    if (status === 'done' || status === 'completed' || status === 'sent') continue
    if (row.due_date < nowIso) {
      overdueByUser.set(row.user_id, (overdueByUser.get(row.user_id) ?? 0) + 1)
    }
  }

  const stalledUsers = new Set(
    userIds.filter((userId) => !events14.has(userId) && !outreach14.has(userId)),
  )

  const usersByPartner = new Map<string, Set<string>>()
  const usersByCohort = new Map<string, Set<string>>()
  const partnerNameById = new Map(partners.map((row) => [row.id, row.name]))

  for (const row of attributedRows) {
    const partnerName = partnerNameById.get(row.partner_id)
    if (!partnerName) continue
    const partnerSet = usersByPartner.get(row.partner_id) ?? new Set<string>()
    partnerSet.add(row.signup_user_id)
    usersByPartner.set(row.partner_id, partnerSet)

    const cohortKey = cohortKeyFromIso(row.attributed_at)
    const cohortMapKey = `${row.partner_id}::${cohortKey}`
    const cohortSet = usersByCohort.get(cohortMapKey) ?? new Set<string>()
    cohortSet.add(row.signup_user_id)
    usersByCohort.set(cohortMapKey, cohortSet)
  }

  const BOOK_ROWS = partners
    .map((partner) => {
      const scopedUsers = Array.from(usersByPartner.get(partner.id) ?? new Set<string>())
      const scopedCount = scopedUsers.length
      const activation = toPercent(scopedUsers.filter((id) => activeUsers.has(id)).length, scopedCount)
      const overdue = scopedUsers.reduce((sum, id) => sum + (overdueByUser.get(id) ?? 0), 0)
      const stalls = scopedUsers.filter((id) => stalledUsers.has(id)).length
      const cohortCount = Array.from(usersByCohort.keys()).filter((key) => key.startsWith(`${partner.id}::`)).length
      const note =
        stalls > 0
          ? `${stalls} stalled participant${stalls > 1 ? 's' : ''}; prioritize intervention cadence.`
          : overdue > 0
            ? `${overdue} overdue action${overdue > 1 ? 's' : ''}; monitor follow-up closure.`
            : 'Healthy momentum with no active stall flags.'

      return {
        book: partner.name,
        participants: scopedCount,
        cohorts: cohortCount,
        on_track: `${Math.round(activation)}%`,
        note,
      }
    })
    .sort((a, b) => b.participants - a.participants)

  const BENCHMARK_DEFINITIONS = [
    {
      metric: 'Activation rate',
      definition: 'Participants with user events or outreach activity in the trailing 14 days.',
    },
    {
      metric: 'Action velocity',
      definition: 'Outreach sends per participant per week in the trailing 30-day window.',
    },
    {
      metric: 'Cohort variance',
      definition: 'Standard deviation of cohort activation rates inside the same partner book.',
    },
  ]

  const PARTNER_BENCHMARK_ROWS = partners
    .map((partner) => {
      const cohortKeys = Array.from(usersByCohort.keys()).filter((key) => key.startsWith(`${partner.id}::`))
      const cohortActivations = cohortKeys
        .map((key) => {
          const cohortUsers = Array.from(usersByCohort.get(key) ?? new Set<string>())
          return toPercent(cohortUsers.filter((id) => activeUsers.has(id)).length, cohortUsers.length)
        })
      const avgActivation = Number(mean(cohortActivations).toFixed(1))
      const cohortVariance = stdDev(cohortActivations)
      const scopedUsers = Array.from(usersByPartner.get(partner.id) ?? new Set<string>())
      const stalled = scopedUsers.filter((id) => stalledUsers.has(id)).length
      const stalledRate = toPercent(stalled, scopedUsers.length)

      return {
        partnerName: partner.name,
        cohorts: cohortKeys.length,
        avgActivation,
        cohortVariance,
        stalledRate,
      }
    })
    .sort((a, b) => b.avgActivation - a.avgActivation)

  const COHORT_ROWS = Array.from(usersByCohort.entries())
    .map(([key, userSet]) => {
      const [partnerId, cohort] = key.split('::')
      const partnerName = partnerNameById.get(partnerId) ?? 'Unknown partner'
      const scopedUsers = Array.from(userSet)
      const scopedCount = scopedUsers.length
      const activeCount = scopedUsers.filter((id) => activeUsers.has(id)).length
      const activation = toPercent(activeCount, scopedCount)
      const actionRate = scopedCount > 0 ? Number((outreachRows.filter((row) => userSet.has(row.user_id)).length / scopedCount / (30 / 7)).toFixed(1)) : 0

      return {
        cohort: `${partnerName} · ${cohort}`,
        activation: `${Math.round(activation)}%`,
        action_rate: actionRate.toFixed(1),
        risk: riskLabel(activation),
      }
    })
    .sort((a, b) => Number(b.activation.replace('%', '')) - Number(a.activation.replace('%', '')))

  const openExceptions = Array.from(overdueByUser.values()).reduce((sum, value) => sum + value, 0) + stalledUsers.size
  const brandingSummary = [
    whiteLabelSettings ? `${whiteLabelSettings.brandName} brand layer` : 'Custom logo and colors per firm',
    whiteLabelSettings ? `${WHITE_LABEL_TRACKS.find((track) => track.id === whiteLabelSettings.trackId)?.label ?? 'Executive Transition'} track` : 'Partner-branded weekly digests',
    whiteLabelSettings ? `${WHITE_LABEL_TIERS.find((tier) => tier.id === whiteLabelSettings.tierId)?.name ?? 'Boutique'} tier` : 'Executive and professional transition tracks',
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard/outplacement" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <Link href="/dashboard/outplacement/operator" className="hover:text-primary-foreground transition-colors">Operator console</Link>
            <Link href="/dashboard/outplacement/counselor" className="hover:text-primary-foreground transition-colors">Counselor view</Link>
            <Link href="/dashboard/outplacement/enterprise" className="hover:text-primary-foreground transition-colors">Enterprise view</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="px-6 py-5">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">Firm admin view</p>
          <h1 className="text-[24px] font-bold text-foreground leading-tight">Compare by book and by cohort</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Practice leaders can compare counselor load, cohort consistency, and risk patterns without digging into individual participant records.
          </p>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Active books', value: String(partners.length) },
            { label: 'Cohorts in review', value: String(COHORT_ROWS.length) },
            { label: 'Open exceptions', value: String(openExceptions) },
          ].map((card) => (
            <Card key={card.label} className="p-4">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-[28px] font-bold text-foreground">{card.value}</p>
            </Card>
          ))}
        </section>

        <Card className="border-primary/30 p-5 space-y-5 shadow-md">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">White-label setup</p>
            <h2 className="text-[18px] font-bold text-foreground leading-tight">Partner-branded delivery for mixed-seniority transition programs</h2>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-3xl">
              This shared configuration layer keeps the core product consistent while letting each partner control branding, track language, and reporting depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {brandingSummary.map((item) => (
              <Card key={item} className="bg-muted p-4">
                <p className="text-[13px] font-semibold text-foreground">{item}</p>
              </Card>
            ))}
          </div>

          {whiteLabelSettings && (
            <Card className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Current saved configuration</p>
                  <p className="text-[14px] font-semibold text-foreground mt-1">{whiteLabelSettings.brandName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                  <Badge variant="outline" className="bg-muted">{whiteLabelSettings.primaryColor}</Badge>
                  <Badge variant="outline" className="bg-muted">{whiteLabelSettings.accentColor}</Badge>
                  <span>{whiteLabelSettings.supportEmail}</span>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-[12px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Tracks</h3>
              <div className="space-y-3">
                {WHITE_LABEL_TRACKS.map((track) => (
                  <div key={track.id} className="rounded-lg border border-border bg-muted p-3">
                    <p className="text-[13px] font-semibold text-foreground">{track.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">{track.summary}</p>
                    <p className="text-[12px] text-muted-foreground mt-2">Milestones: {track.defaultMilestones.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-[12px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Pricing</h3>
              <div className="space-y-3">
                {WHITE_LABEL_TIERS.map((tier) => (
                  <div key={tier.id} className="rounded-lg border border-border bg-muted p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-semibold text-foreground">{tier.name}</p>
                      <p className="text-[13px] font-semibold text-foreground">{formatWhiteLabelTierPrice(tier)}</p>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {tier.includedParticipants} included participants · {formatDollarAmount(tier.overageCents)}/participant overage
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-2">{tier.inclusions.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Card>

        <Card className="py-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Compare by book</h2>
          </div>
          <div className="divide-y divide-border">
            {BOOK_ROWS.length === 0 ? (
              <div className="px-5 py-4 text-[13px] text-muted-foreground">No partner books found for your scope yet.</div>
            ) : BOOK_ROWS.map((row) => (
              <div key={row.book} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.8fr] gap-3 px-5 py-4">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{row.book}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{row.note}</p>
                </div>
                <div className="text-[13px] text-muted-foreground">{row.participants} participants</div>
                <div className="text-[13px] text-muted-foreground">{row.cohorts} cohorts</div>
                <div className="text-[13px] font-semibold text-foreground">On track: {row.on_track}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="py-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Benchmark layer</h2>
            <p className="text-[12px] text-muted-foreground mt-1">Partner analytics for recurring cohort benchmarks and delivery variance checks.</p>
          </div>
          <div className="px-5 py-4 border-b border-border bg-muted">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BENCHMARK_DEFINITIONS.map((item) => (
                <Card key={item.metric} className="p-3">
                  <p className="text-[12px] font-semibold text-foreground">{item.metric}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{item.definition}</p>
                </Card>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {PARTNER_BENCHMARK_ROWS.length === 0 ? (
              <div className="px-5 py-4 text-[13px] text-muted-foreground">No benchmark rows available yet.</div>
            ) : PARTNER_BENCHMARK_ROWS.map((row) => (
              <div key={row.partnerName} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 items-center">
                <p className="text-[14px] font-semibold text-foreground">{row.partnerName}</p>
                <p className="text-[13px] text-muted-foreground">{row.cohorts} cohorts</p>
                <p className="text-[13px] text-muted-foreground">Avg activation {row.avgActivation.toFixed(1)}%</p>
                <p className="text-[13px] text-muted-foreground">Variance {row.cohortVariance.toFixed(1)}</p>
                <p className="text-[13px] text-muted-foreground">Stalled {row.stalledRate.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="py-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Compare by cohort</h2>
          </div>
          <div className="divide-y divide-border">
            {COHORT_ROWS.length === 0 ? (
              <div className="px-5 py-4 text-[13px] text-muted-foreground">No cohorts in review yet.</div>
            ) : COHORT_ROWS.map((row) => (
              <div key={row.cohort} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-4 items-center">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{row.cohort}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Review activation, action velocity, and narrative drift together.</p>
                </div>
                <div className="text-[13px] text-muted-foreground">Activation {row.activation}</div>
                <div className="text-[13px] text-muted-foreground">Actions {row.action_rate}/wk</div>
                <Badge
                  variant={row.risk === 'on_track' ? 'success' : row.risk === 'watch' ? 'warning' : 'destructive'}
                  className="capitalize justify-self-start"
                >
                  {row.risk}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
