import type { Metadata } from 'next'
import Link from 'next/link'
import { CoachPreviewActions } from '../coach-preview-actions'
import { CoachValueNudge } from '@/components/CoachValueNudge'
import { COACH_BUYER_PLANS, PILOT_SCORECARD, PREVIEW_SENTENCE } from '../page-content'

export const metadata: Metadata = {
  title: 'Coach Pricing and Economics | Starting Monday',
  description: 'Client pricing, partner economics, and preview structure for executive coaches evaluating Starting Monday.',
  alternates: { canonical: 'https://startingmonday.app/for-coaches/economics' },
}

const CLIENT_PLANS = [
  {
    name: 'Monitor',
    price: '$49/mo',
    fit: 'Executives who want structured signal monitoring and pipeline discipline before the search turns urgent.',
  },
  {
    name: 'Active',
    price: '$199/mo',
    fit: 'Executives in active search who need daily signal action, prep briefs, and stronger relationship follow-through.',
  },
  {
    name: 'Executive',
    price: '$499/mo',
    fit: 'High-stakes C-suite searches where preparation depth and right-role calibration are critical.',
  },
]

const ECONOMICS = [
  '20% recurring commission on paid client subscriptions referred through the coach partner link.',
  'No enrollment fee and no minimum volume for referral partners.',
  'Preferred-partner options available for coaches or firms enrolling multiple clients.',
  'Client plans still start with a 30-day free trial and no credit card.',
]

const PARTNER_MECHANICS = [
  'Commission begins when a referred client converts from free trial to a paid subscription.',
  'Preview seats and free-trial days do not generate commission; they exist to evaluate fit without pressure.',
  'Recurring commission continues while the referred client remains on a paid plan.',
  'Preferred partner currently means 5 or more active paid client seats or a coordinated firm-managed rollout.',
]

export default function CoachEconomicsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-coaches" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to coach preview
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
<header className="mb-12">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
            Coach pricing and partner economics
          </p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            The details, one click deeper.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            This page is for coaches who already understand the workflow and want to know how trials, client plans, and partner economics work in practice. If you still want the fastest answer, request the preview first.
          </p>
        </header>

        <section className="mb-10">
          <CoachValueNudge
            eyebrow="Economics with value attached"
            title="The price only matters if the workflow feels useful."
            body="Use the preview to verify fit, then use this page to compare the pricing and partner lanes. That keeps the decision anchored in value instead of just subscription math."
            sourcePage="/for-coaches/economics"
            secondaryHref="/for-coaches"
            secondaryLabel="Back to coach preview"
          />
        </section>

        <section className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 sm:p-7 mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-3">
            Preview structure
          </h2>
          <div className="space-y-3 text-[14px] text-slate-700 leading-relaxed">
            <p>{PREVIEW_SENTENCE}</p>
            <p>After the preview, coaches can either buy a coach plan directly or use the referral-partner model if they prefer clients to subscribe directly.</p>
            <p>Starting Monday does not replace coaching sessions. It increases session yield by reducing context rebuild and improving between-session execution.</p>
          </div>
        </section>

        <section className="mb-10 border border-orange-200 bg-orange-50/40 rounded-2xl p-6 sm:p-7">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-700 mb-3">
            Pilot success criteria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PILOT_SCORECARD.map((item) => (
              <div key={item.metric} className="rounded-2xl border border-orange-100 bg-white p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-900 mb-2">{item.metric}</p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{item.success}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-5">
            Coach buyer pricing (primary path)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COACH_BUYER_PLANS.map((plan) => (
              <div key={plan.name} className="border border-slate-200 rounded-2xl p-5 bg-white">
                <p className="text-[16px] font-semibold text-slate-900 mb-1">{plan.name}</p>
                <p className="text-[20px] font-bold text-orange-600 mb-3">{plan.price}</p>
                <p className="text-[14px] text-slate-600 leading-relaxed">{plan.fit}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-500 mt-4">
            These plans are designed to stay below one lost coaching session of value per month while improving client readiness and session quality.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-5">
            Referral lane: client pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLIENT_PLANS.map((plan) => (
              <div key={plan.name} className="border border-slate-200 rounded-2xl p-5 bg-white">
                <p className="text-[16px] font-semibold text-slate-900 mb-1">{plan.name}</p>
                <p className="text-[20px] font-bold text-orange-600 mb-3">{plan.price}</p>
                <p className="text-[14px] text-slate-600 leading-relaxed">{plan.fit}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-500 mt-4">
            All client plans start with a 30-day free trial and no credit card. Use this lane when you want clients to own the subscription directly.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-5">
            Referral partner economics (secondary path)
          </h2>
          <div className="border border-slate-200 rounded-2xl p-6 bg-white">
            <ul className="space-y-3 mb-5">
              {ECONOMICS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-relaxed">
                  <span className="text-orange-500 shrink-0 mt-0.5">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4">
              <h3 className="text-[12px] font-semibold text-slate-900 mb-1">Illustrative example</h3>
              <p className="text-[14px] text-slate-700 leading-relaxed">10 active client referrals on Search at $199/mo is about $398/mo in recurring partner revenue while those clients keep a structured execution layer between sessions.</p>
              <p className="text-[12px] text-slate-600 leading-relaxed mt-2">Outcome metric: track 30-day readiness lift, first interview pace, and prep-brief usage before scaling your lane.</p>
            </div>
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-3">
            Keep the trust boundary clear
          </h2>
          <div className="space-y-3 text-[14px] text-slate-600 leading-relaxed">
            <p>Lead with client readiness and workflow fit, not commissions. Economics should support the relationship, not define it.</p>
            <p>The simplest framing: if this makes coaching more effective and gives clients better between-session discipline, there is also a partner model available.</p>
            <p>Trust and confidentiality: clients control coach access and can revoke visibility at any time.</p>
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-3">
            Mechanics, not mystery
          </h2>
          <div className="space-y-3 text-[14px] text-slate-600 leading-relaxed">
            {PARTNER_MECHANICS.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">
            Next step
          </h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
            If the economics look reasonable, go back to the coach preview and request the live walkthrough. That keeps the evaluation anchored in workflow quality, not theory, and makes the next step obvious.
          </p>
          <CoachPreviewActions />
          <div className="flex flex-wrap gap-4 mt-5 text-[13px]">
            <Link href="/for-coaches/faq" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Read the coach FAQ
            </Link>
            <Link href="/for-coaches" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Return to the coach preview
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

