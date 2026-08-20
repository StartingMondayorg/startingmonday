import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

type DashboardStatusBannersProps = {
  isTrialing: boolean
  trialDaysLeft: number
  totalCount: number
  offerCount: number
  offerName: string | null
  offerCompanyName: string | null
  onMarkPlaced: (formData: FormData) => void | Promise<void>
  activationComplete: boolean
  activationCompletedCount: number
  setupSteps: Array<{
    done: boolean
    label: string
    href: string
    cta: string
  }>
  isExecutiveMode: boolean
}

export function DashboardStatusBanners({
  isTrialing,
  trialDaysLeft,
  totalCount,
  offerCount,
  offerName,
  offerCompanyName,
  onMarkPlaced,
  activationComplete,
  activationCompletedCount,
  setupSteps,
  isExecutiveMode,
}: DashboardStatusBannersProps) {
  const nextSetupStep = setupSteps.find((step) => !step.done) ?? null
  const trialVariant = trialDaysLeft <= 3 ? 'destructive' : trialDaysLeft <= 7 ? 'warning' : 'default'

  return (
    <>
      {!activationComplete && (
        <Card
          variant="glass"
          className="gap-0 mb-4 border-orange-300/35 bg-orange-500/10 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-200/90">
                Getting started
              </p>
              <p className="mt-1 text-[13px] text-slate-100">
                {activationCompletedCount} of {setupSteps.length} steps complete.
              </p>
              <p className="mt-1 text-[12px] text-slate-300">
                Keep this visible until the six actions are done so first-run users always see the next move.
              </p>
            </div>

            {nextSetupStep && (
              <Button
                render={<Link href={nextSetupStep.href} />}
                className="h-auto min-h-[40px] shrink-0 px-4 py-2 text-[12px] font-semibold"
              >
                {nextSetupStep.cta}
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {setupSteps.map((step, index) => (
              <div
                key={step.label}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${
                  step.done
                    ? 'border-emerald-300/25 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Badge
                  className={`mt-0.5 h-5 w-5 shrink-0 justify-center rounded-full p-0 text-[10px] font-bold ${
                    step.done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] font-semibold ${
                      step.done
                        ? 'text-emerald-100 line-through decoration-emerald-200/50'
                        : 'text-slate-100'
                    }`}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <Link
                      href={step.href}
                      className="mt-1 inline-flex text-[12px] font-semibold text-orange-200 hover:text-orange-100"
                    >
                      {step.cta} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isTrialing && (
        <Alert
          variant={trialVariant}
          className={`mb-4 flex items-center justify-between gap-4 px-5 py-3 text-[13px] ${
            trialVariant === 'default' ? 'bg-white/5 border-white/10 text-slate-300' : ''
          }`}
        >
          <AlertDescription className="text-current">
            {trialDaysLeft <= 0
              ? 'Your free trial has ended. The signal history on your companies is paused.'
              : trialDaysLeft <= 7
                ? totalCount > 0
                  ? `Free trial - ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left. Your pipeline of ${totalCount} ${totalCount === 1 ? 'company' : 'companies'} and its signal history pause when the trial ends.`
                  : `Free trial - ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left.`
                : `Free trial active - ${trialDaysLeft} days left. Full access, no credit card on file.`}
          </AlertDescription>
          <Link href="/settings/billing" className="font-semibold underline shrink-0">
            {trialDaysLeft <= 7 ? 'Choose your plan' : 'View plans'}
          </Link>
        </Alert>
      )}

      {offerCount > 0 && !isExecutiveMode && (
        <Alert variant="success" className="mb-4 flex items-center justify-between gap-4 px-5 py-3.5">
          <AlertDescription className="flex items-center gap-3 text-current">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
            <span className="text-[13px] font-semibold">
              {offerCount === 1 ? `${offerName ?? 'Offer'} - offer in hand` : `${offerCount} offers in flight`}
            </span>
          </AlertDescription>
          <Link href="/dashboard/offers" className="text-[12px] font-semibold shrink-0">
            Offers
          </Link>
        </Alert>
      )}

      {offerCompanyName && !isExecutiveMode && (
        <Card variant="glass" className="gap-4 mb-4 flex-col justify-between border-transparent bg-green-900 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-bold text-white">Did you accept the offer?</p>
            <p className="text-[12px] text-green-300 mt-0.5">Mark your search complete and we will take care of the rest.</p>
          </div>
          <form action={onMarkPlaced} className="flex items-center gap-2 shrink-0">
            <input type="hidden" name="company" value={offerCompanyName} />
            <Button
              type="submit"
              variant="secondary"
              className="h-auto whitespace-nowrap border border-white/15 bg-white/10 px-5 py-2 text-[13px] font-bold text-slate-100 hover:border-white/30 hover:bg-white/15"
            >
              Yes, I accepted
            </Button>
            <Link href="/dashboard" className="text-[12px] text-green-400 hover:text-green-200 transition-colors whitespace-nowrap">
              Later
            </Link>
          </form>
        </Card>
      )}

      {!activationComplete && (
        <Card variant="glass" className="gap-0 mb-4 flex-row items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Progress
              value={(activationCompletedCount / 6) * 100}
              className="w-24 shrink-0"
            />
            <span className="text-[12px] text-slate-300 font-semibold shrink-0">{activationCompletedCount} of 6 steps complete</span>
          </div>
          <Link href="/dashboard/start" className="text-[12px] font-semibold text-orange-200 hover:underline shrink-0">
            Setup
          </Link>
        </Card>
      )}
    </>
  )
}
