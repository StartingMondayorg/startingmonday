import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DemoContent } from '../page'

export const metadata: Metadata = {
  title: 'Starting Monday | CIO Presenter Demo',
  description: 'A polished, shareable CIO-focused demo flow for showing Starting Monday to a stakeholder or prospect.',
  robots: { index: false, follow: false },
}

const STEPS = [
  {
    title: 'Open with the problem',
    body: 'CIO searches fail when context, timing, and follow-through are improvised. Starting Monday makes the campaign run like an operating system.',
  },
  {
    title: 'Show the live brief',
    body: 'Use the preloaded example to show how the platform generates a company-specific CIO prep brief before the conversation starts.',
  },
  {
    title: 'Close on the cadence',
    body: 'Point to daily briefing, signals, outreach tracking, and the evidence layer so he sees the system, not a one-off feature.',
  },
]

const TALK_TRACK = [
  '1. "This is the infrastructure layer for a CIO search."',
  '2. "It tells you what changed, who to contact, and how to prep before the meeting."',
  '3. "The brief auto-generates, so the team is never building this from scratch."',
  '4. "The goal is a better search campaign, not another job board."',
]

export default function PresenterDemoPage() {
  return (
    <div className="min-h-screen bg-muted text-foreground font-sans">
      <header className="dark bg-background border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground hover:opacity-80 transition-opacity">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/demo" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Live demo</Link>
            <Link href="/demo/executive-brief" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Live example</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
          <div id="presenter-overview" className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-3">Presenter mode</h2>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-foreground leading-[1.1] mb-4">
              A five-minute CIO demo you can walk him through.
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              Start with the problem, show the live brief, then close on the operating cadence. This route opens on a strong sample and auto-runs the brief so you can present without typing.
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">Trust and confidentiality: presenter runs are private to your session and not exposed publicly.</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">Outcome metric: present a complete CIO workflow in under 5 minutes.</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-6">CTA: get started now with full presenter view.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo/presenter?full=1" className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2.5 text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                Get started now
              </Link>
              <Link href="/demo/executive-brief" className="inline-flex items-center justify-center rounded border border-border bg-card text-muted-foreground px-4 py-2.5 text-[13px] font-semibold transition-colors">
                View live example
              </Link>
            </div>
          </div>

          <div id="talk-track" className="dark bg-background text-foreground rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-4">Talk track</h2>
            <div className="space-y-3">
              {TALK_TRACK.map((line) => (
                <div key={line} className="text-[14px] leading-relaxed text-foreground">
                  {line}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">What to show the CIO</h3>
              <div className="space-y-3">
                {STEPS.map((step) => (
                  <div key={step.title} className="bg-muted/40 border border-border rounded-xl p-4">
                    <p className="text-[13px] font-semibold text-foreground mb-1.5">{step.title}</p>
                    <p className="text-[13px] text-foreground leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="demo-sequence" className="mb-8">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Demo sequence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">1. Open with CIO context</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Lead with the shift from a job search to a managed CIO campaign.</p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">2. Show the brief</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Let the generated CIO prep brief reveal how company context changes the conversation.</p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="text-[13px] font-semibold text-foreground mb-1">3. End on cadence</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Close with daily briefing, signals, outreach, and prep as one system for the CIO search.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <Suspense fallback={
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm min-h-[320px]">
              <div className="h-5 w-32 bg-muted rounded mb-4" />
              <div className="h-8 w-80 bg-muted rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-11/12 bg-muted rounded" />
                <div className="h-4 w-10/12 bg-muted rounded" />
              </div>
            </div>
          }>
            <DemoContent
              bypassGate
              initialCompany="ServiceNow"
              initialRole="Chief Information Officer"
              autoGenerate
            />
          </Suspense>
        </section>
      </main>
    </div>
  )
}

