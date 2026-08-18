import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { EmiMarketingTelemetry } from '@/components/EmiMarketingTelemetry'
import { isEnabledFlag } from '@/lib/feature-flags'
import { PRICING } from '@/lib/pricing'

const PricingCards = dynamic(() => import('./pricing-cards').then((mod) => mod.PricingCards), {
  loading: () => (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-[13px] text-slate-500">
      Loading pricing plans...
    </section>
  ),
})

export const metadata: Metadata = {
  title: 'Pricing - Starting Monday for C-suite searches',
  description: 'Simple pricing for C-suite executive searches. Improve campaign behavior, relationship quality, and right-role decisions with Monitor ($49), Active ($199), or Executive ($499).',
  alternates: { canonical: 'https://startingmonday.app/pricing' },
  openGraph: {
    title: 'Pricing - Starting Monday for C-suite searches',
    description: 'Simple pricing for C-suite executive searches focused on behavior, relationships, and right-role outcomes.',
    url: 'https://startingmonday.app/pricing',
  },
}

export default function PricingPage() {
  const premiumEnabled = isEnabledFlag(process.env.NEXT_PUBLIC_LUXURY_PHASE3_ENABLED)

  return (
    <div className={`relative min-h-screen font-sans ${premiumEnabled ? 'overflow-hidden bg-slate-950' : 'bg-white'}`}>
      {premiumEnabled && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(10,15,28,0.98)_100%)]" />
      )}
      <EmiMarketingTelemetry pageSlug="/pricing" personaSegment="executives" />
      <nav className={premiumEnabled ? 'sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl' : 'bg-slate-950 sticky top-0 z-10'}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center min-h-[44px] text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/login" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2 text-[13px] text-slate-200 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup?from=pricing"
              data-emi-cta="pricing_nav_get_started"
              data-emi-to="/signup?from=pricing"
              className="inline-flex items-center min-h-[44px] text-[13px] font-semibold bg-white text-slate-900 px-4 py-2.5 rounded hover:bg-slate-100 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className={`max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 ${premiumEnabled ? 'text-slate-100' : ''}`}>
        <div className="text-center mb-11">
          <h1 className={`text-[38px] sm:text-[48px] font-bold leading-[1.05] tracking-tight ${premiumEnabled ? 'text-white' : 'text-slate-900'}`}>
            The terms of engagement.
          </h1>
          <p className={`text-[16px] mt-4 max-w-lg mx-auto leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-500'}`}>
            30-day free trial. No credit card. Choose based on search intensity, not job-board volume.
          </p>
        </div>

        <section className={`mb-10 rounded-2xl p-6 sm:p-7 ${premiumEnabled ? 'border border-white/12 bg-slate-950/64 shadow-[0_22px_66px_rgba(15,23,42,0.2)] backdrop-blur-md' : 'border border-slate-200 bg-slate-50'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-4 ${premiumEnabled ? 'text-orange-200' : 'text-slate-500'}`}>Why this model</p>
          <p className={`text-[13px] leading-relaxed max-w-2xl ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
            Pay for earlier intelligence, better weekly execution, and higher-quality conversations before searches are public.
          </p>
        </section>

        <PricingCards />

        <section className={`mt-10 rounded-2xl p-6 sm:p-7 ${premiumEnabled ? 'border border-white/12 bg-slate-950/64 shadow-[0_22px_66px_rgba(15,23,42,0.2)] backdrop-blur-md' : 'border border-slate-200 bg-white'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-3 ${premiumEnabled ? 'text-orange-200' : 'text-slate-500'}`}>First-week outcomes by plan</p>
          <p className={`text-[13px] leading-relaxed mb-4 ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
            Pick the plan that matches urgency this week. Each path defines what &quot;good&quot; looks like in seven days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-white/12 bg-white/[0.07] shadow-[0_16px_52px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-slate-50'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${premiumEnabled ? 'text-white' : 'text-slate-900'}`}>{PRICING.passive.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>Build signal coverage and a clean watchlist so timing windows stop surprising you.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                <li>- 20-30 target companies tracked with fresh signal visibility</li>
                <li>- At least 10 decision-timeline markers initialized</li>
                <li>- Weekly check rhythm defined for one operator</li>
              </ul>
            </article>
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-white/12 bg-white/[0.07] shadow-[0_16px_52px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-slate-50'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${premiumEnabled ? 'text-white' : 'text-slate-900'}`}>{PRICING.active.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>Establish daily execution rhythm with prep briefs, follow-ups, and conversion tracking.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                <li>- Daily queue active with owner-assigned next actions</li>
                <li>- Prep briefs completed before first-contact outreach</li>
                <li>- Follow-up SLA visible across all live campaigns</li>
              </ul>
            </article>
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-white/12 bg-white/[0.07] shadow-[0_16px_52px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-slate-50'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${premiumEnabled ? 'text-white' : 'text-slate-900'}`}>{PRICING.executive.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>Launch high-depth scanning and decision-grade prep across your highest-priority targets.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                <li>- Priority list narrowed to top 5-8 high-value targets</li>
                <li>- Executive-ready prep packet produced for each active lane</li>
                <li>- Decision owner and escalation path set per campaign</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={`mt-8 rounded-2xl p-5 ${premiumEnabled ? 'border border-white/12 bg-white/[0.07] shadow-[0_16px_52px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-slate-50'}`}>
          <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ${premiumEnabled ? 'text-orange-200' : 'text-slate-500'}`}>Source note</p>
          <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
            Plan examples are illustrative and directional, not audited outcome claims. Privacy commitments and account confidentiality controls apply to all plans.
          </p>
        </section>

        <section className={`mt-12 pt-10 ${premiumEnabled ? 'border-t border-white/10' : 'border-t border-slate-100'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-4 text-center ${premiumEnabled ? 'text-slate-200' : 'text-slate-200'}`}>Pricing FAQ</p>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Can I upgrade or downgrade later?',
                a: 'Yes. You can move between plans at any time as your search intensity changes.',
              },
              {
                q: 'What if I pick the wrong tier to start?',
                a: 'Start where you are now. Most executives begin on Monitor or Active, then upgrade when the campaign becomes urgent.',
              },
              {
                q: 'Is there a long-term contract?',
                a: 'No. All plans start with a 30-day free trial and can be canceled at any time.',
              },
            ].map(item => (
              <div key={item.q} className={`rounded-2xl p-5 ${premiumEnabled ? 'border border-white/12 bg-white/[0.07] shadow-[0_16px_52px_rgba(15,23,42,0.16)]' : 'border border-slate-200'}`}>
                <p className={`text-[13px] font-semibold mb-1.5 ${premiumEnabled ? 'text-white' : 'text-slate-900'}`}>{item.q}</p>
                <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-slate-200' : 'text-slate-600'}`}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className={`mt-10 text-center text-[13px] ${premiumEnabled ? 'text-slate-200' : 'text-slate-200'}`}>
          All plans include a 30-day free trial. Cancel any time.{' '}
          Questions? <a data-emi-cta="pricing_support_email" data-emi-to="mailto:support@startingmonday.app" href="mailto:support@startingmonday.app" className={`inline-flex items-center min-h-[44px] underline underline-offset-2 ${premiumEnabled ? 'text-slate-100' : 'text-slate-600'}`}>support@startingmonday.app</a>
        </p>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

