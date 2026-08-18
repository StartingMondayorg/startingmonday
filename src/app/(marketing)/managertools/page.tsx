import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'
import type { FAQ, SituationCard } from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'Starting Monday - Be on the shortlist before the role is posted',
  description: 'A disciplined, editorial search operating system for the Manager Tools community. Try it free for 60 days, keep your search private, and help shape the experience.',
  alternates: { canonical: 'https://startingmonday.app/managertools' },
  openGraph: {
    title: 'Starting Monday - Be on the shortlist before the role is posted',
    description: 'Manager Tools members get 60 days free with private-by-default search support and a direct feedback loop.',
    url: 'https://startingmonday.app/managertools',
    type: 'website',
  },
}

const MANAGER_TOOLS_SITUATIONS: SituationCard[] = [
  {
    id: 'managertools-community',
    headline: 'Manager Tools members running a high-stakes executive search.',
    sub: 'Structured weekly rhythm with calmer execution, sharper timing, and fewer distractions.',
  },
]

const MANAGER_TOOLS_FAQS: FAQ[] = [
  {
    question: 'What is special for the Manager Tools cohort?',
    answer: 'Manager Tools members get 60 days free, private-by-default search operations, and a direct feedback loop with the Starting Monday team.',
  },
  {
    question: 'How should I share feedback?',
    answer: 'Please use the in-product feedback form after signup or reply to cohort emails so we can improve quickly based on your experience.',
  },
]

export default function ManagerToolsPage() {
  return (
    <LandingPage
      sourcePage="/managertools"
      hero={{
        eyebrow: 'Find roles before they are posted. Meet the decision-makers. Start Monday.',
        h1Lines: ['Be on the shortlist before the role is posted.'],
        body: 'Starting Monday shows you which senior leader roles are likely to open, who influences each hiring decision, and what to do so you can enter before the public posting window is crowded.',
        trialNote: 'Private by default: visible only to you and explicitly invited collaborators. Free for 60 days. No credit card. No employer visibility.',
      }}
      situations={MANAGER_TOOLS_SITUATIONS}
      faqs={MANAGER_TOOLS_FAQS}
      proofHighlights={[{ metric: 'Manager Tools cohort', detail: 'Warm onboarding, private-by-default execution, and feedback-driven iteration.' }]}
    />
  )
}
