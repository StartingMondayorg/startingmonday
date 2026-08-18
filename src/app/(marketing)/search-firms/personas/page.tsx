import type { Metadata } from 'next'
import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { SEARCH_FIRM_PERSONAS } from '@/lib/persona-routes'

const personaOutcomeChips: Record<string, string[]> = {
  'partner-firm-lead': ['Mandate economics', 'Bid differentiation', 'Partner time protection'],
  'principal-delivery-lead': ['Kickoff consistency', 'Prep quality', 'Fewer resets'],
  'candidate-success-owner': ['First-round readiness', 'Handoff confidence', 'Interview conversion'],
}

export const metadata: Metadata = {
  title: 'Search Firm Personas | Starting Monday',
  description: 'Choose a search-firm persona route for partner, delivery, or candidate-readiness ownership.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/personas',
  },
}

export default function SearchFirmPersonasPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.96)_54%,_rgba(10,15,28,0.98)_100%)]" />
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">Search-firm persona routes</p>
        <h1 className="max-w-3xl font-serif text-[34px] leading-[1.08] text-white sm:text-[44px]">Choose the role that owns mandate quality.</h1>
        <h2 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-100">Pilot frame</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300">Each route keeps the same operating frame: one mandate, one sponsor, and one day-30 decision point.</p>

        <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-100">Role routes</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SEARCH_FIRM_PERSONAS.map((persona) => (
            <TrackLink
              key={persona.slug}
              href={`/search-firms/personas/${persona.slug}`}
              event={EVENT_NAMES.personaRouteSelected}
              logToUserEvents
              properties={{ channel: 'search_firms', persona: persona.slug, source_route: '/search-firms/personas', target_route: `/search-firms/personas/${persona.slug}` }}
              className="block rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-orange-300/70"
            >
              <h2 className="mb-2 text-[17px] font-semibold text-white">{persona.label}</h2>
              <p className="text-[13px] text-slate-300 leading-relaxed">{persona.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(personaOutcomeChips[persona.slug] ?? []).map((chip) => (
                  <span key={chip} className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-semibold text-orange-200">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-slate-200">Open role path</p>
            </TrackLink>
          ))}
        </div>

        <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-100">Pilot requirements</h3>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackLink
            href="/search-firms/trust"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: 'Review trust summary', source_page: '/search-firms/personas' }}
            className="rounded-full border border-white/18 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
          >
            Review trust summary
          </TrackLink>
          <TrackLink
            href="/search-firms/procurement"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: 'Review procurement path', source_page: '/search-firms/personas' }}
            className="rounded-full border border-white/18 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
          >
            Review procurement path
          </TrackLink>
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
