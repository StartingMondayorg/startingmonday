import Link from 'next/link'
import firstWeekSpine from '@/content/first-week-spine.json'
import { Card } from '@/components/ui'
import {
  decisionRoleTargetsForCompany,
  firstNoteDraftForCompany,
  followUpSequenceForWeekOne,
} from './onboarding-helpers'

export function OnboardingDoneStep({
  firstName,
  currentTitle,
  currentCompany,
  targetTitles,
  companies,
  briefingTime,
  isPassive,
  intelContent,
  intelLoading,
}: {
  firstName: string
  currentTitle: string
  currentCompany: string
  targetTitles: string
  companies: string[]
  briefingTime: string
  isPassive: boolean
  intelContent: string
  intelLoading: boolean
}) {
  function formatTime(val: string) {
    const [h, m] = val.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const firstCompany = companies[0] ?? ''
  const roleTargets = decisionRoleTargetsForCompany(firstCompany, 'csuite', currentTitle)
  const firstNoteDraft = firstCompany ? firstNoteDraftForCompany(firstCompany, currentTitle) : ''
  const followUps = firstCompany ? followUpSequenceForWeekOne(firstCompany) : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-serif font-bold text-foreground leading-tight mb-2">
          {firstName}, your likely-to-open shortlist is live.
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {isPassive
            ? 'We will watch your companies and send a digest every Sunday. You can take action when a role starts taking shape.'
            : 'You now have an early view of where to focus. Here is what happens next.'}
        </p>
      </div>

      <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">What we understood about you</p>
        <p className="text-[15px] font-semibold text-foreground">{currentTitle || 'Your role lane is set'}{currentCompany ? ` at ${currentCompany}` : ''}</p>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          {targetTitles
            ? `We will bias briefs and role hypotheses toward: ${targetTitles}`
            : 'Your profile and target companies now shape the first brief and shortlist.'}
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">Companies being watched</p>
          {companies.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">None yet - add them from your dashboard.</p>
          ) : (
            <p className="text-[15px] font-semibold text-foreground">{companies.join(', ')}</p>
          )}
          <p className="text-[12px] text-muted-foreground mt-1.5">
            This powers your first likely-to-open role shortlist and signal feed.
          </p>
        </Card>

        {!isPassive && (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">First relationship action this week</p>
            <p className="text-[15px] font-semibold text-foreground">Identify one decision-path contact and start outreach timing.</p>
            <p className="text-[12px] text-muted-foreground mt-1.5">Open contacts from the dashboard and begin with your highest-leverage target.</p>
          </Card>
        )}

        {!isPassive && firstCompany && roleTargets.length > 0 && (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">Seats to map first at {firstCompany}</p>
            <div className="space-y-2">
              {roleTargets.map((seat) => (
                <div key={seat.title} className="rounded border border-border bg-muted/40 px-3 py-2">
                  <p className="text-[13px] font-semibold text-foreground">{seat.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{seat.why}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">These are the seats that typically shape the shortlist. From your dashboard, relationship enrichment finds the actual people in them.</p>
          </Card>
        )}

        {!isPassive && firstCompany && firstNoteDraft && (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">First note draft</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{firstNoteDraft}</p>
            <p className="text-[11px] text-muted-foreground mt-2">You can edit this draft from your contacts outreach workspace.</p>
          </Card>
        )}

        {!isPassive && firstCompany && followUps.length > 0 && (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">Week-one follow-up sequence</p>
            <ul className="mt-1 space-y-1.5">
              {followUps.map((item) => (
                <li key={item} className="text-[12px] text-muted-foreground leading-relaxed">- {item}</li>
              ))}
            </ul>
          </Card>
        )}

        {isPassive ? (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">Weekly digest</p>
            <p className="text-[15px] font-semibold text-foreground">Every Sunday morning</p>
            <p className="text-[12px] text-muted-foreground mt-1.5">
              Scan matches, exec moves, funding signals - delivered once a week. No daily noise.
            </p>
          </Card>
        ) : (
          <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">First briefing</p>
            <p className="text-[15px] font-semibold text-foreground">Tomorrow at {formatTime(briefingTime)}</p>
            <p className="text-[12px] text-muted-foreground mt-1.5">
              New role matches, company signals, and your next actions - every morning.
            </p>
          </Card>
        )}

        <Card variant="glass" className="rounded-lg border-border bg-muted/40 px-5 py-4">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">First career page scan</p>
          <p className="text-[15px] font-semibold text-foreground">Next Monday, Wednesday, or Friday at 8 AM UTC</p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            We scan career pages 3x per week and flag matching roles before they reach LinkedIn.
          </p>
        </Card>
      </div>

      {firstCompany && (intelLoading || intelContent) && (
        <Card variant="glass" className="rounded-lg border-border bg-background/70 px-5 py-5">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">
            {firstCompany} - intelligence preview
          </p>
          {intelLoading && !intelContent && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-muted animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-muted animate-pulse [animation-delay:300ms]" />
            </div>
          )}
          {intelContent && (
            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {intelContent}
              {intelLoading && (
                <span className="inline-block w-0.5 h-3.5 bg-muted animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            This is a preview. Your first full briefing includes live scan results and signal history.
          </p>
        </Card>
      )}

      <Card variant="glass" className="rounded-lg px-5 py-4 bg-muted/40 border-border">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1">Optional next step</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
          Want better prep quality? Add LinkedIn and profile detail after launch.
        </p>
        <Link href="/dashboard/start" className="text-[13px] font-semibold text-primary underline transition-colors">
          Complete profile from dashboard start page
        </Link>
        <p className="text-[12px] text-muted-foreground mt-3">
          <span className="font-semibold text-muted-foreground">{firstWeekSpine.steps[4].label}:</span> {firstWeekSpine.steps[4].body}
        </p>
      </Card>
    </div>
  )
}
