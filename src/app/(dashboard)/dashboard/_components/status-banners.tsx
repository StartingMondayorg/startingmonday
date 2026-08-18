import Link from 'next/link'

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

  return (
    <>
      {!activationComplete && (
        <section className="mb-4 rounded-2xl border border-orange-300/35 bg-orange-500/10 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)] backdrop-blur-md">
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
              <Link
                href={nextSetupStep.href}
                className="inline-flex min-h-[40px] items-center justify-center rounded bg-orange-500 px-4 py-2 text-[12px] font-semibold text-slate-950 transition-colors hover:bg-orange-400 shrink-0"
              >
                {nextSetupStep.cta}
              </Link>
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
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </span>
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
        </section>
      )}

      {isTrialing && (
        <div
          className={`mb-4 px-5 py-3 rounded flex items-center justify-between gap-4 text-[13px] ${
            trialDaysLeft <= 3
              ? 'bg-red-500/10 border border-red-300/40 text-red-200'
              : trialDaysLeft <= 7
                ? 'bg-amber-500/10 border border-amber-300/40 text-amber-200'
                : 'bg-white/5 border border-white/10 text-slate-300'
          }`}
        >
          <span>
            {trialDaysLeft <= 0
              ? 'Your free trial has ended. The signal history on your companies is paused.'
              : trialDaysLeft <= 7
                ? totalCount > 0
                  ? `Free trial - ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left. Your pipeline of ${totalCount} ${totalCount === 1 ? 'company' : 'companies'} and its signal history pause when the trial ends.`
                  : `Free trial - ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left.`
                : `Free trial active - ${trialDaysLeft} days left. Full access, no credit card on file.`}
          </span>
          <Link href="/settings/billing" className="font-semibold underline shrink-0">
            {trialDaysLeft <= 7 ? 'Choose your plan' : 'View plans'}
          </Link>
        </div>
      )}

      {offerCount > 0 && !isExecutiveMode && (
        <div className="mb-4 px-5 py-3.5 rounded bg-emerald-500/10 border border-emerald-300/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
            <span className="text-[13px] font-semibold text-emerald-100">
              {offerCount === 1 ? `${offerName ?? 'Offer'} - offer in hand` : `${offerCount} offers in flight`}
            </span>
          </div>
          <Link href="/dashboard/offers" className="text-[12px] font-semibold text-emerald-200 hover:text-emerald-100 shrink-0">
            Offers
          </Link>
        </div>
      )}

      {offerCompanyName && !isExecutiveMode && (
        <div className="mb-4 bg-green-900 rounded px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold text-white">Did you accept the offer?</p>
            <p className="text-[12px] text-green-300 mt-0.5">Mark your search complete and we will take care of the rest.</p>
          </div>
          <form action={onMarkPlaced} className="flex items-center gap-2 shrink-0">
            <input type="hidden" name="company" value={offerCompanyName} />
            <button
              type="submit"
              className="bg-white/10 text-slate-100 text-[13px] font-bold px-5 py-2 rounded cursor-pointer border border-white/15 hover:border-white/30 hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              Yes, I accepted
            </button>
            <Link href="/dashboard" className="text-[12px] text-green-400 hover:text-green-200 transition-colors whitespace-nowrap">
              Later
            </Link>
          </form>
        </div>
      )}

      {!activationComplete && (
        <div className="mb-4 bg-white/5 border border-white/10 rounded px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-5 rounded-full ${i < activationCompletedCount ? 'bg-orange-400' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <span className="text-[12px] text-slate-300 font-semibold shrink-0">{activationCompletedCount} of 6 steps complete</span>
          </div>
          <Link href="/dashboard/start" className="text-[12px] font-semibold text-orange-200 hover:underline shrink-0">
            Setup
          </Link>
        </div>
      )}
    </>
  )
}
