import Link from 'next/link'
import { TrackLink } from '@/app/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import PartnerPilotAdminClient from './PartnerPilotAdminClient'

export default function PartnerPilotAdminPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      <header className="sticky top-0 z-20 border-b border-border bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/shortlist-sprint" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
            Sprint offer
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Partner pilot admin</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[46px]">
            Seat activity and client execution overview
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-foreground sm:text-[18px]">
            Early seat-admin view for partner pilots: usage visibility, relationship action velocity, and at-risk seat detection.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <TrackLink
              href="/api/partners/pilot-admin/summary"
              event={EVENT_NAMES.partnerPilotAdminViewed}
              logToUserEvents
              properties={{ route: '/partners/pilot-admin', partner_type: 'mixed' }}
              className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Open seat summary endpoint
            </TrackLink>
            <TrackLink
              href="/api/admin/automation/reporting/pilot-partner-validation"
              event={EVENT_NAMES.partnerPilotAdminViewed}
              logToUserEvents
              properties={{ route: '/partners/pilot-admin', partner_type: 'mixed' }}
              className="rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Open partner validation report
            </TrackLink>
          </div>

          <PartnerPilotAdminClient />
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

