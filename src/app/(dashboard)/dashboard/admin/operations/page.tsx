import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { BOT_SCORE_THRESHOLD } from '@/lib/bot-detection/bot-signals'
import {
  ADMIN_DARK_ACTION_CARD,
  ADMIN_DARK_PAGE_BG,
  ADMIN_DARK_SECTION_CARD,
  ADMIN_DARK_STAT_CARD,
  ADMIN_DARK_TABLE_PANEL,
} from '../admin-dark-theme'

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

function roleBadge(role: string): string {
  if (role === 'owner') return 'bg-amber-500/15 text-amber-100 border border-amber-300/25'
  if (role === 'admin') return 'bg-sky-500/15 text-sky-100 border border-sky-300/25'
  return 'bg-white/10 text-slate-300 border border-white/10'
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
      <header className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Revenue</Link>
            <Link href="/dashboard/admin/product" className="text-[13px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Product</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-white leading-tight">Operations Hub</h1>
          <p className="text-[13px] text-slate-300 mt-1.5">Reliability, release quality, and monitoring operations.</p>
          <p className="text-[13px] text-slate-300 mt-1">
            Signed in as <span className="font-semibold text-slate-100">{user.email}</span>
            <span className={`ml-2 text-[13px] font-bold px-2 py-0.5 rounded ${roleBadge(staff.role)}`}>{staff.role}</span>
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
            <div key={card.label} className={ADMIN_DARK_STAT_CARD}>
              <div className="text-[24px] font-bold text-white leading-none capitalize">{card.value}</div>
              <div className="text-[13px] text-slate-300 mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
            </div>
          ))}
        </div>

        <div className={ADMIN_DARK_SECTION_CARD}>
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Role-based quick actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className={ADMIN_DARK_ACTION_CARD}>
                <p className="text-[13px] font-semibold text-white">{action.label}</p>
                <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className={ADMIN_DARK_TABLE_PANEL}>
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400">Operations alert panel</p>
            <Link href="/guide" className="text-[13px] text-slate-300 hover:text-white">Runbook {'->'}</Link>
          </div>
          {(recentAlerts ?? []).length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-slate-300">No open operations alerts.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {(recentAlerts ?? []).map((alert: { id: string; source_table: string; severity: string; message: string; created_at: string }) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-white">{alert.message}</p>
                    <span className={`text-[13px] font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'high' ? 'bg-red-500/15 text-red-100 border border-red-300/25' : alert.severity === 'medium' ? 'bg-amber-500/15 text-amber-100 border border-amber-300/25' : 'bg-white/10 text-slate-300 border border-white/10'
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="text-[13px] text-slate-400 mt-1 font-mono">{alert.source_table} - {new Date(alert.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

