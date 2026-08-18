import type { Metadata } from 'next'
import Link from 'next/link'
import { CapabilityDisclosure } from '@/components/CapabilityDisclosure'

export const metadata: Metadata = {
  title: 'For CHROs and Sponsors | Starting Monday',
  description: 'Risk visibility, transition credibility, and board-safe reporting for HR leaders and program sponsors.',
  alternates: { canonical: 'https://startingmonday.app/for-chro' },
}

/**
 * CHRO and Sponsor Liaison Page - Sprint ITS-4 Ticket 26
 *
 * AC: page published and linked from outplacement and enterprise partner paths.
 */

const SPONSOR_VALUE_PROPS = [
  {
    title: 'Visible program health - not just a status call',
    body: 'Weekly cohort dashboards show activation rate, signal-driven actions, stall index, and counselor intervention quality. You see trends before they become problems.',
  },
  {
    title: 'Board-safe reporting language built in',
    body: 'Every metric comes with methodology disclosure and appropriate caveats. No overclaiming. No surprise questions from your legal or finance team.',
  },
  {
    title: 'Transition credibility for your executives',
    body: 'Displaced executives arrive at the job market prepared. They carry a strong narrative, an active pipeline, and documented momentum - not just a revised resume.',
  },
  {
    title: 'Governance-first pilot design',
    body: 'Fixed scope, defined decision gates, and explicit expansion criteria. We do not sell pilots that automatically convert. You decide at day 30 with evidence.',
  },
]

const SPONSOR_FAQ = [
  {
    q: 'What do I see in the monthly report?',
    a: 'Activation rate, action velocity, stall index, interview conversion rate, and counselor observations - all caveated and presented without individual participant names unless separately authorized.',
  },
  {
    q: 'What is the governance process if the program underperforms?',
    a: 'The pilot agreement includes explicit pass/fail thresholds. If the day-30 review shows below-threshold performance, we discuss hold or close before committing to expansion. No automatic renewals.',
  },
  {
    q: 'Who owns the participant data?',
    a: 'You do. Starting Monday provides the application layer under your contracted service terms. Participant data is used only for agreed workflow outputs. Retention, deletion, and export are governed by the pilot agreement.',
  },
  {
    q: 'How do you handle confidentiality for executives who are still employed?',
    a: 'Participants control their own access settings. Coach and counselor access is permission-gated and logged. We do not surface participant identities to the sponsor organization without explicit consent.',
  },
  {
    q: 'What evidence do you have that this works?',
    a: 'We publish our methods, not unverified outcome claims. Our timing model for early role signals is documented with sources, the prep and signal workflow is verifiable in a live demo, and pilot observations are shared qualitatively with methodology notes. As verified cohort outcomes become available, they will be published with sample sizes and definitions.',
  },
]

const REVIEW_TIMELINE = [
  { phase: 'Week 1', detail: 'Pilot scope confirmed, trust pack reviewed, legal track started.' },
  { phase: 'Week 2', detail: 'Cohort enrolled, counselor team onboarded, baseline scorecard set.' },
  { phase: 'Day 30', detail: 'First decision gate: activation rate, stall index, session quality.' },
  { phase: 'Day 60', detail: 'Mid-cycle review: interview conversion rate and counselor efficiency.' },
  { phase: 'Day 90', detail: 'Closeout decision: expand, hold, or close with sponsor sign-off.' },
]

export default function ChroSponsorPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-slate-900">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/for-outplacement" className="text-[13px] text-slate-600 hover:text-slate-900 transition-colors">
              Partner preview
            </Link>
            <Link href="/for-outplacement/trust-pack" className="inline-flex items-center justify-center rounded border border-slate-300 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:border-slate-500">
              Trust pack
            </Link>
            <Link href="mailto:partners@startingmonday.app" className="inline-flex items-center justify-center rounded bg-orange-500 px-3 py-2 text-[12px] font-semibold text-slate-950 transition-colors hover:bg-orange-600">
              Contact us
            </Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-slate-100 bg-slate-950 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-400">For CHROs and Sponsors</p>
          <h1 className="mb-4 text-[28px] font-bold leading-[1.1] tracking-tight text-white sm:text-[38px] max-w-3xl">
            Transition programs that earn sponsor confidence - not just participant engagement.
          </h1>
          <p className="text-[15px] text-slate-300 leading-relaxed max-w-2xl">
            Starting Monday gives you board-safe reporting, visible program health, and governance-first pilot design.
            You see evidence before committing to expansion.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="mailto:partners@startingmonday.app" className="inline-flex items-center rounded bg-orange-500 px-5 py-2.5 text-[14px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
              Request partner brief
            </Link>
            <Link href="/for-outplacement/trust-pack" className="inline-flex items-center rounded border border-slate-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:border-white transition-colors">
              Review trust pack
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-14">
        {/* Value props */}
        <section>
          <h2 className="text-[20px] font-bold text-slate-900 mb-6">What sponsors see that other programs cannot show</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SPONSOR_VALUE_PROPS.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 p-5">
                <h3 className="text-[14px] font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Review timeline */}
        <section>
          <h2 className="text-[20px] font-bold text-slate-900 mb-6">Governance timeline</h2>
          <div className="space-y-3">
            {REVIEW_TIMELINE.map((item, i) => (
              <div key={item.phase} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-20 pt-0.5">
                  <span className="text-[12px] font-bold text-orange-600">{item.phase}</span>
                </div>
                <div className={`flex-1 pb-3 ${i < REVIEW_TIMELINE.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <p className="text-[13px] text-slate-700">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Capability disclosure */}
        <section>
          <h2 className="text-[20px] font-bold text-slate-900 mb-4">What is live today vs. what is planned</h2>
          <CapabilityDisclosure
            live={[
              'Cohort activation and stall tracking',
              'Weekly operating review packet',
              'Sponsor-safe monthly report template',
              'Session strategy-time metrics',
              'Counselor intervention logging',
              'Trust pack and procurement brief',
              'Day-30 and day-60 governance decision gates',
            ]}
            roadmap={[
              { label: 'Real-time sponsor dashboard portal', eta: 'Q3 2026' },
              { label: 'Automated report delivery to sponsor email', eta: 'Q3 2026' },
              { label: 'Cohort benchmarking vs. anonymized industry norms', eta: 'Q4 2026' },
            ]}
          />
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-[20px] font-bold text-slate-900 mb-6">Sponsor FAQ</h2>
          <div className="space-y-4">
            {SPONSOR_FAQ.map((item) => (
              <details key={item.q} className="rounded-xl border border-slate-200 overflow-hidden group">
                <summary className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <p className="text-[14px] font-semibold text-slate-900">{item.q}</p>
                  <span className="text-slate-400 flex-shrink-0 mt-0.5 group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="px-5 pb-5 border-t border-slate-100">
                  <p className="text-[13px] text-slate-600 leading-relaxed pt-3">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-8 text-center">
          <h2 className="text-[20px] font-bold text-slate-900 mb-2">Ready to see the program in detail?</h2>
          <p className="text-[14px] text-slate-600 mb-6 max-w-lg mx-auto">
            We walk you through the governance model, reporting pack, and pilot scope in one conversation.
          </p>
          <Link href="mailto:partners@startingmonday.app?subject=CHRO%20Program%20Brief%20Request" className="inline-flex items-center rounded bg-orange-500 px-6 py-3 text-[14px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
            Request partner brief
          </Link>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

