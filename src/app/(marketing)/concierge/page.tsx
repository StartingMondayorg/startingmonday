import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ConciergeWaitlist } from './concierge-waitlist'

export const metadata: Metadata = {
  title: 'Confidential Beta and Executive Concierge - Starting Monday',
  description: 'Apply privately for the 10-seat confidential beta or request Executive Concierge. Founder-reviewed applications for senior technology leaders in active transition.',
}

export default function ConciergePage() {
  return (
    <>
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      <section className="sr-only" aria-label="Executive concierge summary">
        <h1>Executive concierge application</h1>
        <p>Trust and confidentiality: application details remain private and are used only for beta or concierge enrollment review.</p>
        <p>Outcome: accepted participants get a structured transition plan with founder review and weekly Momentum Signal tracking.</p>
        <Link href="/demo">Get started with the product demo</Link>
      </section>
      <Suspense>
        <ConciergeWaitlist />
      </Suspense>
    </>
  )
}
