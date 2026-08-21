import { fullDateInTz, greetingInTz } from '@/lib/date'
import { LocalGreeting } from '../LocalGreeting'

type DashboardGreetingBlockProps = {
  firstName: string
  briefingTimezone: string | null
}

export function DashboardGreetingBlock({ firstName, briefingTimezone }: DashboardGreetingBlockProps) {
  const effectiveTimeZone = briefingTimezone ?? 'UTC'

  const greeting = greetingInTz(effectiveTimeZone)
  const today = fullDateInTz(effectiveTimeZone)

  return (
    <>
      <p className="text-[13px] font-semibold text-primary mb-2">This week&apos;s operating rhythm</p>
      {/* h2 keeps the greeting in the document outline; the page h1 is the
          sr-only "Dashboard" heading in page.tsx (single-h1 a11y rule). */}
      <h2 className="text-[26px] sm:text-[32px] font-serif font-bold text-foreground leading-tight">
        <LocalGreeting firstName={firstName} serverGreeting={greeting} />
      </h2>
      <p className="text-[13px] text-muted-foreground mt-1.5">{today}</p>
    </>
  )
}