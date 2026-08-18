import type { Metadata } from 'next'
import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { EXECUTIVE_PERSONAS } from '@/lib/persona-routes'

export const metadata: Metadata = {
  title: 'Executive Personas | Starting Monday',
  description: 'Choose your executive persona route for role-specific campaign messaging and telemetry-aware journey entry.',
  alternates: {
    canonical: 'https://startingmonday.app/executives/personas',
  },
}

export default function ExecutivePersonasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-4">Executive persona routes</p>
        <h1 className="text-[34px] sm:text-[42px] font-bold leading-[1.1] tracking-tight mb-4">Choose your route.</h1>
        <p className="text-[16px] text-slate-100 leading-relaxed mb-6">Select the persona that best matches your target seat and transition context.</p>

        {/* Persona guidance - 2-step recommender so visitors don't have to guess */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 mb-8">
          <p className="text-[13px] font-bold text-slate-100 mb-3">Not sure where to start?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-slate-200">
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <p className="font-semibold text-white mb-1">I know my target title</p>
              <p className="text-slate-100">Pick the persona that matches your next seat - CIO, CISO, CDO, CPO, COO, or VP Technology.</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <p className="font-semibold text-white mb-1">{"I'm not sure which title fits"}</p>
              <p className="text-slate-100">Start with <TrackLink href="/executives/active" event={EVENT_NAMES.personaRouteSelected} logToUserEvents properties={{ channel: 'executives', persona: 'active_mode', source_route: '/executives/personas', target_route: '/executives/active' }} className="underline text-orange-300 hover:text-orange-200">Active search mode</TrackLink> - it covers the full executive journey regardless of title.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXECUTIVE_PERSONAS.map((persona) => (
            <TrackLink
              key={persona.slug}
              href={`/executives/personas/${persona.slug}`}
              event={EVENT_NAMES.personaRouteSelected}
              logToUserEvents
              properties={{
                channel: 'executives',
                persona: persona.slug,
                source_route: '/executives/personas',
                target_route: `/executives/personas/${persona.slug}`,
              }}
              className="block rounded border border-slate-800 bg-slate-900 p-4 hover:border-orange-500 transition-colors"
            >
              <p className="text-[14px] font-semibold text-white mb-2">{persona.label}</p>
              <p className="text-[13px] text-slate-100 leading-relaxed">{persona.summary}</p>
            </TrackLink>
          ))}
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
