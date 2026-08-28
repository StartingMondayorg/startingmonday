import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Badge, Card } from '@/components/ui'
const REVENUE_ALERT_SOURCES = [
  'plan_change_requests',
  'failed_payment_retry_runs',
  'payment_reconciliation_checks',
  'revenue_sync_runs',
  'revenue_mismatch_flags',
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

export default async function AdminRevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const since30d = daysAgoIso(30)

  const [
    { count: openRevenueAlerts },
    { data: recentAlerts },
    { count: openPlanChanges },
    { count: mismatches30d },
    { count: pendingRefunds },
  ] = await Promise.all([
    admin.from('automation_alerts').select('id', { count: 'exact', head: true }).in('source_table', REVENUE_ALERT_SOURCES).eq('status', 'open'),
    admin.from('automation_alerts').select('id, source_table, severity, message, created_at').in('source_table', REVENUE_ALERT_SOURCES).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
    admin.from('plan_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    admin.from('revenue_mismatch_flags').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('created_at', since30d),
    admin.from('refund_workflow_triggers').select('id', { count: 'exact', head: true }).eq('status', 'queued').gte('created_at', since30d),
  ])

  const quickActions = staff.role === 'viewer'
    ? [
        { href: '/dashboard/admin/customers', label: 'Review customer status', description: 'Monitor trialing, active, and churn risk.' },
        { href: '/dashboard/admin/outreach-analytics', label: 'Review revenue pipeline signals', description: 'Track outreach to conversion trendlines.' },
      ]
    : [
        { href: '/dashboard/admin/crm', label: 'Run CRM routing checks', description: 'Validate lead scoring and route quality.' },
        { href: '/dashboard/admin/customers', label: 'Manage customer lifecycle', description: 'Intervene on trial-to-paid and churn risk.' },
        { href: '/dashboard/admin/outreach-analytics', label: 'Tune outreach revenue funnel', description: 'Optimize channel and sequencing outputs.' },
      ]

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/product" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Product</Link>
            <Link href="/dashboard/admin/operations" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Operations</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Revenue Hub</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Revenue operations, customer conversion, and billing risk control.</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>
            <Badge variant={roleBadgeVariant(staff.role)} className="ml-2">{staff.role}</Badge>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open revenue alerts', value: openRevenueAlerts ?? 0 },
            { label: 'Pending plan changes', value: openPlanChanges ?? 0 },
            { label: 'Revenue mismatches (30d)', value: mismatches30d ?? 0 },
            { label: 'Queued refunds (30d)', value: pendingRefunds ?? 0 },
          ].map((card) => (
            <Card key={card.label} variant="glass" className="p-4">
              <div className="text-[24px] font-bold text-foreground leading-none">{card.value}</div>
              <div className="text-[13px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
            </Card>
          ))}
        </div>

        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Role-based quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="block rounded-xl border border-border bg-background/40 p-4 transition-colors">
                <p className="text-[13px] font-semibold text-foreground">{action.label}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{action.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card variant="glass" className="p-0 mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Revenue alert panel</p>
            <Link href="/guide" className="text-[13px] text-muted-foreground hover:text-foreground">Runbook {'->'}</Link>
          </div>
          {(recentAlerts ?? []).length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No open revenue alerts.</p>
          ) : (
            <div className="divide-y divide-border">
              {(recentAlerts ?? []).map((alert: { id: string; source_table: string; severity: string; message: string; created_at: string }) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-foreground">{alert.message}</p>
                    <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1 font-mono">{alert.source_table} - {new Date(alert.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

