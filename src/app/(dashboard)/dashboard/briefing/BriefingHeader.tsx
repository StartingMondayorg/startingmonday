/**
 * BriefingHeader - hero section with a single primary stat card.
 *
 * The briefing's job is "read what changed and why it matters";
 * detailed counts live on the dashboard, so this header keeps one
 * headline number plus a compact context line.
 */

import { LocalGreeting } from '../LocalGreeting'
import { Card } from '@/components/ui'
type BriefingHeaderProps = {
  firstName: string
  serverGreeting: string
  todayLabel: string
  totalCompanies: number
  signalCount: number
  matchCount: number
  movesReadyCount: number
}

export function BriefingHeader({
  firstName,
  serverGreeting,
  todayLabel,
  totalCompanies,
  signalCount,
  matchCount,
  movesReadyCount,
}: BriefingHeaderProps) {
  return (
    <section id="briefing-header" className="bg-gradient-to-b from-background to-background/95 rounded-t-xl px-6 sm:px-8 py-10 sm:py-14">
      {/* Greeting + Date */}
      <div className="mb-10">
        <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90 mb-3">
          This week&apos;s operating rhythm
        </p>
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary mb-2">Daily briefing</p>
        <h1 className="text-[32px] sm:text-[42px] font-bold text-foreground leading-tight mb-2"><LocalGreeting firstName={firstName} serverGreeting={serverGreeting} /></h1>
        <p className="text-[13px] sm:text-[14px] font-medium text-muted-foreground">{todayLabel}</p>
      </div>

      {/* Primary Stat Card - "Find Roles First" */}
      <Card variant="glass" className="mb-8 border-border bg-gradient-to-br from-card/80 to-background p-6 sm:p-8 shadow-xl">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary/90 mb-5">
          Position Watch
        </p>
        <div className="flex items-baseline gap-4 mb-5">
          <span className="text-[60px] sm:text-[72px] font-bold text-foreground leading-none">
            {signalCount}
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[16px] sm:text-[18px] font-semibold text-muted-foreground leading-snug">
              market move{signalCount !== 1 ? 's' : ''} this week
            </span>
            <span className="text-[12px] text-muted-foreground">
              across {totalCompanies} companies
            </span>
          </div>
        </div>
        <p className="text-[14px] sm:text-[15px] text-muted-foreground/90 leading-relaxed max-w-md">
          {matchCount} aligned role {matchCount === 1 ? 'opportunity' : 'opportunities'} ready to move. Position {signalCount > 0 ? 'improving' : 'stable'}.
        </p>
        <p className="mt-4 text-[12px] text-muted-foreground">
          {totalCompanies} {totalCompanies === 1 ? 'company' : 'companies'} under watch · {matchCount} aligned {matchCount === 1 ? 'role' : 'roles'} · {movesReadyCount} {movesReadyCount === 1 ? 'move' : 'moves'} ready today
        </p>
      </Card>
    </section>
  )
}
