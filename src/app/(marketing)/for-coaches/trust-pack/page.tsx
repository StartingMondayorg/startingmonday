import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Coach Trust Pack | Starting Monday',
  description: 'What coaches need to know about client data handling, access controls, and the trust boundary in Starting Monday.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches/trust-pack' },
}

const TRUST_FACTS = [
  {
    label: 'Client access',
    detail: 'Clients control their own data. Access can be revoked instantly at any time.',
  },
  {
    label: 'Data boundary',
    detail: 'Coaching workflow data is not shared with recruiters, search firms, or third-party channels.',
  },
  {
    label: 'Coach authority',
    detail: 'Coaching judgment, strategy, and relationships remain entirely with the coach.',
  },
  {
    label: 'Security',
    detail: 'Data is encrypted at rest and in transit. Access is role-gated with audit-ready logging.',
  },
]

export default function CoachTrustPackPage() {
  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">
      <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/for-coaches" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
            Back to coach preview
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-warning">Trust and security</p>
        <h1 className="mb-5 font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[44px]">
          Four facts before you share access with clients.
        </h1>
        <p className="mb-10 text-[16px] leading-relaxed text-foreground">
          No hidden terms. No fine print that changes the answer.
        </p>
        <p className="mb-3 text-[13px] text-muted-foreground">Trust and confidentiality: client-controlled access boundaries with no recruiter-side sharing by default.</p>
        <p className="mb-8 text-[13px] text-muted-foreground">Governance path: see /security for controls, audit posture, and incident response details.</p>

        <div className="mb-8 rounded-2xl border border-warning/25 bg-warning/10 p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-warning">Why trust is first-order</p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground">
            Research on coaching alliance quality indicates that trust in data handling is a prerequisite to effective
            engagement, not an optional layer added later.
          </p>
          <p className="mt-2 text-[12px] text-warning">Source: de Haan et al., 2013.</p>
        </div>

        <div className="space-y-4">
          {TRUST_FACTS.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-muted/[0.04] p-5">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-warning">{item.label}</p>
              <p className="text-[15px] leading-relaxed text-foreground">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="mb-2 text-[13px] text-foreground">Trust and confidentiality: client data stays inside the coaching boundary and remains client-controlled.</p>
          <p className="mb-3 text-[13px] text-muted-foreground">Governance path: see /security for controls, incident process, and verification details.</p>
          <p className="mb-3 text-[13px] text-muted-foreground">For full technical documentation:</p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/security" className="text-warning underline underline-offset-2 transition-colors">Security overview</Link>
            <Link href="/privacy" className="text-warning underline underline-offset-2 transition-colors">Privacy policy</Link>
            <Link href="/for-coaches/faq#security" className="text-warning underline underline-offset-2 transition-colors">Security FAQ</Link>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/partners#apply"
            className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request the 30-day evaluation
          </Link>
        </div>
      </main>

      <footer className="border-t border-border bg-background/80 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
            <Link href="/for-coaches" className="transition-colors hover:text-foreground">Coach preview</Link>
            <Link href="/partners#apply" className="transition-colors hover:text-foreground">Apply</Link>
            <Link href="/security" className="transition-colors hover:text-foreground">Security</Link>
          </div>
        </div>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

