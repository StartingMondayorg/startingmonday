'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/pricing'

const PLANS = [
  {
    ...PRICING.passive,
    buyerMode: 'Watch the market quietly',
    firstWeekOutcome: 'Build a target watchlist and receive your first weekly signal digest.',
    description: 'Stay ahead of the search. Know what is changing at your target companies before the role ever posts.',
    featured: false,
    features: [
      'Pipeline tracking for up to 25 companies',
      'Company intelligence: news, 8-Ks, exec moves, funding, career pages',
      'Pattern alerts before roles are posted',
      'Weekly signal digest',
      'Contact tracker',
    ],
  },
  {
    ...PRICING.active,
    buyerMode: 'Run your search every day',
    firstWeekOutcome: 'Run your first prep brief, log outreach, and establish a daily execution loop.',
    description: 'Stop running a reactive search. Prep briefs, pipeline tracking, intelligence, outreach, and a daily briefing. From one place.',
    featured: true,
    features: [
      'Everything in Monitor',
      'AI interview prep briefs',
      'Search strategy brief',
      'AI chat advisor',
      'Outreach drafting and refinement',
      'Resume tailoring',
      'Daily morning briefing email',
    ],
  },
  {
    ...PRICING.executive,
    buyerMode: 'Full depth for urgent searches',
    firstWeekOutcome: 'Launch full-depth scanning and complete a board-level readiness brief with outreach priorities.',
    description: 'For executives who want the analysis done, the brief written, and the intelligence running at full depth. Not data to work from.',
    featured: false,
    features: [
      'Everything in Active',
      'Unlimited company pipeline',
      'Career page scanning 2x daily',
      'Immediate pattern and exec departure alerts',
      'Opus AI for interview prep briefs',
      'Salary intelligence and negotiation scripts',
      'Recruiter tracker with firm grouping',
      'Priority contact flagging and CSV export',
    ],
  },
]

function Check() {
  return <span className="text-orange-500 shrink-0 mt-0.5 font-bold text-[12px]">+</span>
}

export function PricingCards() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Anchor sentence */}
      <p className="text-center text-[14px] text-slate-500 mb-3 max-w-xl mx-auto leading-relaxed">
        One hour with an executive coach runs $300 to $500.
        Starting Monday is ${PRICING.active.monthly} a month and runs every day.
      </p>
      <p className="text-center text-[13px] text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
        Missing one signal on a company you are tracking - a leadership departure, a funding event, a quiet job posting - costs more than a year of this subscription.
      </p>

      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="flex rounded border border-slate-200 overflow-hidden text-[12px] font-semibold">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-5 py-3 min-h-[44px] transition-colors ${!annual ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-5 py-3 min-h-[44px] transition-colors ${annual ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            Annual
          </button>
        </div>
        {annual && (
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            2 months free
          </span>
        )}
      </div>

      {/* Privacy assurance - visible before plan cards for Arc 2 users */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-green-600 font-bold text-[13px]">&#10003;</span>
        <p className="text-[13px] text-slate-500">
          Your employer cannot see your account or your search activity.{' '}
          <Link href="/privacy#employer" data-emi-cta="pricing_privacy_explainer" data-emi-to="/privacy#employer" className="inline-flex items-center min-h-[44px] underline hover:text-slate-700">How we protect your privacy &rarr;</Link>
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 items-stretch">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`rounded-lg p-6 relative flex flex-col ${plan.featured ? 'border-2 border-slate-900' : 'border border-slate-200'}`}
          >
            {plan.featured && (
              <span className="absolute top-3 right-3 text-[10px] font-bold tracking-[0.1em] uppercase bg-orange-500 text-white px-2.5 py-1 rounded">
                Most popular
              </span>
            )}
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">
              {plan.name}
            </p>
            <p className="text-[11px] text-slate-500 mb-2">{plan.buyerMode}</p>
            <div className="mb-1">
              <span className="text-[40px] font-bold text-slate-900 leading-none">
                ${annual ? plan.annualMonthly : plan.monthly}
              </span>
              <span className="text-[14px] text-slate-500 ml-1">/mo</span>
            </div>
            {annual && (
              <p className="text-[12px] text-slate-400 mb-3">
                billed as ${plan.annual.toLocaleString()}/yr · <span className="text-green-600">Save ${plan.monthly * 12 - plan.annual}</span>
              </p>
            )}
            <p className="text-[13px] text-slate-500 leading-relaxed mb-5 mt-2 min-h-[56px]">
              {plan.description}
            </p>
            <div className="mb-5 rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-500 mb-1">First-week outcome</p>
              <p className="text-[12px] text-slate-600 leading-relaxed">{plan.firstWeekOutcome}</p>
            </div>
            <ul className="flex flex-col gap-2.5 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup?from=pricing"
              data-emi-cta={`pricing_plan_${plan.key}`}
              data-emi-to="/signup?from=pricing"
              className={`block text-center text-[13px] font-semibold px-6 py-3 rounded transition-colors mt-auto ${
                plan.featured
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
