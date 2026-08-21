import type { Metadata } from 'next'
import { TrackLink } from '@/app/components/TrackLink'
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
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-14 text-foreground sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Search-firm persona routes</p>
        <h1 className="max-w-3xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">Choose the role that owns mandate quality.</h1>
        <h2 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Pilot frame</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">Each route keeps the same operating frame: one mandate, one sponsor, and one day-30 decision point.</p>

        <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Role routes</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SEARCH_FIRM_PERSONAS.map((persona) => (
            <TrackLink
              key={persona.slug}
              href={`/search-firms/personas/${persona.slug}`}
              event={EVENT_NAMES.personaRouteSelected}
              logToUserEvents
              properties={{ channel: 'search_firms', persona: persona.slug, source_route: '/search-firms/personas', target_route: `/search-firms/personas/${persona.slug}` }}
              className="block rounded-2xl border border-border bg-muted/[0.04] p-5 transition-colors hover:border-primary/70"
            >
              <h2 className="mb-2 text-[17px] font-semibold text-foreground">{persona.label}</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{persona.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(personaOutcomeChips[persona.slug] ?? []).map((chip) => (
                  <span key={chip} className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-foreground">Open role path</p>
            </TrackLink>
          ))}
        </div>

        <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Pilot requirements</h3>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackLink
            href="/search-firms/trust"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: 'Review trust summary', source_page: '/search-firms/personas' }}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
          >
            Review trust summary
          </TrackLink>
          <TrackLink
            href="/search-firms/procurement"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: 'Review procurement path', source_page: '/search-firms/personas' }}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
          >
            Review procurement path
          </TrackLink>
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
