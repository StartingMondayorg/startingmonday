import type { Metadata } from 'next'
import { FeaturesClient } from './features-client'
import { listFeatureDocCards } from '@/lib/feature-docs'

export const metadata: Metadata = {
  title: 'Features and Onboarding Docs | Starting Monday',
  description: 'Browse full feature one-pagers, quick starts, and onboarding analysis documents for each Starting Monday persona.',
  alternates: { canonical: 'https://startingmonday.app/features' },
}

export default async function FeaturesPage() {
  const docs = await listFeatureDocCards()
  return (
    <>
      <h1 className="sr-only">Starting Monday features and onboarding docs</h1>
      <p className="sr-only">Privacy-first by design.</p>
      <FeaturesClient docs={docs} />
    </>
  )
}