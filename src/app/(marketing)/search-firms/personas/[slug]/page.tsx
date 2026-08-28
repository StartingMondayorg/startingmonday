import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrackLink } from '@/app/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { SEARCH_FIRM_PERSONAS } from '@/lib/persona-routes'

const personaRoleDetails: Record<string, { outcomes: string[]; pilotFocus: string; governance: string }> = {
  'partner-firm-lead': {
    outcomes: ['Mandate economics improve before rollout expands.', 'Partner time is spent on judgment, not recap.', 'Bid differentiation is visible in kickoff quality.'],
    pilotFocus: 'Name one sponsor, pick one mandate, and measure prep-hour recovery plus first-slate confidence.',
    governance: 'Legal review should confirm confidentiality boundaries and commercial scope before candidate activation.',
  },
  'principal-delivery-lead': {
    outcomes: ['Kickoff materials become consistent across consultants.', 'Candidate prep gets measured before round one.', 'Search resets are reviewed against one scorecard.'],
    pilotFocus: 'Use one live mandate and one weekly review to compare kickoff quality before and after the brief layer.',
    governance: 'Procurement and sponsor decisions should be settled early so delivery teams are not waiting mid-pilot.',
  },
  'candidate-success-owner': {
    outcomes: ['Candidate handoff quality becomes easier to audit.', 'First-round readiness is visible before interviews begin.', 'Trial decisions use completion and advancement signals, not anecdotes.'],
    pilotFocus: 'Track candidate readiness, handoff completion, and first-round movement against the day-0 baseline.',
    governance: 'Role-scoped visibility and candidate-controlled sharing should be confirmed before any partner view is granted.',
  },
}

type Params = { slug: string }

export function generateStaticParams() {
  return SEARCH_FIRM_PERSONAS.map((persona) => ({ slug: persona.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const persona = SEARCH_FIRM_PERSONAS.find((item) => item.slug === slug)
  if (!persona) return {}
  return {
    title: `${persona.label} | Search-Firm Persona`,
    description: persona.summary,
    alternates: { canonical: `https://startingmonday.app/search-firms/personas/${persona.slug}` },
  }
}

export default async function SearchFirmPersonaDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const persona = SEARCH_FIRM_PERSONAS.find((item) => item.slug === slug)
  if (!persona) notFound()
  const details = personaRoleDetails[persona.slug]

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-14 text-foreground sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Search-firm persona</p>
        <h1 className="max-w-3xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">{persona.label}</h1>
        <h2 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Mandate summary</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{persona.summary}</p>

        <section className="mt-6 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <h2 className="text-[22px] font-semibold text-foreground">Pilot path for this role</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{details?.pilotFocus}</p>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Governance line</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{details?.governance}</p>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Outcomes to verify</h3>
          <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {details?.outcomes.map((outcome) => (
              <li key={outcome} className="flex gap-2">
                <span className="font-bold text-primary">+</span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Next actions</h3>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackLink
            href={persona.destination}
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: `Open ${persona.slug} destination`, source_page: `/search-firms/personas/${persona.slug}` }}
            className="inline-block rounded-full bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue to search firm journey
          </TrackLink>
          <TrackLink
            href="/search-firms/procurement"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: `Review procurement path ${persona.slug}`, source_page: `/search-firms/personas/${persona.slug}` }}
            className="inline-block rounded-full border border-border px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
          >
            Review pilot requirements
          </TrackLink>
          <TrackLink
            href="/partners?channel=search-firms#apply"
            event={EVENT_NAMES.channelEntryClicked}
            logToUserEvents
            properties={{ channel: 'search_firms', cta_label: `Apply to partner program ${persona.slug}`, source_page: `/search-firms/personas/${persona.slug}` }}
            className="inline-block rounded-full border border-border px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
          >
            Apply to partner program
          </TrackLink>
          <TrackLink
            href="/search-firms/personas"
            event={EVENT_NAMES.personaRouteSelected}
            logToUserEvents
            properties={{ channel: 'search_firms', persona: 'persona_back_nav', source_route: `/search-firms/personas/${persona.slug}`, target_route: '/search-firms/personas' }}
            className="inline-block rounded-full border border-border px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
          >
            Back to persona list
          </TrackLink>
        </div>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
