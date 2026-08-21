import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'Live Briefs - Starting Monday Admin' }

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  reviewing: 'bg-info/10 text-info',
  shortlisted: 'bg-info/10 text-info',
  scanning: 'bg-warning/10 text-warning',
  ready_for_review: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  revoked: 'bg-destructive/10 text-destructive',
  deleted: 'bg-muted text-muted-foreground',
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

type LiveBriefListClient = {
  from: (table: string) => {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: unknown[] | null }>
      }
    }
  }
}

export default async function LiveBriefsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient() as unknown as LiveBriefListClient
  const { data } = await admin
    .from('live_brief_requests')
    .select('id,prospect_name,prospect_email,request_received_at,request_source,status,consent_source,hubspot_contact_id,hubspot_sync_status')
    .order('request_received_at', { ascending: false })
    .limit(100)

  const requests = (data ?? []) as {
    id: string
    prospect_name: string
    prospect_email: string
    request_received_at: string
    request_source: string
    status: string
    consent_source: string
    hubspot_contact_id: string | null
    hubspot_sync_status: string
  }[]
  const statusCounts = requests.reduce<Record<string, number>>((counts, request) => {
    counts[request.status] = (counts[request.status] ?? 0) + 1
    return counts
  }, {})

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-[14px]">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">Admin</Link>
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Operator queue</p>
            <h1 className="mt-1 text-[26px] font-bold text-foreground">Live briefs</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{requests.length} request{requests.length === 1 ? '' : 's'} received</p>
          </div>
          <Link href="/dashboard/admin/live-briefs/new" className="shrink-0 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            New request
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {['draft', 'reviewing', 'scanning', 'delivered'].map((status) => (
            <Card key={status} className="p-3">
              <div className="text-[20px] font-bold text-foreground">{statusCounts[status] ?? 0}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label(status)}</div>
            </Card>
          ))}
        </div>

        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[14px] text-muted-foreground">No live brief requests yet.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">Prospect</TableHead>
                  <TableHead className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground sm:table-cell">Received</TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">Status</TableHead>
                  <TableHead className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground md:table-cell">Consent</TableHead>
                  <TableHead className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground lg:table-cell">CRM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <Link href={`/dashboard/admin/live-briefs/${request.id}`} className="text-[14px] font-semibold text-foreground hover:text-muted-foreground">{request.prospect_name}</Link>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{request.prospect_email}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label(request.request_source)}</div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 text-[12px] text-muted-foreground sm:table-cell">{dateLabel(request.request_received_at)}</TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${STATUS_STYLES[request.status] ?? STATUS_STYLES.draft}`}>
                        {label(request.status)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 text-[12px] text-muted-foreground md:table-cell">
                      <span className="text-success">Attested</span>
                      <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">{request.consent_source}</div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3.5 text-[12px] text-muted-foreground lg:table-cell">
                      {request.hubspot_contact_id ? <span className="text-success">Linked · {label(request.hubspot_sync_status)}</span> : <span className="text-muted-foreground">Not linked</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  )
}