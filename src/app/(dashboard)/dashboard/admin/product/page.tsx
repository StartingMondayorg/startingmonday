import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PRODUCT_ALERT_SOURCES = [
  'lead_scoring_runs',
  'usage_monitor_runs',
  'customer_health_checks',
  'support_issue_triage',
  'error_monitoring_runs',
]

function daysAgoIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function roleBadgeVariant(role: string): 'warning' | 'info' | 'secondary' {
  if (role === 'owner') return 'warning'
  if (role === 'admin') return 'info'
  return 'secondary'
}

function severityBadgeVariant(severity: string): 'destructive' | 'warning' | 'secondary' {
  if (severity === 'high') return 'destructive'
  if (severity === 'medium') return 'warning'
  return 'secondary'
}

export default async function AdminProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const since7d = daysAgoIso(7)

  const [
    { count: openProductAlerts },
    { data: recentAlerts },
    { count: openSupportIssues },
    { data: latestHealth },
    { count: traces7d },
  ] = await Promise.all([
    admin.from('automation_alerts').select('id', { count: 'exact', head: true }).in('source_table', PRODUCT_ALERT_SOURCES).eq('status', 'open'),
    admin.from('automation_alerts').select('id, source_table, severity, message, created_at').in('source_table', PRODUCT_ALERT_SOURCES).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
    admin.from('support_issue_triage').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('customer_health_checks').select('health_score, status, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('llm_traces').select('id', { count: 'exact', head: true }).gte('created_at', since7d),
  ])

  const quickActions = staff.role === 'viewer'
    ? [
        { href: '/dashboard/admin/product/catalog', label: 'Review micro-product catalog', description: 'Inspect pricing, bundles, and entitlement mapping.' },
        { href: '/dashboard/admin/intelligence', label: 'Review intelligence quality', description: 'Inspect signal quality and coverage trends.' },
        { href: '/dashboard/admin/traces', label: 'Review model traces', description: 'Observe output quality and rubric stability.' },
      ]
    : [
        { href: '/dashboard/admin/product/catalog', label: 'Manage micro-product catalog', description: 'Maintain prices, bundle templates, and partner entitlements.' },
        { href: '/dashboard/admin/intelligence', label: 'Tune intelligence pipelines', description: 'Adjust sources and targeting strategy.' },
        { href: '/dashboard/admin/traces', label: 'Run evals and quality checks', description: 'Audit model behavior and response quality.' },
        { href: '/dashboard/admin/feedback', label: 'Triages product feedback', description: 'Close top user pain points quickly.' },
      ]

  const latestHealthScore = (latestHealth as { health_score?: number } | null)?.health_score ?? '--'

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Revenue</Link>
            <Link href="/dashboard/admin/operations" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Operations</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-white leading-tight">Product Hub</h1>
          <p className="text-[13px] text-slate-300 mt-1.5">Product intelligence, quality controls, and customer signal operations.</p>
          <p className="text-[13px] text-slate-300 mt-1">
            Signed in as <span className="font-semibold text-slate-100">{user.email}</span>
            <Badge variant={roleBadgeVariant(staff.role)} className="ml-2">{staff.role}</Badge>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open product alerts', value: openProductAlerts ?? 0 },
            { label: 'Open support issues', value: openSupportIssues ?? 0 },
            { label: 'Latest health score', value: latestHealthScore },
            { label: 'LLM traces (7d)', value: traces7d ?? 0 },
          ].map((card) => (
            <Card key={card.label} variant="glass" className="p-4">
              <div className="text-[24px] font-bold text-white leading-none">{card.value}</div>
              <div className="text-[13px] text-slate-300 mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
            </Card>
          ))}
        </div>

        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Role-based quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="block rounded-xl border border-white/10 bg-slate-950/40 p-4 hover:border-white/30 transition-colors">
                <p className="text-[13px] font-semibold text-white">{action.label}</p>
                <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed">{action.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card variant="glass" className="p-0 mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Product alert panel</p>
            <Link href="/guide" className="text-[13px] text-slate-300 hover:text-white">Runbook {'->'}</Link>
          </div>
          {(recentAlerts ?? []).length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-slate-300">No open product alerts.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {(recentAlerts ?? []).map((alert: { id: string; source_table: string; severity: string; message: string; created_at: string }) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-white">{alert.message}</p>
                    <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="text-[13px] text-slate-400 mt-1 font-mono">{alert.source_table} - {new Date(alert.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

