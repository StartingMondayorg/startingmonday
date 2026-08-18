import Link from 'next/link'
import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import PartnerPilotAdminClient from './PartnerPilotAdminClient'

export default function PartnerPilotAdminPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_30%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(10,15,28,0.96)_60%,_rgba(10,15,28,1)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/shortlist-sprint" className="text-[13px] text-slate-200 transition-colors hover:text-white">
            Sprint offer
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-white/10 bg-[linear-gradient(150deg,rgba(26,22,20,0.72),rgba(10,14,24,0.92))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.24)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Partner pilot admin</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-white sm:text-[46px]">
            Seat activity and client execution overview
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-200 sm:text-[18px]">
            Early seat-admin view for partner pilots: usage visibility, relationship action velocity, and at-risk seat detection.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <TrackLink
              href="/api/partners/pilot-admin/summary"
              event={EVENT_NAMES.partnerPilotAdminViewed}
              logToUserEvents
              properties={{ route: '/partners/pilot-admin', partner_type: 'mixed' }}
              className="rounded-full border border-white/20 px-4 py-2 text-[12px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Open seat summary endpoint
            </TrackLink>
            <TrackLink
              href="/api/admin/automation/reporting/pilot-partner-validation"
              event={EVENT_NAMES.partnerPilotAdminViewed}
              logToUserEvents
              properties={{ route: '/partners/pilot-admin', partner_type: 'mixed' }}
              className="rounded-full border border-white/20 px-4 py-2 text-[12px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
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

