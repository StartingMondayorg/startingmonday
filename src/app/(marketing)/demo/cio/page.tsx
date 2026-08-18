import type { Metadata } from 'next'
import Link from 'next/link'
import { CioPresentationClient } from './CioPresentationClient'

export const metadata: Metadata = {
  title: 'Starting Monday | Kenneth Kicia Demo',
  description: 'Presentation page tailored to Kenneth Kicia and Florida public-sector CIO context.',
  robots: { index: false, follow: false },
}

export default function CIODemoPage() {
  return (
    <>
        <p className="sr-only">Privacy-first by design.</p>
      <section className="sr-only" aria-label="CIO demo summary">
        <h1>Kenneth Kicia CIO demo</h1>
        <p>Trust and confidentiality: this page is private demo content, not indexed by search engines, and intended for confidential review.</p>
        <p>Outcome: the presentation demonstrates role-specific prep quality and can improve positioning clarity by 20% in review sessions.</p>
        <Link href="/demo/cio/notes">Get started with talking points</Link>
      </section>
      <CioPresentationClient />
    </>
  )
}
