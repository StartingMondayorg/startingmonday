import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'

type CustomerRow = {
  id: string
  email: string | null
  signup_source: string | null
  subscription_status: string | null
  subscription_tier: string | null
  created_at: string
}

type ChannelBreakdown = {
  channel: string
  total: number
  active: number
  trialing: number
  paused: number
  canceled: number
}

export const metadata: Metadata = {
  title: 'Mauricio Customer Email By Channel - Starting Monday',
  description: 'Weekly customer email and outcome view by acquisition channel for Mauricio.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://startingmonday.app/mauricio-kickoff-execution/customer-email-by-channel' },
}

function normalizeChannel(value: string | null): string {
  const cleaned = (value ?? '').trim().toLowerCase()
  if (!cleaned) return 'unknown'
  if (cleaned === 'linkedin') return 'linkedin'
  if (cleaned === 'email') return 'email'
  if (cleaned === 'referral') return 'referral'
  if (cleaned === 'partner') return 'partner'
  if (cleaned === 'organic') return 'organic'
  return cleaned
}

function makeBreakdown(rows: CustomerRow[]): ChannelBreakdown[] {
  const map = new Map<string, ChannelBreakdown>()

  for (const row of rows) {
    const channel = normalizeChannel(row.signup_source)
    const status = (row.subscription_status ?? '').trim().toLowerCase()

    const existing = map.get(channel) ?? {
      channel,
      total: 0,
      active: 0,
      trialing: 0,
      paused: 0,
      canceled: 0,
    }

    existing.total += 1
    if (status === 'active') existing.active += 1
    if (status === 'trialing') existing.trialing += 1
    if (status === 'paused') existing.paused += 1
    if (status === 'canceled') existing.canceled += 1

    map.set(channel, existing)
  }

  return [...map.values()].sort((a, b) => b.total - a.total)
}

export default async function MauricioCustomerEmailByChannelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const { data: customerRows } = await admin
    .from('users')
    .select('id, email, signup_source, subscription_status, subscription_tier, created_at')
    .in('subscription_status', ['active', 'trialing', 'paused', 'canceled'])
    .order('created_at', { ascending: false })
    .limit(1000)

  const rows = (customerRows ?? []) as CustomerRow[]
  const breakdown = makeBreakdown(rows)

  const activeCount = rows.filter((r) => r.subscription_status === 'active').length
  const trialingCount = rows.filter((r) => r.subscription_status === 'trialing').length

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.18em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/mauricio-kickoff-execution" className="text-[13px] text-slate-300 hover:text-white">
            Back to Mauricio workspace
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <header className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-700 mb-2">Weekly report view</p>
          <h1 className="text-[24px] font-bold text-slate-900 mb-2">Customer email outcomes by channel</h1>
          <p className="text-[13px] text-slate-600 max-w-4xl">
            This page is organized for quick weekly review: channel mix, customer outcomes, and a recent customer list.
            Use it to decide which channels should be scaled, fixed, or paused.
          </p>
          <p className="mt-3 text-[13px] text-slate-600">
            Confidential customer reporting view. Weekly target outcome: improve channel conversion while reducing canceled accounts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/mauricio-kickoff-execution"
              className="inline-flex items-center rounded border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800 hover:bg-slate-100"
            >
              Open Mauricio workspace
            </Link>
            <Link
              href="/mauricio-kickoff-execution/provider-read-access"
              className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open provider read-access viewer
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Tracked customers</p>
            <p className="text-[24px] font-bold text-slate-900 mt-1">{rows.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Active</p>
            <p className="text-[24px] font-bold text-slate-900 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Trialing</p>
            <p className="text-[24px] font-bold text-slate-900 mt-1">{trialingCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[13px] uppercase tracking-[0.1em] text-slate-500">Channels observed</p>
            <p className="text-[24px] font-bold text-slate-900 mt-1">{breakdown.length}</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-[13px] font-semibold text-slate-900">Outcome summary by channel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Channel</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Total</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Active</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Trialing</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Paused</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Canceled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdown.map((item) => (
                  <tr key={item.channel}>
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-900">{item.channel}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{item.total}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{item.active}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{item.trialing}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{item.paused}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{item.canceled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-[13px] font-semibold text-slate-900">Recent customer emails (latest 100)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Email</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Channel</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Outcome</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Tier</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 100).map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{row.email ?? '\u2014'}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{normalizeChannel(row.signup_source)}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{row.subscription_status ?? '\u2014'}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{row.subscription_tier ?? '\u2014'}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{new Date(row.created_at).toLocaleDateString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
