import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import StageSelect from './stage-select'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
export const metadata = { title: 'B2B Sales Pipeline - Starting Monday Admin' }

export const STAGES: { key: string; label: string; cls: string }[] = [
  { key: 'identified',     label: 'Identified',    cls: 'bg-muted text-muted-foreground' },
  { key: 'contacted',      label: 'Contacted',     cls: 'bg-info/10 text-info' },
  { key: 'demo_scheduled', label: 'Demo',          cls: 'bg-warning/10 text-warning' },
  { key: 'proposal_sent',  label: 'Proposal',      cls: 'bg-primary/10 text-primary' },
  { key: 'negotiating',    label: 'Negotiating',   cls: 'bg-info/10 text-info' },
  { key: 'closed_won',     label: 'Won',           cls: 'bg-success/10 text-success' },
  { key: 'closed_lost',    label: 'Lost',          cls: 'bg-destructive/10 text-destructive' },
]

export const TYPE_LABELS: Record<string, string> = {
  outplacement: 'Outplacement',
  mba_program:  'MBA / Exec Ed',
  vc_pe:        'VC / PE',
  other:        'Other',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export default async function B2BPipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()

  const { data: prospects } = await admin
    .from('b2b_prospects')
    .select(`
      id, name, type, stage, estimated_seats, estimated_arr, notes, updated_at,
      b2b_activities(id, next_action, next_action_due, occurred_at)
    `)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })

  const rows = (prospects ?? []) as {
    id: string; name: string; type: string; stage: string
    estimated_seats: number | null; estimated_arr: number | null
    notes: string | null; updated_at: string
    b2b_activities: { id: string; next_action: string | null; next_action_due: string | null; occurred_at: string }[]
  }[]

  const activeRows = rows.filter(r => r.stage !== 'closed_lost')
  const totalArr = activeRows.reduce((s, r) => s + (r.estimated_arr ?? 0), 0)
  const totalSeats = activeRows.reduce((s, r) => s + (r.estimated_seats ?? 0), 0)

  const today = new Date().toISOString().split('T')[0]
  const stageCounts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = rows.filter(r => r.stage === s.key).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">Admin</Link>
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
<div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-foreground">B2B Sales Pipeline</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {activeRows.length} active prospect{activeRows.length !== 1 ? 's' : ''}
              {totalArr > 0 && <> &middot; {fmt(totalArr)} estimated ARR</>}
              {totalSeats > 0 && <> &middot; {totalSeats} seats</>}
            </p>
          </div>
          <Link
            href="/dashboard/admin/b2b/new"
            className="text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded transition-colors shrink-0"
          >
            + Add prospect
          </Link>
        </div>

        {/* Stage summary */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
          {STAGES.map(s => (
            <Card key={s.key} className="p-3 text-center">
              <div className="text-[20px] font-bold text-foreground">{stageCounts[s.key] ?? 0}</div>
              <div className={`text-[10px] font-bold tracking-[0.06em] uppercase mt-1 ${s.cls.split(' ')[1]}`}>
                {s.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Prospect list */}
        {rows.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-[14px] text-muted-foreground">No prospects yet.</p>
            <Link href="/dashboard/admin/b2b/new" className="mt-3 inline-block text-[13px] font-semibold text-foreground underline">
              Add your first prospect
            </Link>
          </Card>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="px-5 py-3 text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">Prospect</TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground hidden sm:table-cell">Type</TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground">Stage</TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground hidden sm:table-cell text-right">ARR</TableHead>
                  <TableHead className="px-4 py-3 text-[10px] font-bold tracking-[0.09em] uppercase text-muted-foreground hidden md:table-cell">Next action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const stage = STAGES.find(s => s.key === r.stage)
                  const activities = r.b2b_activities ?? []
                  const latestWithAction = activities.find(a => a.next_action && a.next_action_due)
                  const nextActionDue = latestWithAction?.next_action_due
                  const isOverdue = nextActionDue && nextActionDue < today
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 py-3.5 whitespace-normal">
                        <Link href={`/dashboard/admin/b2b/${r.id}`} className="text-[14px] font-semibold text-foreground hover:text-muted-foreground">
                          {r.name}
                        </Link>
                        {r.notes && (
                          <p className="text-[12px] text-muted-foreground mt-0.5 truncate max-w-[240px]">{r.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 hidden sm:table-cell text-[13px] text-muted-foreground">
                        {TYPE_LABELS[r.type] ?? r.type}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <StageSelect
                          id={r.id}
                          stage={r.stage}
                          stages={STAGES}
                          cls={stage?.cls ?? 'bg-muted text-muted-foreground'}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 hidden sm:table-cell text-right text-[13px] font-semibold text-muted-foreground">
                        {r.estimated_arr ? fmt(r.estimated_arr) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 hidden md:table-cell whitespace-normal">
                        {latestWithAction ? (
                          <div>
                            <p className="text-[12px] text-muted-foreground truncate max-w-[180px]">{latestWithAction.next_action}</p>
                            {nextActionDue && (
                              <p className={`text-[11px] mt-0.5 ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                {isOverdue ? 'Overdue: ' : ''}{nextActionDue}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">None set</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

      </main>
    </div>
  )
}

