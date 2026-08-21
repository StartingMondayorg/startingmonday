import Link from 'next/link'
import { Button, Card } from '@/components/ui'
// Campaign Foundation: "What we understood about your search."
// Shows the strategy the platform is executing against, with edit paths.
// Feedback source: Aleksei 2.4 - users need confidence the platform
// understood their strategy before trusting its recommendations.

type CampaignFoundationProps = {
  targetTitles: string[]
  targetSectors: string[]
  targetLocations: string[]
  positioningSummary: string | null
  currentTitle: string | null
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '\u2026'
}

export function DashboardCampaignFoundationSection({
  targetTitles,
  targetSectors,
  targetLocations,
  positioningSummary,
  currentTitle,
}: CampaignFoundationProps) {
  const rows: { key: string; label: string; value: string | null; addCta: string }[] = [
    {
      key: 'roles',
      label: 'Target roles',
      value: targetTitles.length > 0 ? targetTitles.slice(0, 4).join(', ') : null,
      addCta: 'Set target roles',
    },
    {
      key: 'sectors',
      label: 'Target sectors',
      value: targetSectors.length > 0 ? targetSectors.slice(0, 4).join(', ') : null,
      addCta: 'Set sectors',
    },
    {
      key: 'locations',
      label: 'Locations',
      value: targetLocations.length > 0 ? targetLocations.slice(0, 4).join(', ') : null,
      addCta: 'Set locations',
    },
    {
      key: 'positioning',
      label: 'Positioning',
      value: positioningSummary?.trim() ? truncate(positioningSummary.trim(), 180) : null,
      addCta: 'Add positioning',
    },
  ]

  const setCount = rows.filter(r => r.value !== null).length

  return (
    <Card
      variant="glass"
      id="campaign-foundation"
      aria-labelledby="campaign-foundation-heading"
      className="mb-5 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary/90 mb-1">
            Campaign foundation
          </p>
          <h2 id="campaign-foundation-heading" className="text-[18px] sm:text-[20px] font-serif font-bold text-primary-foreground leading-tight">
            What we understood about your search
          </h2>
        </div>
        <Button
          variant="outline"
          render={<Link href="/dashboard/profile" />}
          className="shrink-0 text-[12px] font-semibold"
        >
          Edit
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map(row => (
          <div key={row.key} className="min-w-0">
            <dt className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">{row.label}</dt>
            <dd className="mt-0.5 text-[13px] leading-snug">
              {row.value ? (
                <span className="text-muted-foreground">{row.value}</span>
              ) : (
                <Link href="/dashboard/profile" className="text-primary font-semibold">
                  {row.addCta} &rarr;
                </Link>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[12px] text-muted-foreground">
        {setCount === rows.length
          ? `Every signal, company suggestion, and brief is calibrated to this strategy${currentTitle ? ` and your background as ${currentTitle}` : ''}.`
          : 'The more of this you set, the more precisely signals, companies, and briefs calibrate to your search.'}
      </p>
    </Card>
  )
}
