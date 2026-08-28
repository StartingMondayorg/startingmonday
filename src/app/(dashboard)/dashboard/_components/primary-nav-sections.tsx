import Link from 'next/link'

type DashboardPrimaryNavSectionsProps = {
  signalCount: number
  overdueCount: number
  canUseOutreachHub: boolean
  isRothschildAdmin: boolean
  isExecutiveMode: boolean
}

export function DashboardPrimaryNavSections({
  signalCount,
  overdueCount,
  canUseOutreachHub,
  isRothschildAdmin,
  isExecutiveMode,
}: DashboardPrimaryNavSectionsProps) {
  void canUseOutreachHub
  void isRothschildAdmin

  return (
    <>
      {!isExecutiveMode && (
        <section id="start-here" className="mb-6 rounded-2xl border border-border bg-muted/40 p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-primary mb-1">Operating focus</h2>
              <p className="text-[13px] text-foreground">
                {signalCount} fresh signal{signalCount === 1 ? '' : 's'} and {overdueCount} overdue follow-up{overdueCount === 1 ? '' : 's'}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard#pipeline" className="inline-flex h-[40px] items-center justify-center rounded border border-border px-3 text-[12px] font-semibold text-foreground">
                Pipeline
              </Link>
              <Link href="/dashboard/signals" className="inline-flex h-[40px] items-center justify-center rounded border border-border px-3 text-[12px] font-semibold text-foreground">
                Signals
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
