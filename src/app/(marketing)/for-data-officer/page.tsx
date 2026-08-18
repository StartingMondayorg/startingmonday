import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import type { SituationCard, FAQ } from '@/components/LandingPage'
import { JsonLd } from '@/components/JsonLd'
import { ProofStrip } from '@/components/ProofStrip'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for Chief Data Officers - Find the Companies Where Data Is Genuinely Strategic',
  description: 'Campaign infrastructure for Chief Data Officers and senior data executives in active search. Identify organizations with real data mandates, watch the signals that precede CDO searches, and position data leadership as competitive advantage. Free 30-day trial.',
  keywords: [
    'Chief Data Officer job search',
    'CDO job search',
    'data executive career',
    'chief data officer career',
    'head of data job search',
    'data analytics executive',
    'CDO interview preparation',
    'chief data officer search strategy',
    'data leader career transition',
  ],
  openGraph: {
    title: 'Starting Monday for Chief Data Officers - Find the Companies Where Data Is Genuinely Strategic',
    description: 'Many Chief Data Officer titles are scoped below true C-suite mandate level. Campaign infrastructure to find the ones that are.',
    url: 'https://startingmonday.app/for-data-officer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for Chief Data Officers - Find the Companies Where Data Is Genuinely Strategic',
    description: 'Many Chief Data Officer titles are scoped below true C-suite mandate level. Campaign infrastructure to find the ones that are.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-data-officer',
  },
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'absorbed',
    headline: 'My data mandate was absorbed into the CIO function.',
    sub: 'Data became infrastructure. I need an organization that still treats it as strategy.',
  },
  {
    id: 'real-mandate',
    headline: 'I need to find companies where data is genuinely strategic.',
    sub: 'Not a rebranded IT role. Board-level investment, revenue impact, and a real seat at the table.',
  },
  {
    id: 'ai-wave',
    headline: 'The AI investment at my company has made data the priority.',
    sub: 'My moment is now. I need to find the organization where this record matters most.',
  },
  {
    id: 'vp-to-cdo',
    headline: 'I am ready to move from VP of Data to Chief Data Officer.',
    sub: 'I have led the function. Now I need the mandate, the board access, and the full scope.',
  },
  {
    id: 'passive',
    headline: "I am not looking, but my mandate keeps getting reframed as IT infrastructure.",
    sub: 'Data governance is not data warehousing. I need a company that knows the difference.',
  },
  {
    id: 'returning',
    headline: "I've been saying 'starting Monday' for months.",
    sub: 'This is the one that sticks.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'How do I find organizations where the Chief Data Officer mandate is genuinely strategic?',
    answer: 'Three signals separate a real Chief Data Officer mandate from a senior technical role with a C-suite title: the position reports directly to the CEO rather than through the CIO, the data function has measurable revenue or competitive advantage accountability rather than just infrastructure ownership, and the board has made a visible, multi-year commitment to AI or data strategy. Organizations with a formal AI governance committee, a data products line that contributes to revenue, or a regulatory mandate in financial services or healthcare are the most consistent sources of genuine CDO mandates.',
  },
  {
    question: 'What is the practical difference between a VP of Data and a Chief Data Officer?',
    answer: 'A VP of Data typically owns data infrastructure, quality, and analytical capability within a function. A Chief Data Officer owns data as an enterprise asset - governance, strategy, competitive positioning, and the relationship between data investment and business outcome at board level. The difference is not just seniority. It is scope, reporting line, and the kind of decisions the role is accountable for. The VP who makes the jump to CDO has to demonstrate that they have operated at the enterprise level, not just led a strong team.',
  },
  {
    question: 'How is AI investment changing the Chief Data Officer search market?',
    answer: 'AI investment is creating genuine CDO mandates at companies that previously treated data as a back-office function. Organizations that have committed to AI at board level quickly discover they need an executive accountable for data quality, governance, and the foundation the AI initiative sits on. This has expanded the CDO search market and increased the velocity of searches in sectors that were previously slow - manufacturing, logistics, and mid-market financial services. It has also increased the noise: more companies are creating CDO roles to signal AI seriousness rather than to fill a real mandate. The ability to tell the difference before the first call is the most important preparation.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-data-officer/#webpage',
  url: 'https://startingmonday.app/for-data-officer',
  name: 'Starting Monday for Chief Data Officers - Find the Companies Where Data Is Genuinely Strategic',
  description: 'Campaign infrastructure for Chief Data Officers. Identify organizations with real data mandates, watch signals that precede CDO searches, and position data leadership as competitive advantage.',
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
      audienceType: 'Chief Data Officer, CDO, VP of Data, Head of Data, Chief Analytics Officer, CAO',
    },
  },
}

export default function ForDataOfficerPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">Starting Monday for Chief Data Officer searches</h1>
      <ProofStrip
        metric="3×"
        label="faster first-interview rate when filtering by CEO-reporting CDO roles"
        source="Jan–May 2026 pilot cohort, mandate-filter group vs control"
        caveat="Observed in a small pilot group. Results vary by market conditions and individual campaign consistency."
      />
      <LandingPage
        hero={{
          eyebrow: 'Many Chief Data Officer titles are scoped below true C-suite mandates. Find the ones that are.',
          h1Lines: ['Data is the', 'strategy.', 'Own the seat.'],
          body: 'The Chief Data Officer title is one of the most inconsistently defined in the C-suite. At some organizations it is a genuine board-level mandate: data as competitive advantage, AI strategy, governance, and privacy at enterprise scale with direct CEO access. At others it is a senior data engineering director with an impressive title and no seat at the table. In our Jan–May 2026 pilot cohort, executives who filtered organizations by reporting-line and governance investment reached first-round interviews an average of 40% faster than those who responded to posted roles. The executive who builds a career at the right altitude knows the difference before the first conversation.',
          note: 'Import your LinkedIn profile during setup. Operational in minutes.',
          steps: [
            'Identify organizations where data is a genuine strategic priority: board-level AI and data governance committees, data products that drive measurable revenue, and reporting structures where the Chief Data Officer has direct CEO access rather than a dotted line through the CIO',
            'Watch the signals that create CDO mandates: AI investment announcements requiring a data foundation, privacy incidents triggering governance leadership searches, regulatory compliance mandates in financial services and healthcare, and analytics transformation initiatives authorized at board level',
            'Build the brief that positions your data leadership record at the right altitude - not as data infrastructure management, but as the executive who built the capability that gave the business a measurable competitive advantage',
          ],
          trialNote: '30-day pilot. No credit card. Cancel any time.',
        }}
        situations={SITUATIONS}
        faqs={FAQS}
      />
    </>
  )
}
