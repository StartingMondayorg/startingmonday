import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import type { SituationCard, FAQ } from '@/components/LandingPage'
import { JsonLd } from '@/components/JsonLd'
import { ProofStrip } from '@/components/ProofStrip'

export const metadata: Metadata = {
  title: 'Starting Monday for CPOs - Chief Product Officer Search Campaign Infrastructure',
  description: 'Campaign infrastructure for Chief Product Officers and VP Product leaders making the step to CPO. Find companies where product is the strategy, track the signals that precede product leadership searches. Free 30-day trial.',
  keywords: [
    'CPO job search',
    'Chief Product Officer job search',
    'VP product to CPO',
    'CPO career',
    'product executive job search',
    'chief product officer search strategy',
    'CPO interview preparation',
    'product leader career transition',
  ],
  openGraph: {
    title: 'Starting Monday for CPOs - Chief Product Officer Search Campaign Infrastructure',
    description: 'Find the company where product is the strategy, not a function. Campaign infrastructure for product executives.',
    url: 'https://startingmonday.app/for-cpo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for CPOs - Chief Product Officer Search Campaign Infrastructure',
    description: 'Find the company where product is the strategy, not a function. Campaign infrastructure for product executives.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-cpo',
  },
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'shipped',
    headline: 'My company shipped its product. My mandate is complete.',
    sub: 'The build phase is done. I need a company at the right stage of the next one.',
  },
  {
    id: 'vp-to-cpo',
    headline: 'I am ready to move from VP of Product to CPO.',
    sub: 'I have led the function. Now I need the seat, the board exposure, and the full mandate.',
  },
  {
    id: 'new-ceo',
    headline: 'The new CEO has a different product vision.',
    sub: 'The direction changed. I need a company where my approach to product is the approach.',
  },
  {
    id: 'scale',
    headline: 'I want to move from a growth-stage CPO to an enterprise mandate.',
    sub: 'I have built at speed. Now I want to build at scale, with the complexity that comes with it.',
  },
  {
    id: 'passive',
    headline: "I am not looking, but the product roadmap has stalled.",
    sub: 'Strategy without execution. I know the difference. Time to find somewhere that does not.',
  },
  {
    id: 'board-not-ready',
    headline: 'The CEO wants a product executive who can present to the board.',
    sub: 'I have the record. I need to close the gap between product credibility and board-level fluency.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'How long does a CPO job search typically take?',
    answer: 'A CPO search typically runs six to twelve months for VP of Product candidates making the step up, and three to nine months for experienced CPOs in active transition. The searches that move fastest are those where the candidate has an existing relationship with the hiring CEO or a search firm that has already flagged their name. The best CPO mandates are rarely posted publicly - they are filled from the networks of CEOs and board members who define the role.',
  },
  {
    question: 'What do companies look for when hiring a Chief Product Officer?',
    answer: 'The CPO evaluation centers on three questions: Does this person understand our market and users as well as we do? Have they shipped at the scale and complexity we need? And can they build a product organization that will outlast their tenure? The CPO who wins in competitive searches has a point of view on the company\'s product strategy before the first conversation - and can articulate specifically where the opportunity is and how they would approach it.',
  },
  {
    question: 'How do I make the move from VP of Product to Chief Product Officer?',
    answer: 'The VP to CPO move requires demonstrating you have already been operating at CPO scope - board-level exposure, full ownership of product strategy and roadmap, and experience hiring and developing product leaders beneath you. The candidates who make the move fastest identify companies where their specific record maps to what the company needs to build next, and position themselves for those conversations before the role is defined.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-cpo/#webpage',
  url: 'https://startingmonday.app/for-cpo',
  name: 'Starting Monday for CPOs - Chief Product Officer Search Campaign Infrastructure',
  description: 'Campaign infrastructure for Chief Product Officers. Find companies where product is the strategy, track signals that precede product leadership mandates, and prepare for board-level conversations.',
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
      audienceType: 'Chief Product Officer, CPO, VP of Product, Head of Product, VP Product Management',
    },
  },
}

export default function ForCpoPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">Starting Monday for Chief Product Officer searches</h1>
      <ProofStrip
        metric="1-3 wks"
        label="typical lead time on role-shaping signals before broad-market posting"
        source="Internal timing model with method notes at /references"
      />
      <LandingPage
        sourcePage="/for-cpo"
        hero={{
          eyebrow: 'The strongest CPO mandates are at companies where product is the strategy, not a function.',
          h1Lines: ['Find the company', 'that needs', 'what you build.'],
          body: 'The Chief Product Officer search is about fit at a level that most hiring processes cannot surface. Not just industry or stage - the alignment between how a company thinks about product and how you have built it. The CPO who lands the right role does not scan job boards. They identify organizations where product is a board-level investment, where the CEO came up through product or has made it central to strategy, and where their specific record maps directly to what the company needs to build next.',
          note: 'Import your LinkedIn profile during setup. Operational in minutes.',
          steps: [
            'Identify companies where the product mandate is genuinely C-suite: board-level investment, a CEO who understands product deeply, and a current leadership gap or transition that creates a real opening rather than a posted backfill',
            'Watch the signals that precede CPO searches: new CEOs resetting product vision, Series C and D companies formalizing product leadership for the first time, and public companies where the product has fallen behind the competitive market',
            'Prepare a brief that speaks in two registers: the visionary register (a point of view on where the market is going and how this company should build for it) and the executive register (evidence that you have shipped at scale and built teams that outlasted your tenure). Evaluators expect both - the first earns their interest, the second closes their confidence.',
          ],
          trialNote: '30-day pilot. No credit card. Cancel any time.',
        }}
        situations={SITUATIONS}
        faqs={FAQS}
      />
    </>
  )
}
