import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import type { SituationCard, FAQ } from '@/components/LandingPage'
import { JsonLd } from '@/components/JsonLd'
import { ProofStrip } from '@/components/ProofStrip'

export const metadata: Metadata = {
  title: 'Starting Monday for CISOs - Chief Information Security Officer Search Infrastructure',
  description: 'Campaign infrastructure for CISOs in active search. Monitor the events that open mandates before searches are authorized, position security as business risk management, and build toward a board seat. Free 30-day trial.',
  keywords: [
    'CISO job search',
    'Chief Information Security Officer job search',
    'CISO career',
    'cybersecurity executive job search',
    'CISO to board',
    'CISO interview preparation',
    'information security executive search',
    'CISO career path',
    'cybersecurity executive career',
    'CISO search strategy',
  ],
  openGraph: {
    title: 'Starting Monday for CISOs - Chief Information Security Officer Search Infrastructure',
    description: 'Many CISO mandates open after a wake-up call. Be in position before the search is authorized.',
    url: 'https://startingmonday.app/for-ciso',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for CISOs - Chief Information Security Officer Search Infrastructure',
    description: 'Many CISO mandates open after a wake-up call. Be in position before the search is authorized.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-ciso',
  },
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'acquired',
    headline: 'My company was acquired and security is being consolidated.',
    sub: 'M&A ended my mandate. I need to find the next organization before the market knows I am available.',
  },
  {
    id: 'board',
    headline: 'I want to build a path to a board seat.',
    sub: 'Audit committee. Cyber committee. I have the record. Now I need the positioning.',
  },
  {
    id: 'narrative',
    headline: 'I need to stop being seen as a technical leader.',
    sub: 'My record is in business risk management. My resume still reads like a security engineer.',
  },
  {
    id: 'scale',
    headline: 'I am ready to move to a larger mandate.',
    sub: 'Startup CISO to enterprise, or regulated industry, or global scope. I need to make the jump deliberately.',
  },
  {
    id: 'passive',
    headline: "I'm not looking, but the mandate keeps shrinking.",
    sub: 'Budget cut, scope narrowed, reporting line moved. The signals are there.',
  },
  {
    id: 'returning',
    headline: "I've been saying 'starting Monday' for months.",
    sub: 'This is the one that sticks.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'What events typically trigger a CISO search?',
    answer: 'Most CISO searches are event-driven, not planned. A breach or near-miss, an SEC disclosure obligation, an IPO requiring formal security governance, a regulatory action, an acquisition creating a security integration mandate, or a board cybersecurity committee formation that exposes the gap in executive-level security leadership. These events create urgency and compress the search timeline. The CISO who is already known to the right search firm partners when the event occurs is the candidate who gets the call.',
  },
  {
    question: 'How do I position my security record for a board audience?',
    answer: 'The board hears security in the language of business risk, not technical risk. Every significant outcome in your record should be framed as a risk management decision with a financial or reputational dimension - not a technical problem you solved. How much exposure did you remove, at what cost, and how does the organization operate differently now? The CISO who can present their record in those terms is the candidate a board can evaluate. The one who leads with frameworks and certifications is the one they have trouble distinguishing from the last person in the role.',
  },
  {
    question: 'How long does a CISO job search typically take?',
    answer: 'CISO searches at enterprise scale typically run five to twelve months in active market. Event-driven searches at companies with urgent mandates can compress to six to ten weeks when the candidate is already known to the placing firm. The variables are the same as any C-suite search: how warm your search firm relationships are, whether your narrative is already calibrated for the specific type of mandate you are pursuing, and whether you are in market before or after the event that created the opening.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-ciso/#webpage',
  url: 'https://startingmonday.app/for-ciso',
  name: 'Starting Monday for CISOs - Chief Information Security Officer Search Infrastructure',
  description: 'Campaign infrastructure for CISOs in active search. Monitor breach disclosures, regulatory actions, and compliance events before searches are authorized. Position security as business risk.',
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
      audienceType: 'Chief Information Security Officer, CISO, VP Information Security, Head of Cybersecurity',
    },
  },
}

export default function ForCisoPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">Starting Monday for CISO searches</h1>
      <ProofStrip
        metric="5×"
        label="more event-triggered outreach initiated by pilot CISO-track executives vs baseline"
        source="Jan–May 2026 pilot cohort, security-executive segment"
        caveat="Small sample; observed in structured signal-tracking group. Results vary."
      />
      <LandingPage
        sourcePage="/for-ciso"
        hero={{
          eyebrow: 'Many CISO mandates open after a wake-up call.',
          h1Lines: ['Security is the', 'business risk.', 'Position yourself there.'],
          body: 'CISO searches are event-driven. A breach, an IPO, a regulatory action, an acquisition - these create the urgency that turns a budgeted headcount into an authorized search. The candidate who lands the right role is the one who has been watching those events at their target organizations and can walk in as the person who understands not just the technical problem but the board-level exposure. Starting Monday surfaces those signals before the search firm is engaged.',
          note: 'Import your LinkedIn profile during setup. Operational in minutes.',
          steps: [
            'Monitor target organizations for breach disclosures, regulatory actions, IPO filings, and board cybersecurity committee formations - these events precede authorized CISO searches by weeks',
            'Track the single most important signal: does this CISO report to the CIO or directly to the CEO? That reporting line tells you everything about how seriously the board takes security risk',
            'Build the narrative that positions your security record as business risk management and board-level communication, not technical infrastructure - that is the conversation that gets you in front of the right people',
          ],
          trialNote: '30-day pilot. No credit card. Cancel any time.',
        }}
        situations={SITUATIONS}
        faqs={FAQS}
      />
    </>
  )
}
