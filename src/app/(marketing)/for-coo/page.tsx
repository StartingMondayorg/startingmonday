import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import type { SituationCard, FAQ } from '@/components/LandingPage'
import { JsonLd } from '@/components/JsonLd'
import { ProofStrip } from '@/components/ProofStrip'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for C-suite leaders moving to COO roles',
  description: 'Campaign infrastructure for C-suite leaders moving into COO roles. Identify organizations where a technology-background COO fits, track operational mandate signals, and build the narrative that crosses the functional boundary. Free 30-day trial.',
  keywords: [
    'COO job search',
    'CIO to COO',
    'CTO to COO',
    'technology executive operations role',
    'chief operating officer technology background',
    'technology leader COO career',
    'COO search strategy',
    'operations executive technology background',
    'technology executive career transition',
  ],
  openGraph: {
    title: 'Starting Monday for C-suite leaders moving to COO roles',
    description: 'The technology executive who can run the business is often the most valuable person in the room. Make the CIO-to-COO move deliberately.',
    url: 'https://startingmonday.app/for-coo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for C-suite leaders moving to COO roles',
    description: 'The technology executive who can run the business is often the most valuable person in the room. Make the CIO-to-COO move deliberately.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-coo',
  },
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'scope-exceeded-title',
    headline: 'I am running operations but my title still says CIO.',
    sub: 'The scope has grown past the title. I need the seat that matches what I am already doing.',
  },
  {
    id: 'deliberate-move',
    headline: 'I want to make the CIO-to-COO move deliberately.',
    sub: 'I have the operational record. Now I need to position it at the right altitude and find the right organization.',
  },
  {
    id: 'digital-native',
    headline: 'The CEO needs an operator who understands what we built.',
    sub: 'Digital-native company, scaling fast. The COO seat needs someone who knows the technology and can run the business.',
  },
  {
    id: 'succession',
    headline: 'I am being positioned as a CEO successor.',
    sub: 'COO is the role, but the horizon is the top seat. I need to make this move count.',
  },
  {
    id: 'passive',
    headline: "I'm not looking, but my mandate keeps expanding beyond technology.",
    sub: 'Operations, finance, people. If I am running it, I should own it.',
  },
  {
    id: 'returning',
    headline: "I've been saying 'starting Monday' for months.",
    sub: 'This is the one that sticks.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'How do I position my CIO or CTO background for a COO role?',
    answer: 'The gap most technology executives fail to close is operational credibility. A technology leader who has owned P&L, led cross-functional initiatives with accountability for revenue or cost outcomes, and managed non-technology teams has the foundation. The positioning work is translating that record into operational language - specific cost savings, revenue outcomes, and decision rights that a CEO or board would recognize as operating leadership, not technology leadership. The narrative has to cross the functional boundary before the first conversation.',
  },
  {
    question: 'What kinds of companies hire COOs with technology backgrounds?',
    answer: 'Three segments are the most active: digital-native companies scaling past the point where the CEO can manage everything directly, PE-backed businesses with an operational improvement mandate that requires someone who understands the technology platform, and companies in the middle of a digital transformation where the CEO needs a COO who can close the gap between the technology investment and the business outcome. Each requires a different version of your narrative, because the mandate they are filling is different.',
  },
  {
    question: 'How long does a CIO-to-COO search typically take?',
    answer: 'Longer than a lateral CIO search, because you are asking a company to bet on a functional transition. Most CIO-to-COO moves take nine to fifteen months in active search. The searches that move fastest are the ones where the candidate has operational evidence in their record that is hard to dispute - P&L ownership, cross-functional scope beyond technology, measurable cost or revenue outcomes - and where they are already known to search firm partners who place operations leadership, not just technology leadership.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-coo/#webpage',
  url: 'https://startingmonday.app/for-coo',
  name: 'Starting Monday for COOs - Technology Executives Making the Move to Operations',
  description: 'Campaign infrastructure for CIOs and CTOs moving into COO roles. Identify where a technology-background COO fits, track operational mandate signals, and build the narrative that crosses the functional boundary.',
  isPartOf: {
    '@type': 'WebSite',
    url: 'https://startingmonday.app',
    name: 'Starting Monday',
  },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Starting Monday',
    applicationCategory: 'BusinessApplication',
    audience: {
      '@type': 'Audience',
      audienceType: 'Chief Operating Officer, COO, CIO transitioning to COO, CTO transitioning to COO',
    },
  },
}

export default function ForCooPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">Starting Monday for C-suite leaders moving to COO roles</h1>
      <ProofStrip
        metric="4.2 wks"
        label="earlier first outreach on average vs typical reactive search timing"
        source="Jan–May 2026 pilot cohort, signal-tracking group vs control"
      />
      <LandingPage
        hero={{
          eyebrow: 'A technology executive who can run the business is rare and highly valued.',
          h1Lines: ['Operations is', 'the next', 'mandate.'],
          body: 'The path from CIO or CTO into the COO seat is one of the most valuable transitions in the current market. Digital-native companies scaling past the point where the CEO can run everything need someone who understands the technology foundation and can manage the business built on top of it. PE-backed companies driving operational improvement need executives who can deliver efficiency without breaking the digital advantage. The candidate who makes this move deliberately, with a clear operational narrative, is rare enough to command the room.',
          note: 'Import your LinkedIn profile during setup. Operational in minutes.',
          steps: [
            'Identify organizations where a technology-background COO fits: digital-native companies scaling rapidly, PE-backed operations with an improvement mandate, and CEO succession contexts where operational credibility is the missing piece',
            'Track the signals that precede COO mandate creation: CEO bandwidth signals, operational complexity outgrowing current leadership structure, PE ownership transitions requiring a disciplined operator',
            'Build the narrative that bridges your technology leadership record with operational credibility - specific P&L ownership, cross-functional scope, and operational metrics that make you a COO candidate, not just a senior technology executive with broad responsibilities',
          ],
          trialNote: '30-day pilot. No credit card. Cancel any time.',
        }}
        situations={SITUATIONS}
        faqs={FAQS}
      />
    </>
  )
}

