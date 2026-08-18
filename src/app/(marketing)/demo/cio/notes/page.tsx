import type { Metadata } from 'next'
import Link from 'next/link'
import { CioNotesClient } from '../CioNotesClient'

export const metadata: Metadata = {
  title: 'Starting Monday | Kenneth Talking Points',
  description: 'Kenneth-specific talking points, objections, pilot framing, and negotiation scripts.',
  robots: { index: false, follow: false },
}

export default function CioNotesPage() {
  return (
    <>
        <p className="sr-only">Privacy-first by design.</p>
      <section className="sr-only" aria-label="CIO notes summary">
        <h1>Kenneth Kicia talking points</h1>
        <p>Trust and confidentiality: these notes are private demonstration materials for confidential review conversations.</p>
        <p>Outcome: teams can align on objections, negotiation framing, and pilot discussion flow while reducing prep time by around 20%.</p>
        <Link href="/demo/cio">Get started with the CIO demo</Link>
      </section>
      <CioNotesClient />
    </>
  )
}
