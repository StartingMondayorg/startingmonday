import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { LandingPage } from '@/components/LandingPage'
import type { SituationCard, FAQ } from '@/components/LandingPage'
import { JsonLd } from '@/components/JsonLd'
import { getBrandContextFromHosts } from '@/lib/brand'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const brand = getBrandContextFromHosts([
    requestHeaders.get('host'),
    requestHeaders.get('x-forwarded-host'),
  ])

  if (brand.isMandateSignal) {
    return {
      title: 'MandateSignal - See mandates before they are posted',
      description: 'MandateSignal helps recruiting and search teams detect likely-to-open roles early, identify decision-path stakeholders, and prioritize outreach before broad posting.',
      keywords: [
        'mandate signal intelligence',
        'recruiter pipeline intelligence',
        'retained search signals',
        'executive role forecasting',
        'pre-posting mandate detection',
      ],
      openGraph: {
        title: 'MandateSignal - See mandates before they are posted',
        description: 'Detect likely-to-open mandates early, map decision-path stakeholders, and act before broad posting.',
        url: 'https://mandatesignal.com',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'MandateSignal - See mandates before they are posted',
        description: 'Detect likely-to-open mandates early, map decision-path stakeholders, and act before broad posting.',
      },
      alternates: {
        canonical: 'https://mandatesignal.com',
      },
    }
  }

  return {
    title: 'Starting Monday - Be on the shortlist before the role is posted',
    description: 'Starting Monday helps senior leaders find likely-to-open roles early, identify the people shaping the shortlist, and take the next relationship action before the posting goes public.',
    keywords: [
      'executive job search tools',
      'CIO job search',
      'CTO job search',
      'technology executive career',
      'executive pipeline tracker',
      'AI interview prep leaders',
      'executive search campaign',
      'job search CRM leaders',
    ],
    openGraph: {
      title: 'Starting Monday - Be on the shortlist before the role is posted',
      description: 'Find likely-to-open executive roles early, map the decision path, and act before the shortlist is crowded.',
      url: 'https://startingmonday.app',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Starting Monday - Be on the shortlist before the role is posted',
      description: 'Find likely-to-open executive roles early, map the decision path, and act before the shortlist is crowded.',
    },
    alternates: {
      canonical: 'https://startingmonday.app',
    },
  }
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'urgent',
    headline: 'My role was eliminated.',
    sub: 'I need to land well. Quickly.',
  },
  {
    id: 'building',
    headline: "I'm still in my role. The decision is made.",
    sub: 'Building my target list and warming up relationships before I announce anything.',
  },
  {
    id: 'vp-up',
    headline: "I'm ready for the next seat.",
    sub: 'VP to CIO. Director to VP. I have the record. Now I need the campaign.',
  },
  {
    id: 'monitor',
    headline: "I'm not searching yet. I want to monitor the market.",
    sub: 'Know which opportunities are forming before you need to act. No commitment. No noise.',
  },
  {
    id: 'selective',
    headline: "I left on my terms. I'm being selective.",
    sub: 'Finding the right seat, not the first available one. I want early signal and prep rigor.',
  },
  {
    id: 'returning',
    headline: 'I want to run a better search than last time.',
    sub: 'Sharper process. Earlier intelligence. Fewer reactive moments.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'I already have a strong network. How does this add value?',
    answer: 'Most strong networks are reactive: you know who to call when you need something. Starting Monday makes them proactive: you know when to call, what to say, and which relationships to prioritize before the market moves. Your network is an asset. This makes it strategic.',
  },
  {
    question: 'Is this really different from doing this myself?',
    answer: 'The pieces exist: LinkedIn, company research, conversation prep. What differs is timing and discipline. Starting Monday surfaces opportunities before they are public, flags which relationships matter most, and structures execution so you don\'t lose momentum between conversations. You move earlier. You move with more certainty.',
  },
  {
    question: 'Is my search completely private?',
    answer: 'Completely. No employer visibility, no recruiter access to your data, no sale of information. We do not monetize your search. You own everything you enter, and you can delete your entire account whenever you choose.',
  },
  {
    question: 'Will this add to my workload?',
    answer: 'No. A daily three-minute brief and one weekly update. That\'s it. The system is built around leaders already in motion. It reduces cognitive load by centralizing signal, timing, and execution tracking in one place.',
  },
  {
    question: 'What does it cost?',
    answer: 'Forty-nine dollars monthly, or free for your first thirty days. No credit card required, cancel anytime. Designed to fit the search window, not to lock you into long contracts.',
  },
  {
    question: 'How do I know I can trust this?',
    answer: 'The platform was built by search leaders who ran their own campaigns against the same constraints you face. It\'s grounded in research with leaders at Fortune 500, private equity, and venture firms. Read the evidence hub to see the research backing the approach.',
  },
]

const MANDATE_SITUATIONS: SituationCard[] = [
  {
    id: 'bd-feed',
    headline: 'My team needs cleaner business-development timing.',
    sub: 'We want the brief while it is forming, not after the listing is saturated.',
  },
  {
    id: 'account-priority',
    headline: 'We track too many accounts without priority discipline.',
    sub: 'Signal-ranked queues tell us which companies to touch this week.',
  },
  {
    id: 'pre-posting',
    headline: 'I need to see likely mandates before they post.',
    sub: 'Move from reactive sourcing to proactive mandate positioning.',
  },
  {
    id: 'stakeholder-map',
    headline: 'We need the right stakeholder map before first outreach.',
    sub: 'Identify decision-path contacts and likely influence nodes early.',
  },
]

const MANDATE_FAQS: FAQ[] = [
  {
    question: 'Who is MandateSignal for?',
    answer: 'MandateSignal is designed for retained search teams, recruiter-led business development functions, and talent operators who need early visibility into likely-to-open mandates.',
  },
  {
    question: 'What makes this different from job-board monitoring?',
    answer: 'Job boards show demand after a role is public. MandateSignal is built for pre-posting context by tracking clustered company signals that often precede formal search activity.',
  },
  {
    question: 'Can this run as a standalone workflow?',
    answer: 'Yes. MandateSignal is delivered as its own product experience on mandatesignal.com with dedicated branding, canonical URLs, and product positioning.',
  },
]

function buildHomeJsonLd(origin: string, brandName: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: brandName,
        alternateName: [brandName.replace(/\s+/g, '')],
        url: origin,
        logo: `${origin}/icon.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: brandName,
        alternateName: [brandName.replace(/\s+/g, '')],
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${origin}/#app`,
        name: brandName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description,
        url: origin,
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${origin}/#webpage`,
        url: origin,
        name: `${brandName} - AI Career Platform for Senior Technology Leaders`,
        isPartOf: { '@id': `${origin}/#website` },
        description,
      },
    ],
  }
}

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestHeaders = await headers()
  const brand = getBrandContextFromHosts([
    requestHeaders.get('host'),
    requestHeaders.get('x-forwarded-host'),
  ])

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const variantParam = Array.isArray(resolvedSearchParams?.lp_variant)
    ? resolvedSearchParams.lp_variant[0]
    : resolvedSearchParams?.lp_variant
  const experimentVariant = variantParam === 'proof_first' ? 'proof_first' : 'control'

  const isMandateSignal = brand.isMandateSignal
  const jsonLd = isMandateSignal
    ? buildHomeJsonLd(
        brand.origin,
        brand.name,
        'MandateSignal is a standalone intelligence workflow for recruiting and search teams that need early mandate visibility and prioritized outreach execution.',
      )
    : buildHomeJsonLd(
        brand.origin,
        brand.name,
        'Pipeline tracking, company intelligence, and AI-powered interview prep for senior leaders in active search.',
      )

  const hero = isMandateSignal
    ? {
        eyebrow: 'See the mandate before the posting goes public.',
        h1Lines: ['Pre-posting mandate intelligence', 'for search and recruiting teams.'],
        claimMethodLabel: '',
        claimMethodHref: '',
        claimEvidenceLabel: 'How signal-first mandate detection works ->',
        claimEvidenceHref: '/method-and-evidence#timing-model',
        bodyPreamble: 'Standalone product for retained search and recruiter business development workflows.',
        body: 'MandateSignal surfaces role-shaping company movement early, prioritizes target accounts, and helps your team take the next high-value outreach action before the market crowds in.',
        competitiveEdge: 'Built for proactive mandate creation, not reactive job-board response.',
        steps: [
          'Monitor role-shaping company signals across your target account list.',
          'Prioritize the accounts most likely to open relevant mandates soon.',
          'Act early with stakeholder-aware outreach while the brief is still forming.',
        ],
        trialNote: 'MandateSignal runs as a standalone product experience on mandatesignal.com. Private workspace per account.',
      }
    : {
        eyebrow: 'Find roles before they are posted. Meet the decision-makers. Start Monday.',
        h1Lines: ['Be on the shortlist before the role is posted.'],
        claimMethodLabel: '',
        claimMethodHref: '',
        claimEvidenceLabel: 'Evidence Hub for leaders and their partners ->',
        claimEvidenceHref: '/evidence-hub#early-signals',
        bodyPreamble: 'For senior leaders who win through timing and relationships, not job boards.',
        body: 'Reputation opens doors. Timing decides outcomes. Starting Monday gives you an early view of likely-to-open roles and a clear map of the people who will influence the hire.',
        competitiveEdge: '',
        steps: [
          'See likely-to-open roles before most candidates know they exist.',
          'Identify the decision-path people who shape the shortlist.',
          'Take the next relationship action while timing is still on your side.',
        ],
        trialNote: 'Private by default: visible only to you and explicitly invited collaborators. Free for 30 days. No credit card. No employer visibility.',
      }

  return (
    <>
      <h1 className="sr-only">{brand.name}</h1>
      <JsonLd data={jsonLd} />
      <LandingPage
        hero={hero}
        situations={isMandateSignal ? MANDATE_SITUATIONS : SITUATIONS}
        faqs={isMandateSignal ? MANDATE_FAQS : FAQS}
        showPersonaSelector
        showFirstWeekSpine={!isMandateSignal}
        experimentVariant={experimentVariant}
        brandWordmark={{
          primary: brand.wordmarkPrimary,
          accent: brand.wordmarkAccent,
        }}
      />
    </>
  )
}

