import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata: Metadata = {
  title: 'Feedback Admin - Dashboard',
  description: 'Manage user feedback, track SLAs, and update statuses.',
  robots: { index: false, follow: false },
}

const STATUS_BADGE_VARIANT: Record<string, 'secondary' | 'info' | 'outline' | 'warning' | 'success' | 'destructive'> = {
  new: 'secondary',
  under_review: 'info',
  planned: 'outline',
  in_progress: 'warning',
  shipped: 'success',
  declined: 'destructive',
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  ui_ux: 'UI/UX',
  performance: 'Performance',
  other: 'Other',
}

type FeedbackMetric = {
  id: string
  title: string
  category: string
  status: string
  vote_count: number
  created_at: string
  user_profiles?: { full_name?: string | null } | null
  feedback_comments?: Array<{ count?: number | null }> | null
  first_staff_response_at?: string | null
  status_decided_at?: string | null
  hoursOld: number
  timeToFirstResponse: number | null
  timeToDecision: number | null
  exceeds24h: boolean
  exceeds7d: boolean
}

type StaffMembersQuery = {
  select: (columns: string) => {
    eq: (column: string, value: unknown) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: { id: string } | null }>
      }
    }
  }
}

type FeedbackMetricRow = Omit<FeedbackMetric, 'hoursOld' | 'timeToFirstResponse' | 'timeToDecision' | 'exceeds24h' | 'exceeds7d'>

export default async function FeedbackAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check staff status
  const staffQuery = supabase.from('staff_members') as unknown as StaffMembersQuery
  const { data: staffMember } = await staffQuery
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Staff only.</p>
          <Link href="/dashboard" className="text-primary mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Fetch feedback items with stats
  const { data: feedbackItems, error } = await supabase
    .from('feedback_items')
    .select(`
      *,
      user_profiles:user_id(full_name, email),
      feedback_comments(count),
      feedback_status_history(count)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching feedback:', error)
  }

  // Calculate SLA metrics
  const now = new Date()
  const metricRows = (feedbackItems || []) as unknown as FeedbackMetricRow[]
  const metrics: FeedbackMetric[] = metricRows.map((item) => {
    const createdAt = new Date(item.created_at)
    const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    const firstResponseAt = item.first_staff_response_at ? new Date(item.first_staff_response_at) : null
    const timeToFirstResponse = firstResponseAt
      ? (firstResponseAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      : null

    const statusDecidedAt = item.status_decided_at ? new Date(item.status_decided_at) : null
    const timeToDecision = statusDecidedAt
      ? (statusDecidedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      : null

    return {
      ...item,
      hoursOld,
      timeToFirstResponse,
      timeToDecision,
      exceeds24h: item.status === 'new' && hoursOld > 24,
      exceeds7d: item.status !== 'shipped' && item.status !== 'declined' && hoursOld > 168,
    }
  })

  // Count items by status
  const statusCounts = {
    new: metrics.filter((m) => m.status === 'new').length,
    under_review: metrics.filter((m) => m.status === 'under_review').length,
    planned: metrics.filter((m) => m.status === 'planned').length,
    in_progress: metrics.filter((m) => m.status === 'in_progress').length,
    shipped: metrics.filter((m) => m.status === 'shipped').length,
    declined: metrics.filter((m) => m.status === 'declined').length,
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors">
            ← Admin
          </Link>
          <h1 className="text-[18px] font-bold text-foreground">Feedback Management</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
{/* SLA Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'New', count: statusCounts.new, color: 'bg-muted text-muted-foreground border-border' },
            { label: 'Under Review', count: statusCounts.under_review, color: 'bg-info/10 text-info border-info/30' },
            { label: 'Planned', count: statusCounts.planned, color: 'bg-info/10 text-info border-info/30' },
            { label: 'In Progress', count: statusCounts.in_progress, color: 'bg-primary/10 text-primary border-primary/30' },
            { label: 'Shipped', count: statusCounts.shipped, color: 'bg-success/10 text-success border-success/30' },
            { label: 'Declined', count: statusCounts.declined, color: 'bg-destructive/10 text-destructive border-destructive/30' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-3 ${stat.color}`}>
              <p className="text-[11px] font-semibold uppercase mb-1 opacity-75">{stat.label}</p>
              <p className="text-[24px] font-bold">{stat.count}</p>
            </Card>
          ))}
        </section>

        {/* SLA Alerts */}
        <section className="space-y-3">
          {metrics.filter((m) => m.exceeds24h || m.exceeds7d).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <p className="text-[13px] font-bold text-destructive">🚨 SLA Breaches</p>
                <ul className="text-[12px] text-destructive space-y-1">
                  {metrics.filter((m) => m.exceeds24h).map((m) => (
                    <li key={m.id}>
                      "{m.title}" - No response for {Math.round(m.hoursOld)} hours
                    </li>
                  ))}
                  {metrics.filter((m) => m.exceeds7d).map((m) => (
                    <li key={m.id}>
                      "{m.title}" - No decision for {Math.round(m.hoursOld / 24)} days
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </section>

        {/* Feedback Items Table */}
        <Card className="p-0">
          <Table className="text-[12px] text-left">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="px-4 py-3 font-semibold text-foreground">Title</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">Category</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">Status</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">User</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground text-right">Age</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground text-right">Votes</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground text-right">Comments</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                    No feedback items yet
                  </TableCell>
                </TableRow>
              ) : (
                metrics.map((item: FeedbackMetric) => (
                  <TableRow key={item.id} className={item.exceeds24h || item.exceeds7d ? 'bg-destructive/10' : undefined}>
                    <TableCell className="px-4 py-3 max-w-xs truncate">
                      <span className="font-medium text-foreground">{item.title}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline">{CATEGORY_LABELS[item.category] || item.category}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[11px]">
                      {item.user_profiles?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className={item.exceeds24h ? 'text-destructive font-bold' : ''}>
                        {Math.round(item.hoursOld)}h
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold text-foreground">
                      {item.vote_count}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {item.feedback_comments?.[0]?.count || 0}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/feedback/${item.id}`}
                        className="text-primary font-semibold text-[11px]"
                      >
                        Review →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  )
}
