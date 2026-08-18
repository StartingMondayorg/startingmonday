import Link from 'next/link'

type Activation = {
  isComplete: boolean
}

type SetupStep = {
  done: boolean
  label: string
  href: string
  cta: string
}

type Props = {
  activation: Activation
  hasFilters: boolean
  setupSteps: SetupStep[]
}

export function DashboardIntelSetupSections(props: Props) {
  const { activation, hasFilters, setupSteps } = props

  if (activation.isComplete || hasFilters) return null

  return (
    <section id="search-setup" className="bg-white/5 border border-white/15 rounded overflow-hidden mb-8">
      <div className="px-6 py-[18px] border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
            Search setup
          </h2>
          <Link href="/dashboard/start" className="text-[12px] text-slate-400 hover:text-slate-200 transition-colors">
            View details &rarr;
          </Link>
        </div>
        {(() => {
          const completed = setupSteps.filter((s) => s.done).length
          const barCls = ['w-0', 'w-[16.67%]', 'w-1/3', 'w-1/2', 'w-2/3', 'w-5/6', 'w-full'][completed] ?? 'w-0'
          return (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full bg-orange-500 rounded-full transition-all duration-500 ${barCls}`} />
              </div>
              <span className="text-[12px] font-semibold text-slate-300 shrink-0">
                {completed} of {setupSteps.length} complete
              </span>
            </div>
          )
        })()}
      </div>
      <div className="divide-y divide-white/10">
        {setupSteps.map((step, i) => (
          <div
            key={i}
            className={`px-6 py-3.5 flex items-center gap-4 ${step.done ? 'opacity-50' : ''}`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                step.done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <span
              className={`text-[13px] flex-1 min-w-0 ${
                step.done ? 'line-through text-slate-400 decoration-slate-500' : 'text-slate-100'
              }`}
            >
              {step.label}
            </span>
            {!step.done && (
              <Link
                href={step.href}
                className="text-[12px] font-semibold text-slate-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors shrink-0"
              >
                {step.cta} &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
