import type { Metadata } from 'next'
import { TrackLink } from '@/components/TrackLink'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { COACH_PERSONAS } from '@/lib/persona-routes'

export const metadata: Metadata = {
  title: 'Coach Personas | Starting Monday',
  description: 'Choose the coach persona route that matches your operating model and see the fastest path to value.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/personas',
  },
}

export default function CoachPersonasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-[11px] font-bold tracking-[0.18em] uppercase text-orange-400">Coach persona routes</p>
          <h1 className="text-[34px] font-bold leading-[1.06] tracking-tight sm:text-[46px]">
            Choose the coaching model that gets you to value fastest.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-300 sm:text-[17px]">
            Pick the route that matches how you work today. Each path points to the same coach-first preview, but the detail pages shape the sign-up story around your practice model.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {COACH_PERSONAS.map((persona) => (
            <TrackLink
              key={persona.slug}
              href={`/coaches/personas/${persona.slug}`}
              event={EVENT_NAMES.personaRouteSelected}
              logToUserEvents
              properties={{ channel: 'coaches', persona: persona.slug, source_route: '/coaches/personas', target_route: `/coaches/personas/${persona.slug}` }}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-orange-400 hover:bg-slate-900"
            >
              <p className="mb-2 text-[13px] font-semibold text-white">{persona.label}</p>
              <p className="text-[13px] leading-relaxed text-slate-300">{persona.summary}</p>
              <p className="mt-4 text-[12px] font-semibold text-orange-300">Open this route</p>
            </TrackLink>
          ))}
        </div>

        <div className="mt-10 max-w-4xl">
          <CoachValueNudge
            title="If you want the shortest path, request the coach preview first."
            body="The preview makes the value visible in one place: the workflow, the trust boundary, and the next step. If that feels right, the persona pages will point you to the best-fit route."
            sourcePage="/coaches/personas"
            secondaryHref="/for-coaches/trust-pack"
            secondaryLabel="Read the trust pack"
          />
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
