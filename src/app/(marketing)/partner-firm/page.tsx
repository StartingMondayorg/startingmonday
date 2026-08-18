import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingPage } from '@/components/LandingPage'
import type { FAQ, SituationCard } from '@/components/LandingPage'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Partner / Firm | Starting Monday',
  description: 'Choose your partner or firm path and preview signal, brief, and relationship momentum demos with a disciplined editorial layout.',
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'coach-growth',
    headline: 'I need stronger outcomes across my client roster.',
    sub: 'I want a tighter operating cadence and better signal quality.',
  },
  {
    id: 'outplacement-scale',
    headline: 'I run outplacement cohorts with uneven momentum.',
    sub: 'I need one standard for timing, outreach quality, and sponsor reporting.',
  },
  {
    id: 'search-firm-precision',
    headline: 'I want cleaner shortlist calibration with clients.',
    sub: 'I need better role-signal context and structured brief workflows.',
  },
  {
    id: 'operating-system',
    headline: 'My team needs one shared operating system.',
    sub: 'I want less ad hoc work and more repeatable quality.',
  },
]

const FAQS: FAQ[] = [
  {
    question: 'Who is this lane for?',
    answer: 'It is for coaches, outplacement teams, and search firms that want stronger timing discipline and cleaner execution quality across clients.',
  },
  {
    question: 'What changes after selecting a partner lane?',
    answer: 'You get lane-specific signal views, briefing workflows, and relationship momentum tools matched to your operating model.',
  },
  {
    question: 'Can different teams run different lanes?',
    answer: 'Yes. Each lane keeps a shared visual system while adapting workflow details for coaching, outplacement, or search delivery.',
  },
]

const PARTNER_CHOICES = [
  {
    label: 'Coaches',
    href: '/for-coaches',
    description: 'Guide clients with tighter timing, narrative quality, and execution discipline.',
  },
  {
    label: 'Outplacement',
    href: '/for-outplacement',
    description: 'Improve transition outcomes with earlier signal windows and better shortlist positioning.',
  },
  {
    label: 'Search Firms',
    href: '/search-firms',
    description: 'Run cleaner shortlist calibration with role-signal context and structured briefs.',
  },
]

export default function PartnerFirmPage() {
  return (
    <>
        <h1 className="sr-only">Starting Monday</h1>
      <LandingPage
        hero={{
          eyebrow: 'Partner and firm lane selection',
          h1Lines: ['Choose your lane,', 'then run a disciplined delivery model.'],
          body: 'Starting Monday gives partner teams one consistent system for timing signals, brief quality, and relationship momentum.',
          steps: [
            'Select the partner lane that matches your service model.',
            'Use lane-specific demos to align delivery standards quickly.',
            'Run a repeatable weekly cadence across clients and stakeholders.',
          ],
          trialNote: 'Free for 30 days. No credit card. Team-ready from day one.',
        }}
        situations={SITUATIONS}
        faqs={FAQS}
        sourcePage="/partner-firm"
      />

      <div className="bg-slate-950 pb-12 sm:pb-14">
        <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
          <div className="rounded-[1.5rem] border border-white/12 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-5 shadow-[0_32px_88px_rgba(2,6,23,0.35)] sm:p-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Choose your lane</p>
            <h2 className="mb-2 text-[22px] font-bold leading-snug text-white">Start with the partner model you run today.</h2>
            <p className="mb-5 text-[14px] leading-relaxed text-slate-200/90">
              Each lane matches the home-page visual language, then adapts workflows for coaching, outplacement, or search delivery.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PARTNER_CHOICES.map((choice) => (
                <article key={choice.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_56px_rgba(15,23,42,0.2)]">
                  <p className="text-[16px] font-semibold text-white">{choice.label}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{choice.description}</p>
                  <Link
                    href={choice.href}
                    className="mt-4 inline-flex items-center rounded-full border border-orange-300/70 px-4 py-2 text-[12px] font-semibold text-orange-100 hover:bg-orange-400/10 hover:text-white"
                  >
                    Open {choice.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl border-t border-white/10 px-4 pt-8 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">Demo stack</p>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 shadow-[0_18px_56px_rgba(15,23,42,0.2)]">
              <p className="text-[15px] font-semibold text-white">1. Signal demo</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                Review role-shaping trigger clusters with confidence context before your team commits outreach effort.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 shadow-[0_18px_56px_rgba(15,23,42,0.2)]">
              <p className="text-[15px] font-semibold text-white">2. Brief demo</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                Use structured briefing templates for mandate framing, objection handling, and next-step clarity.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 shadow-[0_18px_56px_rgba(15,23,42,0.2)]">
              <p className="text-[15px] font-semibold text-white">3. Relationship momentum demo</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                Keep stakeholder maps, contact priority, and cadence visibility aligned across your delivery team.
              </p>
            </article>
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  )
}
