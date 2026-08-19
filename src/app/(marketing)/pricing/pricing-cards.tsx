'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/billing/pricing'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
        <ToggleGroup
          spacing={0}
          value={[annual ? 'annual' : 'monthly']}
          onValueChange={(values) => {
            if (values[0]) setAnnual(values[0] === 'annual')
          }}
          className="rounded border border-slate-200 overflow-hidden text-[12px] font-semibold"
        >
          <ToggleGroupItem
            value="monthly"
            className="rounded-none px-5 py-3 min-h-[44px] !bg-white text-slate-500 hover:!bg-slate-50 data-[state=on]:!bg-slate-900 data-[state=on]:!text-white"
          >
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem
            value="annual"
            className="rounded-none px-5 py-3 min-h-[44px] !bg-white text-slate-500 hover:!bg-slate-50 data-[state=on]:!bg-slate-900 data-[state=on]:!text-white"
          >
            Annual
          </ToggleGroupItem>
        </ToggleGroup>
        {annual && (
          <Badge variant="outline" className="rounded-full !border-green-200 !bg-green-50 px-2.5 py-1 text-[11px] font-semibold !text-green-700">
            2 months free
          </Badge>
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
          <Card
            key={plan.key}
            className={`rounded-lg p-6 relative flex flex-col ${plan.featured ? 'ring-2 ring-slate-900' : ''}`}
          >
            {plan.featured && (
              <Badge className="absolute top-3 right-3 rounded bg-orange-500 px-2.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase text-white">
                Most popular
              </Badge>
            )}
            <CardHeader className="gap-0 p-0">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">
                {plan.name}
              </p>
              <CardDescription className="text-[11px] text-slate-500 mb-2">{plan.buyerMode}</CardDescription>
              <CardTitle className="mb-1 text-[40px] font-bold leading-none text-slate-900">
                ${annual ? plan.annualMonthly : plan.monthly}
                <span className="text-[14px] font-normal text-slate-500 ml-1">/mo</span>
              </CardTitle>
              {annual && (
                <p className="text-[12px] text-slate-400 mb-3">
                  billed as ${plan.annual.toLocaleString()}/yr &middot; <span className="text-green-600">Save ${plan.monthly * 12 - plan.annual}</span>
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0">
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
            </CardContent>
            <CardFooter className="mt-auto rounded-none border-t-0 bg-transparent p-0">
              <Button
                className="w-full"
                render={
                  <Link
                    href="/signup?from=pricing"
                    data-emi-cta={`pricing_plan_${plan.key}`}
                    data-emi-to="/signup?from=pricing"
                  />
                }
              >
                Start free trial
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
