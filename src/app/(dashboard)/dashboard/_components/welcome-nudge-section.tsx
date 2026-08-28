import { NextBestActionPrompt } from '@/app/(dashboard)/dashboard/_components/NextBestActionPrompt'
import { DashboardPathWelcomeCard } from './path-welcome-card'
import { Button } from '@/components/ui'
type StallNudge = {
  headline: string
  body: string
  action: string
  href: string
} | null

type DashboardWelcomeNudgeSectionProps = {
  showNurtureWelcome: boolean
  showCampaignWelcome: boolean
  showWatcherWelcome: boolean
  stallNudge: StallNudge
  onDismissStallNudge: (formData: FormData) => void | Promise<void>
}

export function DashboardWelcomeNudgeSection({
  showNurtureWelcome,
  showCampaignWelcome,
  showWatcherWelcome,
  stallNudge,
  onDismissStallNudge,
}: DashboardWelcomeNudgeSectionProps) {
  return (
    <>
      {showNurtureWelcome && (
        <DashboardPathWelcomeCard
          id="nurture-welcome"
          eyebrow="Your search starts here"
          title="You don't have to have it all figured out today."
          body="Do one focused action today. Consistency beats scattered effort."
          prompt="One thing to do right now:"
          ctaHref="/dashboard/companies/new"
          ctaLabel="Add the first company you want to work for ->"
          footer="You can come back for the rest. The system will be here."
        />
      )}

      {showCampaignWelcome && (
        <DashboardPathWelcomeCard
          id="campaign-welcome"
          eyebrow="Active search"
          title="Your target list is the campaign."
          body="Most executive roles are filled through relationships before posting. Start tracking target companies early."
          prompt="Start here: add the companies you already have a relationship or contact at."
          ctaHref="/dashboard/companies/new"
          ctaLabel="Add your first target company ->"
          footer="Aim for 10 to 15 companies. Add career URLs as you go."
        />
      )}

      {showWatcherWelcome && (
        <DashboardPathWelcomeCard
          id="watcher-welcome"
          eyebrow="Market intelligence"
          title="You don't have to be searching to stay ready."
          body="Stay ready by tracking the right companies before you need to move."
          prompt="Add the companies you would say yes to and let the platform do the watching."
          ctaHref="/dashboard/companies/new"
          ctaLabel="Add a company to watch ->"
          footer="No pressure to act now. You will know when timing shifts."
        />
      )}

      {stallNudge ? (
        <div className="relative">
          <NextBestActionPrompt
            action={stallNudge.action}
            href={stallNudge.href}
            description={stallNudge.headline + ' ' + stallNudge.body}
            source="stall_nudge"
          />
          <form action={onDismissStallNudge} className="absolute top-2 right-2">
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-warning hover:bg-transparent"
              aria-label="Dismiss"
            >
              ✕
            </Button>
          </form>
        </div>
      ) : (
        <NextBestActionPrompt
          action="Briefing"
          href="/dashboard/briefing"
          description="Start with your daily briefing to see signals, due actions, and your top priorities."
          source="dashboard_default"
        />
      )}
    </>
  )
}
