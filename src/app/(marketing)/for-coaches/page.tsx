import type { Metadata } from 'next'
import Link from 'next/link'

import { CoachPreviewActions } from './coach-preview-actions'
import { EmiMarketingTelemetry } from '@/app/components/EmiMarketingTelemetry'
import { TrackLink } from '@/app/components/TrackLink'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { PILOT_SCORECARD } from './page-content'

export const metadata: Metadata = {
  title: 'Starting Monday for Executive Coaches | Research Preview',
  description:
    'Private, evidence-led preview for executive coaches and coaching firms. Evaluate fit with discretion, then decide with confidence.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches' },
  openGraph: {
    title: 'Starting Monday for Executive Coaches',
    description: 'Research-first preview for executive coaches and coaching firms.',
    url: 'https://startingmonday.app/for-coaches',
  },
}

const TRUST_SUMMARY = [
  'Client-controlled access, revocable at any time.',
  'No recruiter-side data sharing.',
  'Coaching judgment stays with the coach.',
]

export default function ForCoachesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <EmiMarketingTelemetry pageSlug="/for-coaches" personaSegment="coaches" />

      <nav className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/evidence-hub#coaching-transitions" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              Evidence Hub
            </Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[11px] font-bold tracking-[0.08em] text-warning">Executive Coach Briefing</p>
          <h1 className="mb-5 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            Keep sessions strategic by making between-session execution visible.
            <br className="hidden sm:block" />
            Starting Monday provides that layer.
          </h1>
          <p className="mb-2 max-w-3xl text-[17px] leading-relaxed text-foreground">
            What happens between sessions determines whether strategy survives the week. Starting Monday gives you one private operating view before session quality drifts.
          </p>
          <p className="mb-7 max-w-2xl text-[14px] leading-relaxed text-foreground">
            Start with a private 30-day evaluation for 2 to 3 clients. Continue only if session quality and client follow-through are measurably better.
          </p>

          <div className="mb-5">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-warning">Why this matters</p>
            <p className="text-[14px] leading-relaxed text-foreground">
              Recap is a tax on judgment. Starting Monday reduces it.
            </p>
          </div>

          <div className="mb-7 space-y-3">
            <CoachPreviewActions />
            <div className="text-[12px]">
              <Link href="/evidence-hub#coaching-transitions" className="font-semibold text-primary underline underline-offset-2 transition-colors">
                Based on research
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section id="pilot-scorecard" className="scroll-mt-24 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-warning/25 bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-3 text-[11px] font-bold tracking-[0.08em] text-warning">Private 30-day evaluation</p>
              <h2 className="font-serif text-[30px] leading-[1.15] text-foreground sm:text-[34px]">
                Run a 30-day operator test. Keep it only if it changes behavior.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-foreground">
                Run the platform with 2 to 3 live clients, observe behavior and session quality, and make one clear continuation decision at day 30.
              </p>
              <div className="mt-5 rounded-2xl border border-border bg-background/45 p-5">
                <p className="text-[12px] font-semibold tracking-[0.06em] text-warning">Executive coach lens</p>
                <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
                  <li>Clients use it without being chased.</li>
                  <li>Sessions start with signal context, not status recap.</li>
                  <li>You make sharper interventions with less administrative effort.</li>
                </ul>
              </div>
            </div>
            <div className="grid gap-3">
              {PILOT_SCORECARD.map((item, index) => (
                <article key={item.metric} className="rounded-2xl border border-border bg-muted/[0.05] p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-warning/40 text-[11px] font-semibold text-warning">{index + 1}</span>
                    <p className="text-[12px] font-semibold tracking-[0.06em] text-warning">{item.metric}</p>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground">{item.success}</p>
                </article>
              ))}
              <article className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
                <p className="mb-1 text-[12px] font-semibold tracking-[0.06em] text-warning">Decision standard</p>
                <p className="text-[13px] leading-relaxed text-foreground">
                  Continue only if three things are true by day 30: stronger client follow-through, faster entry to strategic session work, and lower supervision overhead for the coach.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-background/40 text-foreground">
        <section id="role-boundary" className="scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-warning">Trust and role boundary</p>
            <h2 className="mb-5 font-serif text-[30px] leading-[1.2] text-foreground sm:text-[34px]">Your judgment stays central. The platform handles operating visibility.</h2>
            <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-foreground">
              {TRUST_SUMMARY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <details className="mt-6 rounded-2xl border border-border bg-background/40 px-4 py-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-warning">What happens during the 30-day evaluation?</summary>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground">
                Week 1 establishes baseline routines, week 2 validates signal-to-session translation, week 3 measures follow-through consistency, and week 4 confirms whether session quality improves enough to justify continuation.
              </p>
            </details>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackLink
                href="/for-coaches/trust-pack"
                event={EVENT_NAMES.channelEntryClicked}
                logToUserEvents
                properties={{ channel: 'coaches', cta_label: 'coach_trust_pack', source_page: '/for-coaches' }}
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-warning/60 hover:bg-muted/40"
              >
                Review trust and security details
              </TrackLink>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-warning/20 bg-card/85 p-6 text-foreground shadow-2xl backdrop-blur-sm sm:p-8">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-warning">Private invitation</p>
            <h2 className="mb-3 font-serif text-[30px] leading-[1.2] text-foreground sm:text-[34px]">Request the private 30-day coach evaluation.</h2>
            <p className="mb-6 max-w-3xl text-[14px] leading-relaxed text-foreground">No broad rollout. Start with 2 to 3 clients and continue only on observed outcome quality.</p>
            <CoachPreviewActions />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background/80 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex flex-wrap gap-4 text-[12px] text-foreground">
            <Link href="/evidence-hub#coaching-transitions" className="transition-colors hover:text-foreground">Evidence Hub</Link>
            <Link href="/for-coaches/trust-pack" className="transition-colors hover:text-foreground">Trust pack</Link>
            <Link href="/for-coaches/economics" className="transition-colors hover:text-foreground">Economics</Link>
            <Link href="/for-coaches/faq" className="transition-colors hover:text-foreground">FAQ</Link>
          </div>
        </div>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

