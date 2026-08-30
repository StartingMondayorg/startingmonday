import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Coach Dashboard Demo | Starting Monday',
  description:
    'Preview the coach dashboard layer and the core coach features: pre-session snapshots, portfolio visibility, commitment tracking, reporting, and trust controls.',
  alternates: { canonical: 'https://startingmonday.app/demo/coach-dashboard' },
}

const COACH_FEATURES = [
  {
    title: 'Pre-Session Snapshot',
    detail:
      'One screen before each session showing signal changes, pipeline movement, confidence trend, and missed commitments.',
  },
  {
    title: 'Client Portfolio Dashboard',
    detail:
      'A coach-level view across all active clients so you can see who is active, drifting, or at risk before the next call.',
  },
  {
    title: 'Client Visibility Controls',
    detail:
      'Client-controlled permissions keep trust intact: each client decides exactly what a coach can access.',
  },
  {
    title: 'Session Commitment Tracker',
    detail:
      'Track follow-through between sessions and surface overdue actions so sessions stay strategic, not recap-heavy.',
  },
  {
    title: 'Weekly Activity Digest',
    detail:
      'A weekly summary of active clients, drift risks, and new signals to maintain portfolio-level consistency.',
  },
  {
    title: 'Trust Pack and Reporting',
    detail:
      'Methodology notes, claims policy, and rollout-ready artifacts for coaches and firms that need clear governance.',
  },
]

export default function CoachDashboardDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/coachos" className="text-muted-foreground transition-colors hover:text-foreground">
              Back to CoachOS
            </Link>
            <Link href="/features/executive-coaches" className="text-muted-foreground transition-colors hover:text-foreground">
              Full coach feature guide
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <section className="rounded-[2rem] border border-border bg-muted/[0.03] p-6 sm:p-7">
          <p className="text-[12px] font-semibold tracking-[0.02em] text-primary">Coach layer demo</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight text-foreground sm:text-[42px]">
            See the coach dashboard and operating layer in one place.
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-foreground">
            This page shows the coach-side surfaces that support delivery quality: portfolio visibility, prep context,
            follow-through tracking, and trust-safe access controls.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/coaches/mock-dashboard"
              className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-6 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open coach dashboard demo
            </Link>
            <Link
              href="/coaches/mock-dashboard/dana-r"
              className="inline-flex min-h-[44px] items-center rounded-full border border-border px-6 text-[13px] font-semibold text-foreground transition-colors"
            >
              Open client coach view demo
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-border bg-card/50 p-6 sm:p-7">
          <p className="text-[12px] font-semibold tracking-[0.02em] text-primary">Coach features from the feature guide</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {COACH_FEATURES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-border bg-muted/[0.03] p-4">
                <h2 className="mb-2 text-[16px] font-semibold text-foreground">{feature.title}</h2>
                <p className="text-[13px] leading-relaxed text-foreground">{feature.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 text-[13px] text-foreground">
            Need the full spec and rollout details?{' '}
            <Link href="/features/executive-coaches" className="underline underline-offset-2 text-muted-foreground hover:text-foreground">
              View the executive coaches feature guide
            </Link>
            .
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

