import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { EmiMarketingTelemetry } from '@/app/components/EmiMarketingTelemetry'
import { isEnabledFlag } from '@/lib/feature-flags'
import { PRICING } from '@/lib/billing/pricing'

const PricingCards = dynamic(() => import('./pricing-cards').then((mod) => mod.PricingCards), {
  loading: () => (
    <section className="mb-8 rounded-lg border border-border bg-primary p-8 text-center text-[13px] text-primary-foreground">
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
    <div className={`relative min-h-screen font-sans ${premiumEnabled ? 'overflow-hidden bg-background' : 'bg-primary'}`}>
      <EmiMarketingTelemetry pageSlug="/pricing" personaSegment="executives" />
      <nav className={premiumEnabled ? 'sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl' : 'bg-background sticky top-0 z-10'}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center min-h-[44px] text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/login" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/signup?from=pricing"
              data-emi-cta="pricing_nav_get_started"
              data-emi-to="/signup?from=pricing"
              className="inline-flex items-center min-h-[44px] text-[13px] font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded hover:bg-muted transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className={`max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 ${premiumEnabled ? 'text-foreground' : ''}`}>
        <div className="text-center mb-11">
          <h1 className={`text-[38px] sm:text-[48px] font-bold leading-[1.05] tracking-tight ${'text-foreground'}`}>
            The terms of engagement.
          </h1>
          <p className={`text-[16px] mt-4 max-w-lg mx-auto leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            30-day free trial. No credit card. Choose based on search intensity, not job-board volume.
          </p>
        </div>

        <section className={`mb-10 rounded-2xl p-6 sm:p-7 ${premiumEnabled ? 'border border-border bg-background/64 shadow-xl backdrop-blur-md' : 'border border-border bg-muted'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-4 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>Why this model</p>
          <p className={`text-[13px] leading-relaxed max-w-2xl ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            Pay for earlier intelligence, better weekly execution, and higher-quality conversations before searches are public.
          </p>
        </section>

        <PricingCards />

        <section className={`mt-10 rounded-2xl p-6 sm:p-7 ${premiumEnabled ? 'border border-border bg-background/64 shadow-xl backdrop-blur-md' : 'border border-border bg-primary'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-3 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>First-week outcomes by plan</p>
          <p className={`text-[13px] leading-relaxed mb-4 ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            Pick the plan that matches urgency this week. Each path defines what &quot;good&quot; looks like in seven days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${'text-foreground'}`}>{PRICING.passive.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>Build signal coverage and a clean watchlist so timing windows stop surprising you.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                <li>- 20-30 target companies tracked with fresh signal visibility</li>
                <li>- At least 10 decision-timeline markers initialized</li>
                <li>- Weekly check rhythm defined for one operator</li>
              </ul>
            </article>
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${'text-foreground'}`}>{PRICING.active.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>Establish daily execution rhythm with prep briefs, follow-ups, and conversion tracking.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                <li>- Daily queue active with owner-assigned next actions</li>
                <li>- Prep briefs completed before first-contact outreach</li>
                <li>- Follow-up SLA visible across all live campaigns</li>
              </ul>
            </article>
            <article className={`rounded-2xl p-4 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
              <p className={`text-[12px] font-semibold mb-1 ${'text-foreground'}`}>{PRICING.executive.name}</p>
              <p className={`text-[12px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>Launch high-depth scanning and decision-grade prep across your highest-priority targets.</p>
              <ul className={`mt-3 space-y-1.5 text-[12px] ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                <li>- Priority list narrowed to top 5-8 high-value targets</li>
                <li>- Executive-ready prep packet produced for each active lane</li>
                <li>- Decision owner and escalation path set per campaign</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={`mt-8 rounded-2xl p-5 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
          <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>Source note</p>
          <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            Plan examples are illustrative and directional, not audited outcome claims. Privacy commitments and account confidentiality controls apply to all plans.
          </p>
        </section>

        <section className={`mt-12 pt-10 ${'border-t border-border'}`}>
          <p className={`text-[11px] font-bold tracking-[0.14em] uppercase mb-4 text-center ${'text-foreground'}`}>Pricing FAQ</p>
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
              <div key={item.q} className={`rounded-2xl p-5 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border'}`}>
                <p className={`text-[13px] font-semibold mb-1.5 ${'text-foreground'}`}>{item.q}</p>
                <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className={`mt-10 text-center text-[13px] ${'text-foreground'}`}>
          All plans include a 30-day free trial. Cancel any time.{' '}
          Questions? <a data-emi-cta="pricing_support_email" data-emi-to="mailto:support@startingmonday.app" href="mailto:support@startingmonday.app" className={`inline-flex items-center min-h-[44px] underline underline-offset-2 ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>support@startingmonday.app</a>
        </p>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

