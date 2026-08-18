import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrackLink } from '@/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { EXECUTIVE_PERSONAS } from '@/lib/persona-routes'

type Params = { slug: string }

export function generateStaticParams() {
  return EXECUTIVE_PERSONAS.map((persona) => ({ slug: persona.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const persona = EXECUTIVE_PERSONAS.find((item) => item.slug === slug)
  if (!persona) return {}

  return {
    title: `${persona.label} | Executive Persona`,
    description: persona.summary,
    alternates: {
      canonical: `https://startingmonday.app/executives/personas/${persona.slug}`,
    },
  }
}

export default async function ExecutivePersonaDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const persona = EXECUTIVE_PERSONAS.find((item) => item.slug === slug)
  if (!persona) notFound()

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-14 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-4">Executive persona</p>
        <h1 className="text-[34px] sm:text-[42px] font-bold leading-[1.1] tracking-tight mb-4">{persona.label}</h1>
        <p className="text-[16px] text-slate-300 leading-relaxed mb-8">{persona.summary}</p>

        <div className="flex flex-wrap gap-3">
          <TrackLink
            href={persona.destination}
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'executives', cta_label: `Open ${persona.slug} destination`, source_page: `/executives/personas/${persona.slug}` }}
            className="inline-block bg-orange-500 text-slate-900 text-[14px] font-semibold px-5 py-3 rounded hover:bg-orange-600 transition-colors"
          >
            Continue to persona journey
          </TrackLink>
          <TrackLink
            href="/executives/personas"
            event={EVENT_NAMES.personaRouteSelected}
            logToUserEvents
            properties={{ channel: 'executives', persona: 'persona_back_nav', source_route: `/executives/personas/${persona.slug}`, target_route: '/executives/personas' }}
            className="inline-block border border-slate-600 text-slate-100 text-[14px] font-semibold px-5 py-3 rounded hover:border-slate-300 transition-colors"
          >
            Back to persona list
          </TrackLink>
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
