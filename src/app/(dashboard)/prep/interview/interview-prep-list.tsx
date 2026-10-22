import Link from 'next/link'
import { Badge, Button, Card } from '@/components/ui'
import { deleteInterviewPrep } from './actions'
import type { InterviewPrepRow as PrepRow } from './interview-prep-form'

function prepLabel(row: PrepRow): string {
  const who = [row.role_title, row.company_name].filter(Boolean).join(' at ')
  return who || 'Untitled prep'
}

function whenLabel(row: PrepRow): string {
  if (row.interview_at) {
    const d = new Date(row.interview_at)
    if (!Number.isNaN(d.getTime())) {
      return `Interview ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
    }
  }
  return `Updated ${new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// Saved and draft worksheets. The newest opens by default; this strip switches
// between them, starts a blank one, or removes the one that is open.
export function InterviewPrepList({ preps, currentId }: { preps: PrepRow[]; currentId: string | null }) {
  if (preps.length === 0) return null

  return (
    <Card className="border-border bg-card/40 p-4 sm:p-5" data-testid="interview-prep-list">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Your interview preps</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="min-h-[36px]" render={<Link href="/prep/interview?new=1" />}>
            New prep
          </Button>
          {currentId && (
            <form action={deleteInterviewPrep}>
              <input type="hidden" name="id" value={currentId} />
              <Button type="submit" variant="ghost" size="sm" className="min-h-[36px] text-muted-foreground hover:text-destructive">
                Delete this prep
              </Button>
            </form>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {preps.map(row => {
          const active = row.id === currentId
          return (
            <li key={row.id}>
              <Link
                href={`/prep/interview?id=${row.id}`}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px] transition-colors min-h-[44px]',
                  active ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                ].join(' ')}
              >
                <span className="truncate font-semibold">{prepLabel(row)}</span>
                <span className="flex shrink-0 items-center gap-2 text-[12px]">
                  <span>{whenLabel(row)}</span>
                  <Badge variant={row.status === 'saved' ? 'success' : 'secondary'}>{row.status === 'saved' ? 'Saved' : 'Draft'}</Badge>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
