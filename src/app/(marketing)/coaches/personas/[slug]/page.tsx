import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrackLink } from '@/components/TrackLink'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { COACH_PERSONAS } from '@/lib/persona-routes'

type Params = { slug: string }

export function generateStaticParams() {
  return COACH_PERSONAS.map((persona) => ({ slug: persona.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const persona = COACH_PERSONAS.find((item) => item.slug === slug)
  if (!persona) return {}
  return {
    title: `${persona.label} | Coach Persona`,
    description: persona.summary,
    alternates: { canonical: `https://startingmonday.app/coaches/personas/${persona.slug}` },
  }
}

export default async function CoachPersonaDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const persona = COACH_PERSONAS.find((item) => item.slug === slug)
  if (!persona) notFound()

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-[11px] font-bold tracking-[0.18em] uppercase text-orange-400">Coach persona</p>
        <h1 className="text-[34px] font-bold leading-[1.06] tracking-tight sm:text-[46px]">{persona.label}</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-300 sm:text-[17px]">{persona.summary}</p>

        <div className="mt-8 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">What this route does</p>
            <p className="text-[14px] leading-relaxed text-slate-300">
              Use this page to see how the coach preview fits your operating model before you commit to a deeper rollout.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
          <TrackLink
            href={persona.destination}
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'coaches', cta_label: `Open ${persona.slug} destination`, source_page: `/coaches/personas/${persona.slug}` }}
            className="inline-flex items-center justify-center rounded bg-orange-500 px-5 py-3 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-orange-600"
          >
            Continue to coach journey
          </TrackLink>
          <TrackLink
            href="/coaches/personas"
            event={EVENT_NAMES.personaRouteSelected}
            logToUserEvents
            properties={{ channel: 'coaches', persona: 'persona_back_nav', source_route: `/coaches/personas/${persona.slug}`, target_route: '/coaches/personas' }}
            className="inline-flex items-center justify-center rounded border border-slate-600 px-5 py-3 text-[14px] font-semibold text-slate-100 transition-colors hover:border-slate-300"
          >
            Back to persona list
          </TrackLink>
          </div>
        </div>

        <div className="mt-8 max-w-4xl">
          <CoachValueNudge
            title="Still deciding? The preview will show the value before you have to commit."
            body="You can compare the route, the trust story, and the workflow fit from one page. That keeps the next step obvious and makes sign-up feel like a sensible test instead of a leap."
            sourcePage={`/coaches/personas/${persona.slug}`}
            secondaryHref="/for-coaches"
            secondaryLabel="Open the coach preview"
          />
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
