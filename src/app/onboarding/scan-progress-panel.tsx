'use client'

import { Button, Card, Input } from '@/components/ui'
export type ScanStatusPayload = {
  companies: Array<{ companyId: string; name: string; scannable: boolean; status: string; matches: number }>
  signalCount: number
  progress: { total: number; scannable: number; completed: number; done: boolean }
}

export function ScanProgressPanel({
  scanStarted,
  progress,
  extraCompany,
  addingCompany,
  canAddMore,
  onExtraCompany,
  onAddCompany,
}: {
  scanStarted: boolean
  progress: ScanStatusPayload | null
  extraCompany: string
  addingCompany: boolean
  canAddMore: boolean
  onExtraCompany: (v: string) => void
  onAddCompany: () => void
}) {
  if (!scanStarted) return null

  const rows = progress?.companies ?? []
  const done = progress?.progress?.done ?? false
  const signalCount = progress?.signalCount ?? 0

  return (
    <Card variant="glass" className="mt-6 rounded-lg border-border bg-muted/40 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          First scan
        </p>
        <span className="text-[12px] text-muted-foreground">
          {done ? 'Complete' : 'Reading the market for you...'}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rows.map(row => (
            <div key={row.companyId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={[
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    row.status === 'complete'
                      ? 'bg-success'
                      : row.status === 'scanning'
                        ? 'bg-primary animate-pulse'
                        : 'bg-muted',
                  ].join(' ')}
                />
                <span className="text-[13px] text-foreground truncate">{row.name}</span>
              </div>
              <span className="text-[12px] text-muted-foreground shrink-0">
                {row.status === 'complete'
                  ? row.matches > 0
                    ? `${row.matches} role match${row.matches === 1 ? '' : 'es'}`
                    : 'Scanned'
                  : row.status === 'scanning'
                    ? 'Scanning'
                    : 'Watching from next scheduled scan'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Your companies are queued. The first results land on your dashboard shortly.
        </p>
      )}

      {signalCount > 0 && (
        <p className="text-[12px] text-muted-foreground">
          {signalCount} market signal{signalCount === 1 ? '' : 's'} gathered so far.
        </p>
      )}

      {canAddMore && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Input
            type="text"
            value={extraCompany}
            onChange={e => onExtraCompany(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddCompany())}
            placeholder="Add another company while we work"
            className="flex-1 !border-border !bg-background/60 text-[13px] text-foreground placeholder:text-muted-foreground mt-3"
          />
          <Button
            type="button"
            onClick={onAddCompany}
            disabled={addingCompany || !extraCompany.trim()}
            className="mt-3 !border-border !bg-muted/60 text-foreground text-[13px] font-semibold hover:!bg-muted/80"
          >
            {addingCompany ? 'Adding...' : 'Add'}
          </Button>
        </div>
      )}
    </Card>
  )
}
