import Link from 'next/link'
import { Alert, AlertDescription, Badge, Button, Card, Progress } from '@/components/ui'
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
          className="gap-0 mb-4 border-primary/35 bg-primary/10 px-5 py-4 shadow-lg"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary/90">
                Getting started
              </p>
              <p className="mt-1 text-[13px] text-foreground">
                {activationCompletedCount} of {setupSteps.length} steps complete.
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
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
                    ? 'border-success/25 bg-success/10'
                    : 'border-border bg-muted/40'
                }`}
              >
                <Badge
                  className={`mt-0.5 h-5 w-5 shrink-0 justify-center rounded-full p-0 text-[10px] font-bold ${
                    step.done ? 'bg-success text-success-foreground' : 'bg-muted/60 text-success-foreground'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] font-semibold ${
                      step.done
                        ? 'text-success line-through decoration-success/50'
                        : 'text-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <Link
                      href={step.href}
                      className="mt-1 inline-flex text-[12px] font-semibold text-primary"
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
            trialVariant === 'default' ? 'bg-muted/40 border-border text-muted-foreground' : ''
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
            <span className="inline-block w-2 h-2 rounded-full bg-success shrink-0" />
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
        <Card variant="glass" className="gap-4 mb-4 flex-col justify-between border-transparent bg-success px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-bold text-foreground">Did you accept the offer?</p>
            <p className="text-[12px] text-success mt-0.5">Mark your search complete and we will take care of the rest.</p>
          </div>
          <form action={onMarkPlaced} className="flex items-center gap-2 shrink-0">
            <input type="hidden" name="company" value={offerCompanyName} />
            <Button
              type="submit"
              variant="secondary"
              className="h-auto whitespace-nowrap border border-border bg-muted/60 px-5 py-2 text-[13px] font-bold text-foreground hover:bg-muted/80"
            >
              Yes, I accepted
            </Button>
            <Link href="/dashboard" className="text-[12px] text-success transition-colors whitespace-nowrap">
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
            <span className="text-[12px] text-muted-foreground font-semibold shrink-0">{activationCompletedCount} of 6 steps complete</span>
          </div>
          <Link href="/dashboard/start" className="text-[12px] font-semibold text-primary hover:underline shrink-0">
            Setup
          </Link>
        </Card>
      )}
    </>
  )
}
