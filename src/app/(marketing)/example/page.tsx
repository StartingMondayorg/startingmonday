import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SignalTimelineCard } from '@/app/components/SignalTimelineCard'
import { TrackLink } from '@/app/components/TrackLink'
import { Button } from '@/components/ui'
import { getBrandContextFromHosts } from '@/lib/brand'
import { HERO_EVENT_NAMES } from '@/lib/channel-metrics-events'
import { isStartingMondayHeroEvidenceEnabled } from '@/lib/feature-flags'
import { STARTING_MONDAY_HERO_CONTENT } from '@/lib/starting-monday-hero-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Live signal timeline | Starting Monday',
  description: 'A factual public-signal timeline from an anonymized Starting Monday case.',
  alternates: {
    canonical: 'https://startingmonday.app/example',
  },
}

export default async function ExamplePage() {
  const requestHeaders = await headers()
  const brand = getBrandContextFromHosts([
    requestHeaders.get('host'),
    requestHeaders.get('x-forwarded-host'),
  ])

  if (brand.isMandateSignal || !isStartingMondayHeroEvidenceEnabled() || !STARTING_MONDAY_HERO_CONTENT.proofCase) {
    notFound()
  }

  const proofCase = STARTING_MONDAY_HERO_CONTENT.proofCase

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex min-h-[48px] items-center text-[13px] font-bold uppercase tracking-[0.14em] text-primary hover:text-foreground">
          Starting Monday
        </Link>
        <p className="mt-12 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Public signal example</p>
        <h1 className="mt-4 max-w-3xl font-display text-[2.4rem] font-semibold leading-[1.04] text-foreground sm:text-[4rem]">
          What a forming role looks like.
        </h1>
        <div className="mt-10">
          <SignalTimelineCard proofCase={proofCase} altText={STARTING_MONDAY_HERO_CONTENT.timelineAlt} expanded />
        </div>
        <div className="mt-10">
          <Button
            className="min-h-[48px] rounded-full px-7 py-3 text-[14px] font-bold"
            render={
              <TrackLink
                href="/signup"
                event={HERO_EVENT_NAMES.exampleToAccessClick}
                properties={{ source_page: '/example', cta_label: 'example_get_access' }}
              />
            }
          >
            Get access
          </Button>
        </div>
        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary/90">
          Private by default. No one knows you&apos;re looking until you decide they do.
        </p>
      </div>
    </main>
  )
}
