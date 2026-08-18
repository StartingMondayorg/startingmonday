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
        <section id="start-here" className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-orange-200 mb-1">Operating focus</h2>
              <p className="text-[13px] text-slate-200">
                {signalCount} fresh signal{signalCount === 1 ? '' : 's'} and {overdueCount} overdue follow-up{overdueCount === 1 ? '' : 's'}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard#pipeline" className="inline-flex h-[40px] items-center justify-center rounded border border-white/20 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/35">
                Pipeline
              </Link>
              <Link href="/dashboard/signals" className="inline-flex h-[40px] items-center justify-center rounded border border-white/20 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/35">
                Signals
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
