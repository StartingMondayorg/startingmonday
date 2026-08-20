import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

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

  const completed = setupSteps.filter((s) => s.done).length

  return (
    <Card variant="glass" id="search-setup" className="gap-0 rounded overflow-hidden mb-8 py-0">
      <div className="px-6 py-[18px] border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
            Search setup
          </h2>
          <Link href="/dashboard/start" className="text-[12px] text-slate-400 hover:text-slate-200 transition-colors">
            View details &rarr;
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Progress
            value={(completed / setupSteps.length) * 100}
            className="flex-1 h-1.5 bg-white/10 [&_[data-slot=progress-indicator]]:bg-orange-500"
          />
          <span className="text-[12px] font-semibold text-slate-300 shrink-0">
            {completed} of {setupSteps.length} complete
          </span>
        </div>
      </div>
      <div className="divide-y divide-white/10">
        {setupSteps.map((step, i) => (
          <div
            key={i}
            className={`px-6 py-3.5 flex items-center gap-4 ${step.done ? 'opacity-50' : ''}`}
          >
            <Badge
              variant={step.done ? 'success' : 'secondary'}
              className="w-5 h-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px] font-bold"
            >
              {step.done ? '✓' : i + 1}
            </Badge>
            <span
              className={`text-[13px] flex-1 min-w-0 ${
                step.done ? 'line-through text-slate-400 decoration-slate-500' : 'text-slate-100'
              }`}
            >
              {step.label}
            </span>
            {!step.done && (
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                render={<Link href={step.href} />}
              >
                {step.cta} &rarr;
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
