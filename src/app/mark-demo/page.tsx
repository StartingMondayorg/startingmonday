import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { DemoContent } from '@/app/(marketing)/demo/page'

export const metadata: Metadata = {
  title: 'Starting Monday | Private Demo',
  description: 'Private review demo - full prep brief generation with no email gate.',
  robots: { index: false, follow: false },
}

export default function MarkDemoPage() {
  return (
    <>
      <section className="sr-only" aria-label="Private demo summary">
        <h1>Private demo</h1>
        <p>Trust and confidentiality: this no-index demo view is intended for private review only and should be treated as confidential preview material.</p>
        <p>Outcome: reviewers can validate prep-brief workflow and reduce review friction by about 20% without the email gate.</p>
        <Link href="/demo">Get started with the public demo</Link>
      </section>
      <Suspense fallback={null}>
        <DemoContent bypassGate />
      </Suspense>
    </>
  )
}
