import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Onboarding Video Runs - Admin' }

type RunsPageProps = {
  searchParams: Promise<{ runId?: string }>
}

type VideoRunRow = {
  id: string
  user_id: string
  provider: string
  provider_run_id: string | null
  trigger_source: string
  status: string
  retry_count: number
  max_retries: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  input_payload: Record<string, unknown>
  output_payload: Record<string, unknown>
  error_payload: Record<string, unknown>
}

type RunEventRow = {
  id: string
  event_type: string
  created_at: string
  event_payload: Record<string, unknown>
}

type WebhookEventRow = {
  id: string
  event_type: string
  event_status: string
  received_at: string
  processed_at: string | null
  error_message: string | null
  payload: Record<string, unknown>
}

function statusBadgeVariant(status: string): 'success' | 'info' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'completed') return 'success'
  if (status === 'processing') return 'info'
  if (status === 'queued') return 'warning'
  if (status === 'failed') return 'destructive'
  return 'secondary'
}

function compactJson(value: Record<string, unknown>): string {
  const keys = Object.keys(value ?? {})
  if (keys.length === 0) return '--'
  return JSON.stringify(value)
}

export default async function AdminOnboardingVideoRunsPage({ searchParams }: RunsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const params = await searchParams
  const selectedRunId = params.runId ?? ''

  const admin = createAdminClient()
  const { data: runsData } = await admin
    .from('onboarding_video_runs')
    .select('id, user_id, provider, provider_run_id, trigger_source, status, retry_count, max_retries, created_at, started_at, completed_at, input_payload, output_payload, error_payload')
    .order('created_at', { ascending: false })
    .limit(80)

  const runs = (runsData ?? []) as VideoRunRow[]
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null

  let runEvents: RunEventRow[] = []
  let webhookEvents: WebhookEventRow[] = []

  if (selectedRun) {
    const eventQuery = admin
      .from('onboarding_video_run_events')
      .select('id, event_type, created_at, event_payload')
      .eq('run_id', selectedRun.id)
      .order('created_at', { ascending: false })
      .limit(120)

    const webhookQuery = selectedRun.provider_run_id
      ? admin
        .from('onboarding_video_webhook_events')
        .select('id, event_type, event_status, received_at, processed_at, error_message, payload')
        .eq('provider_run_id', selectedRun.provider_run_id)
        .order('received_at', { ascending: false })
        .limit(80)
      : Promise.resolve({ data: [] as WebhookEventRow[] })

    const [{ data: eventRows }, { data: webhookRows }] = await Promise.all([
      eventQuery,
      webhookQuery,
    ])

    runEvents = (eventRows ?? []) as RunEventRow[]
    webhookEvents = (webhookRows ?? []) as WebhookEventRow[]
  }

  const summary = {
    total: runs.length,
    queued: runs.filter((run) => run.status === 'queued').length,
    processing: runs.filter((run) => run.status === 'processing').length,
    completed: runs.filter((run) => run.status === 'completed').length,
    failed: runs.filter((run) => run.status === 'failed').length,
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/operations" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Operations</Link>
            <Link href="/dashboard/admin/onboarding/qa" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Onboarding QA</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Onboarding Video Timeline</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Queue visibility for milestone-triggered tutorial videos, provider dispatch, retries, and webhooks.</p>
        </div>

        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <Card className="p-4"><p className="text-[24px] font-bold text-foreground">{summary.total}</p><p className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Runs</p></Card>
          <Card className="p-4"><p className="text-[24px] font-bold text-warning">{summary.queued}</p><p className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Queued</p></Card>
          <Card className="p-4"><p className="text-[24px] font-bold text-info">{summary.processing}</p><p className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Processing</p></Card>
          <Card className="p-4"><p className="text-[24px] font-bold text-success">{summary.completed}</p><p className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Completed</p></Card>
          <Card className="p-4"><p className="text-[24px] font-bold text-destructive">{summary.failed}</p><p className="text-[13px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Failed</p></Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">Recent runs</h2>
              <span className="text-[13px] text-muted-foreground">Showing {runs.length}</span>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[780px] text-[13px]">
                <TableHeader className="bg-muted text-muted-foreground">
                  <TableRow>
                    <TableHead className="px-4 text-left">Status</TableHead>
                    <TableHead className="px-4 text-left">Flow</TableHead>
                    <TableHead className="px-4 text-left">Event</TableHead>
                    <TableHead className="px-4 text-left">Provider</TableHead>
                    <TableHead className="px-4 text-left">User</TableHead>
                    <TableHead className="px-4 text-right">Retry</TableHead>
                    <TableHead className="px-4 text-left">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="px-4 py-4 text-muted-foreground">No onboarding video runs found.</TableCell>
                    </TableRow>
                  )}
                  {runs.map((run) => {
                    const flow = String(run.input_payload?.tutorial_flow ?? '--')
                    const eventName = String(run.input_payload?.event_name ?? run.trigger_source)
                    return (
                      <TableRow key={run.id} className={selectedRun?.id === run.id ? 'bg-primary/10' : ''}>
                        <TableCell className="px-4">
                          <Link href={`/dashboard/admin/onboarding/video?runId=${run.id}`}>
                            <Badge variant={statusBadgeVariant(run.status)}>{run.status}</Badge>
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground">{flow}</TableCell>
                        <TableCell className="px-4 text-muted-foreground">{eventName}</TableCell>
                        <TableCell className="px-4 text-muted-foreground">{run.provider}</TableCell>
                        <TableCell className="px-4 text-muted-foreground font-mono">{run.user_id.slice(0, 8)}...</TableCell>
                        <TableCell className="px-4 text-right text-muted-foreground">{run.retry_count}/{run.max_retries}</TableCell>
                        <TableCell className="px-4 text-muted-foreground">{new Date(run.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          <section className="space-y-5">
            <Card className="p-4">
              <h2 className="text-[13px] font-semibold text-foreground mb-3">Run detail</h2>
              {!selectedRun ? (
                <p className="text-[13px] text-muted-foreground">Select a run to inspect timeline details.</p>
              ) : (
                <div className="space-y-2 text-[13px]">
                  <p className="text-muted-foreground">Run: <span className="font-mono text-foreground">{selectedRun.id}</span></p>
                  <p className="text-muted-foreground">Provider run: <span className="font-mono text-foreground">{selectedRun.provider_run_id ?? '--'}</span></p>
                  <p className="text-muted-foreground">Started: {selectedRun.started_at ? new Date(selectedRun.started_at).toLocaleString() : '--'}</p>
                  <p className="text-muted-foreground">Completed: {selectedRun.completed_at ? new Date(selectedRun.completed_at).toLocaleString() : '--'}</p>
                  <p className="text-muted-foreground">Output: <span className="font-mono text-[13px] text-foreground break-all">{compactJson(selectedRun.output_payload ?? {})}</span></p>
                  <p className="text-muted-foreground">Error: <span className="font-mono text-[13px] text-foreground break-all">{compactJson(selectedRun.error_payload ?? {})}</span></p>
                  <Link href={`/api/admin/automation/onboarding/video-queue/${selectedRun.id}?include_events=1&include_webhooks=1`} className="inline-flex mt-2 text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-2">View JSON API response</Link>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-[13px] font-semibold text-foreground mb-3">Run event timeline</h3>
              {runEvents.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No run events for this selection.</p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {runEvents.map((event) => (
                    <li key={event.id} className="border border-border rounded px-3 py-2">
                      <p className="font-semibold text-foreground">{event.event_type}</p>
                      <p className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                      <p className="text-[13px] font-mono text-muted-foreground break-all mt-1">{compactJson(event.event_payload ?? {})}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-[13px] font-semibold text-foreground mb-3">Webhook timeline</h3>
              {webhookEvents.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No webhook events for this provider run yet.</p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {webhookEvents.map((event) => (
                    <li key={event.id} className="border border-border rounded px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{event.event_type}</p>
                        <Badge variant={event.event_status === 'processed' ? 'success' : 'warning'}>{event.event_status}</Badge>
                      </div>
                      <p className="text-muted-foreground">Received: {new Date(event.received_at).toLocaleString()}</p>
                      <p className="text-muted-foreground">Processed: {event.processed_at ? new Date(event.processed_at).toLocaleString() : '--'}</p>
                      {event.error_message && <p className="text-destructive text-[13px] mt-1">{event.error_message}</p>}
                      <p className="text-[13px] font-mono text-muted-foreground break-all mt-1">{compactJson(event.payload ?? {})}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

