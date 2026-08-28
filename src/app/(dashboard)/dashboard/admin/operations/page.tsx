import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { BOT_SCORE_THRESHOLD } from '@/lib/bot-detection/bot-signals'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Badge, Card } from '@/components/ui'
const OPS_ALERT_SOURCES = [
  'ci_check_runs',
  'lint_typecheck_runs',
  'test_execution_runs',
  'deployment_validation_runs',
  'runtime_health_check_runs',
  'scheduled_job_observability_runs',
  'error_monitoring_runs',
  'wedge_funnel_scorecard_cron_runs',
  'bot_traffic_runs',
]

function roleBadgeVariant(role: string): 'warning' | 'info' | 'secondary' {
  if (role === 'owner') return 'warning'
  if (role === 'admin') return 'info'
  return 'secondary'
}

export default async function AdminOperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()

  const botWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: openOpsAlerts },
    { data: recentAlerts },
    { data: latestDeploy },
    { data: latestRuntime },
    { data: latestJobObs },
    { count: suspectedBotRequests },
  ] = await Promise.all([
    admin.from('automation_alerts').select('id', { count: 'exact', head: true }).in('source_table', OPS_ALERT_SOURCES).eq('status', 'open'),
    admin.from('automation_alerts').select('id, source_table, severity, message, created_at').in('source_table', OPS_ALERT_SOURCES).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
    admin.from('deployment_validation_runs').select('status, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('runtime_health_check_runs').select('status, created_at, details').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('scheduled_job_observability_runs').select('job_name, status, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('bot_signal_events').select('id', { count: 'exact', head: true }).gte('bot_score', BOT_SCORE_THRESHOLD).gte('occurred_at', botWindowStart),
  ])

  const quickActions = staff.role === 'viewer'
    ? [
        { href: '/dashboard/admin/operations/bot-traffic', label: 'Review bot traffic', description: 'Automated traffic against public endpoints while captcha is paused.' },
        { href: '/dashboard/admin/traces', label: 'Inspect trace quality', description: 'Validate AI behavior and output consistency.' },
        { href: '/dashboard/admin/operations/wedge-cron', label: 'Review wedge cron history', description: 'Filter wedge scorecard run logs by status, date, and error code.' },
        { href: '/dashboard/admin/operations/wedge-economics', label: 'Review wedge economics ledgers', description: 'Inspect canonical CAC and partner commercial ledger rows.' },
        { href: '/guide', label: 'Use operations runbook', description: 'Follow incident and response procedures.' },
      ]
    : [
        { href: '/dashboard/admin/operations/bot-traffic', label: 'Review bot traffic', description: 'Automated traffic against public endpoints while captcha is paused.' },
        { href: '/dashboard/admin/traces', label: 'Audit reliability traces', description: 'Inspect quality and anomaly signatures.' },
        { href: '/dashboard/admin/operations/wedge-cron', label: 'Review wedge cron history', description: 'Drill into wedge cron failures and run-level diagnostics.' },
        { href: '/dashboard/admin/operations/wedge-economics', label: 'Maintain wedge economics ledgers', description: 'Write canonical marketing spend and partner commercial events.' },
        { href: '/guide', label: 'Execute SRE runbooks', description: 'Apply monitoring and incident playbooks.' },
        { href: '/dashboard/admin/team', label: 'Manage operational access', description: 'Ensure least-privilege admin coverage.' },
      ]

  const latestDeployStatus = (latestDeploy as { status?: string } | null)?.status ?? '--'
  const latestRuntimeStatus = (latestRuntime as { status?: string } | null)?.status ?? '--'
  const latestJobStatus = (latestJobObs as { status?: string } | null)?.status ?? '--'

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Revenue</Link>
            <Link href="/dashboard/admin/product" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Product</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Operations Hub</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Reliability, release quality, and monitoring operations.</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>
            <Badge variant={roleBadgeVariant(staff.role)} className="ml-2">{staff.role}</Badge>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Open ops alerts', value: openOpsAlerts ?? 0 },
            { label: 'Latest deploy status', value: latestDeployStatus },
            { label: 'Runtime health', value: latestRuntimeStatus },
            { label: 'Last job status', value: latestJobStatus },
            { label: 'Suspected bot req (24h)', value: suspectedBotRequests ?? 0 },
          ].map((card) => (
            <Card key={card.label} variant="glass" className="p-4">
              <div className="text-[24px] font-bold text-foreground leading-none capitalize">{card.value}</div>
              <div className="text-[13px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
            </Card>
          ))}
        </div>

        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Role-based quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card variant="glass" className="p-4 border-border bg-background/40 transition-colors">
                  <p className="text-[13px] font-semibold text-foreground">{action.label}</p>
                  <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{action.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Card>

        <Card variant="glass" className="overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Operations alert panel</p>
            <Link href="/guide" className="text-[13px] text-muted-foreground hover:text-foreground">Runbook {'->'}</Link>
          </div>
          {(recentAlerts ?? []).length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No open operations alerts.</p>
          ) : (
            <div className="divide-y divide-border">
              {(recentAlerts ?? []).map((alert: { id: string; source_table: string; severity: string; message: string; created_at: string }) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-foreground">{alert.message}</p>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'warning' : 'secondary'}>
                      {alert.severity}
                    </Badge>
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

