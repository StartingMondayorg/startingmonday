import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'

type EventRow = {
  event_name: string
  created_at: string
  properties: unknown
}

type Channel = 'executives' | 'coaches' | 'outplacement' | 'search_firms'

type BenchmarkRow = {
  channel: Channel
  entryClicks: number
  personaSelections: number
  personaPerEntry: number
}

type QaRow = {
  label: string
  missingRate: number
}

function readProp(properties: unknown, key: string): string {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return ''
  const value = (properties as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

function pct(numerator: number, denominator: number): string {
  if (!denominator) return '0.0%'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

export const metadata = { title: 'Channel Benchmarks - Admin' }

export default async function ChannelBenchmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  // eslint-disable-next-line react-hooks/purity
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await admin
    .from('user_events')
    .select('event_name, created_at, properties')
    .in('event_name', ['channel_entry_clicked', 'persona_route_selected'])
    .gte('created_at', since30d)
    .limit(50000)

  const rows = (data ?? []) as EventRow[]

  const channelOrder: Channel[] = ['executives', 'coaches', 'outplacement', 'search_firms']
  const totalsByChannel = new Map<Channel, BenchmarkRow>()
  for (const channel of channelOrder) {
    totalsByChannel.set(channel, {
      channel,
      entryClicks: 0,
      personaSelections: 0,
      personaPerEntry: 0,
    })
  }

  const sourceSegments = new Map<string, number>()
  const variantSegments = new Map<string, number>()
  const personaSegments = new Map<string, number>()

  let totalEntryEvents = 0
  let entryMissingChannel = 0
  let entryMissingSource = 0

  let totalPersonaEvents = 0
  let personaMissingChannel = 0
  let personaMissingPersona = 0
  let personaMissingSource = 0
  let personaMissingTarget = 0

  for (const row of rows) {
    const channel = readProp(row.properties, 'channel') as Channel

    if (row.event_name === 'channel_entry_clicked') {
      totalEntryEvents += 1
      if (!channel) entryMissingChannel += 1
      if (!readProp(row.properties, 'source_page')) entryMissingSource += 1
      if (totalsByChannel.has(channel)) {
        totalsByChannel.get(channel)!.entryClicks += 1
      }
    }
    if (row.event_name === 'persona_route_selected') {
      totalPersonaEvents += 1
      const persona = readProp(row.properties, 'persona')
      if (!channel) personaMissingChannel += 1
      if (!persona) personaMissingPersona += 1
      if (!readProp(row.properties, 'source_route')) personaMissingSource += 1
      if (!readProp(row.properties, 'target_route')) personaMissingTarget += 1
      if (persona) personaSegments.set(persona, (personaSegments.get(persona) ?? 0) + 1)
      if (totalsByChannel.has(channel)) {
        totalsByChannel.get(channel)!.personaSelections += 1
      }
    }

    const source = readProp(row.properties, 'source_page') || 'unknown'
    sourceSegments.set(source, (sourceSegments.get(source) ?? 0) + 1)

    const variant = readProp(row.properties, 'experiment_variant') || 'unassigned'
    variantSegments.set(variant, (variantSegments.get(variant) ?? 0) + 1)
  }

  const benchmarkRows = channelOrder.map((channel) => {
    const row = totalsByChannel.get(channel)!
    return {
      ...row,
      personaPerEntry: row.entryClicks > 0 ? row.personaSelections / row.entryClicks : 0,
    }
  })

  const totalEntry = benchmarkRows.reduce((sum, row) => sum + row.entryClicks, 0)
  const totalPersona = benchmarkRows.reduce((sum, row) => sum + row.personaSelections, 0)

  const sourceRows = [...sourceSegments.entries()].sort((a, b) => b[1] - a[1])
  const variantRows = [...variantSegments.entries()].sort((a, b) => b[1] - a[1])
  const personaRows = [...personaSegments.entries()].sort((a, b) => b[1] - a[1])

  const qaRows: QaRow[] = [
    {
      label: 'Entry events missing channel',
      missingRate: totalEntryEvents > 0 ? entryMissingChannel / totalEntryEvents : 0,
    },
    {
      label: 'Entry events missing source_page',
      missingRate: totalEntryEvents > 0 ? entryMissingSource / totalEntryEvents : 0,
    },
    {
      label: 'Persona events missing channel',
      missingRate: totalPersonaEvents > 0 ? personaMissingChannel / totalPersonaEvents : 0,
    },
    {
      label: 'Persona events missing persona',
      missingRate: totalPersonaEvents > 0 ? personaMissingPersona / totalPersonaEvents : 0,
    },
    {
      label: 'Persona events missing source_route',
      missingRate: totalPersonaEvents > 0 ? personaMissingSource / totalPersonaEvents : 0,
    },
    {
      label: 'Persona events missing target_route',
      missingRate: totalPersonaEvents > 0 ? personaMissingTarget / totalPersonaEvents : 0,
    },
  ]

  const qaPass = qaRows.every((row) => row.missingRate < 0.02)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#020617_100%)] font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-300">Monday</span>
          </span>
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<h1 className="text-[26px] font-bold text-white leading-tight">Channel Benchmarks (30d)</h1>
        <p className="text-[13px] text-slate-300 mt-1.5 max-w-2xl">
          Authenticated cohort benchmark for Sprint 2 and Sprint 3 funnel telemetry. Use this to track channel entry volume, persona-route pull-through, source segmentation, and A/B variant distribution.
        </p>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 mb-6">
          <Card variant="glass" className="p-4">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-300">Entry clicks</p>
            <p className="text-[22px] font-bold text-white mt-1">{totalEntry}</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-300">Persona selections</p>
            <p className="text-[22px] font-bold text-white mt-1">{totalPersona}</p>
          </Card>
          <Card variant="glass" className="p-4">
            <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-slate-300">Persona per entry</p>
            <p className="text-[22px] font-bold text-white mt-1">{pct(totalPersona, totalEntry)}</p>
          </Card>
        </section>

        <Card variant="glass" className="p-0 mb-6">
          <div className="px-5 py-3 border-b border-white/10">
            <h2 className="text-[13px] font-semibold text-white">Channel funnel benchmark</h2>
          </div>
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-white/5 text-slate-300 hover:bg-white/5">
                <TableHead className="px-5 py-2 text-left text-slate-300">Channel</TableHead>
                <TableHead className="px-4 py-2 text-right text-slate-300">Entry clicks</TableHead>
                <TableHead className="px-4 py-2 text-right text-slate-300">Persona selections</TableHead>
                <TableHead className="px-5 py-2 text-right text-slate-300">Persona per entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarkRows.map((row) => (
                <TableRow key={row.channel} className="border-white/10 hover:bg-white/5">
                  <TableCell className="px-5 py-2 font-semibold text-slate-100">{row.channel}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-slate-200">{row.entryClicks}</TableCell>
                  <TableCell className="px-4 py-2 text-right text-slate-200">{row.personaSelections}</TableCell>
                  <TableCell className="px-5 py-2 text-right text-slate-200">{pct(row.personaSelections, row.entryClicks)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card variant="glass" className="p-5">
            <h2 className="text-[13px] font-semibold text-white mb-3">Source page segments</h2>
            <div className="space-y-2 text-[13px]">
              {sourceRows.length === 0 && <p className="text-slate-300">No events yet.</p>}
              {sourceRows.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-200">{source}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-5">
            <h2 className="text-[13px] font-semibold text-white mb-3">A/B variant segments</h2>
            <div className="space-y-2 text-[13px]">
              {variantRows.length === 0 && <p className="text-slate-300">No events yet.</p>}
              {variantRows.map(([variant, count]) => (
                <div key={variant} className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-200">{variant}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Card variant="glass" className="p-5">
            <h2 className="text-[13px] font-semibold text-white mb-3">Persona segment distribution</h2>
            <div className="space-y-2 text-[13px]">
              {personaRows.length === 0 && <p className="text-slate-300">No persona events yet.</p>}
              {personaRows.map(([persona, count]) => (
                <div key={persona} className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-200">{persona}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-white">Telemetry QA</h2>
              <Badge variant={qaPass ? 'success' : 'destructive'}>
                {qaPass ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-300 mb-3">Target: less than 2% missing required telemetry fields.</p>
            <div className="space-y-2 text-[13px]">
              {qaRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-200">{row.label}</span>
                  <Badge variant={row.missingRate < 0.02 ? 'success' : 'destructive'}>
                    {(row.missingRate * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}


