'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/billing/pricing'

const PASSIVE_FEATURES = [
  'Pipeline tracking for up to 25 companies',
  'Company intelligence: news, 8-Ks, exec moves, funding, career pages',
  'Pattern alerts before roles are posted',
  'Weekly signal digest',
  'Contact tracker',
]

const ACTIVE_FEATURES = [
  'Everything in Monitor',
  'AI Interview Prep Briefs',
  'Search Strategy Brief',
  'AI Chat advisor',
  'Outreach drafting',
  'Resume tailoring + quality check',
  'Daily morning briefing',
]

const EXECUTIVE_FEATURES = [
  'Everything in Active',
  'Unlimited company pipeline',
  'Career page scanning 2x daily',
  'Immediate pattern and exec departure alerts',
  'Opus AI for interview prep briefs',
  'Salary intelligence and negotiation scripts',
  'Recruiter tracker with firm grouping',
  'Priority contact flagging and CSV export',
]

type Tier = 'passive' | 'active' | 'executive'

export function PricingSection({ trialNote }: { trialNote: string }) {
  const [annual, setAnnual] = useState(false)

  function price(tier: Tier): string {
    return (annual ? PRICING[tier].annualMonthly : PRICING[tier].monthly).toLocaleString()
  }

  function subline(tier: Tier): string {
    const annualTotal = PRICING[tier].annual
    const savings = PRICING[tier].monthly * 12 - annualTotal
    return annual
      ? `billed as $${annualTotal.toLocaleString()}/yr · Save $${savings.toLocaleString()}`
      : `or $${annualTotal.toLocaleString()}/yr - save $${savings.toLocaleString()}`
  }

  return (
    <section className="bg-card px-4 sm:px-6 py-14 sm:py-20 border-b border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3">
          What it costs
        </p>
        <h2 className="text-[22px] font-bold text-foreground mb-4 max-w-xl leading-snug">
          C-suite campaign pricing. Campaign outcomes.
        </h2>
        <p className="text-[14px] text-muted-foreground mb-4 max-w-2xl leading-relaxed">
          You run the campaign. We power it. Choose the tier that matches your search altitude. All plans include a 30-day free trial, no credit card required.
        </p>
        <p className="text-[13px] text-muted-foreground border-l-2 border-primary/30 pl-4 mb-6 max-w-2xl leading-relaxed">
          The delta between the role you want and the role you settle for is measured in weeks, not years. At $199/mo, this is a fraction of a rounding error on a $300K compensation decision.
        </p>
        <div className="flex items-center gap-3 mb-4 text-[12px] text-muted-foreground">
          <span>Built for confidential executive search campaigns</span>
          <span className="text-muted-foreground">&middot;</span>
          <span>No recruiter marketplace</span>
        </div>
        <p className="text-[12px] text-muted-foreground mb-8">
          Most executives start on Monitor, move to Active once they see what prep briefs do. C-suite leaders who want deeper analysis move to Executive when they need full coverage.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center gap-1 mb-10 bg-muted rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`text-[13px] font-semibold px-4 py-1.5 rounded-md transition-colors ${!annual ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 text-[13px] font-semibold px-4 py-1.5 rounded-md transition-colors ${annual ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground'}`}
          >
            Annual
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${annual ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              2 months free
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl">

          {/* Monitor */}
          <div className="border border-border rounded-lg p-5 sm:p-6 flex flex-col">
            {/* KPI Row */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-bold text-success">$49/mo</span>
              <span className="text-[12px] text-muted-foreground">Track up to 25 companies, get weekly signals</span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">Monitor</p>
            <p className="text-[32px] font-bold text-foreground leading-none mb-1">
              ${price('passive')}<span className="text-[16px] font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="text-[12px] text-muted-foreground mb-0.5">30-day free trial. No credit card.</p>
            <p className="text-[12px] text-muted-foreground mb-5">{subline('passive')}</p>
            <ul className="space-y-2.5">
              {PASSIVE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-muted-foreground shrink-0 mt-0.5 text-[12px]">+</span>
                  <span className="text-[13px] text-muted-foreground leading-snug">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-4 text-[12px] text-muted-foreground leading-relaxed">
              Most users move to Active once they see what prep briefs do before an interview.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block w-full text-center border border-border text-muted-foreground text-[13px] font-semibold px-5 py-2.5 rounded transition-colors"
            >
              Try free &rarr;
            </Link>
          </div>

          {/* Active - most popular, orange border */}
          <div className="border-2 border-primary/30 rounded-lg p-5 sm:p-6 bg-card flex flex-col relative">
            {/* KPI Row */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-bold text-success">$199/mo</span>
              <span className="text-[12px] text-muted-foreground">Unlimited briefs, daily signals, AI advisor</span>
            </div>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">Most popular</span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Active</p>
            <p className="text-[32px] font-bold text-foreground leading-none mb-1">
              ${price('active')}<span className="text-[16px] font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="text-[12px] text-muted-foreground mb-0.5">{trialNote}</p>
            <p className="text-[12px] text-muted-foreground mb-5">{subline('active')}</p>
            <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">Stop running a reactive search.</p>
            <ul className="space-y-2.5">
              {ACTIVE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-primary shrink-0 mt-0.5 text-[12px]">+</span>
                  <span className="text-[13px] text-muted-foreground leading-snug">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 mb-1 text-[11px] text-muted-foreground leading-relaxed">
              When you&apos;re ready for full depth, Executive is waiting.
            </p>
            <Link
              href="/signup"
              className="mt-auto inline-block w-full text-center bg-primary text-primary-foreground text-[13px] font-bold px-5 py-2.5 rounded hover:bg-primary/90 transition-colors"
            >
              Start your campaign &rarr;
            </Link>
          </div>

          {/* Executive - slate-900 authority */}
          <div className="dark text-foreground border border-border rounded-lg p-5 sm:p-6 bg-card flex flex-col">
            {/* KPI Row */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-bold text-success">$499/mo</span>
              <span className="text-[12px] text-success">Full pipeline, salary intelligence, recruiter tracker</span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Executive</p>
            <p className="text-[32px] font-bold text-foreground leading-none mb-1">
              ${price('executive')}<span className="text-[16px] font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="text-[12px] text-muted-foreground mb-0.5">{trialNote}</p>
            <p className="text-[12px] text-muted-foreground mb-5">{subline('executive')}</p>
            <p className="text-[13px] text-muted-foreground mb-2 leading-relaxed">The analysis is done. The brief is written. The intelligence is running at full depth before you wake up.</p>
            <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">One additional week of negotiation on a C-suite offer typically exceeds the annual cost of this plan.</p>
            <ul className="space-y-2.5">
              {EXECUTIVE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="text-primary shrink-0 mt-0.5 text-[12px]">+</span>
                  <span className="text-[13px] text-muted-foreground leading-snug">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-auto inline-block w-full text-center bg-primary text-primary-foreground text-[13px] font-bold px-5 py-2.5 rounded hover:bg-primary/90 transition-colors"
            >
              Start your campaign &rarr;
            </Link>
          </div>

        </div>


      </div>
    </section>
  )
}
