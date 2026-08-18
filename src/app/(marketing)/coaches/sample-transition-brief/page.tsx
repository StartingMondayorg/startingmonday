import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sample Transition Brief | Starting Monday for Coaches',
  description:
    'A full sample transition brief for executive coaches: context, thesis, interview pressure points, risk flags, and a 30-day coaching plan.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/sample-transition-brief',
  },
}

const risks = [
  'Narrative still over-indexes on responsibilities instead of value creation outcomes.',
  'Board-facing examples are strong but operating-metric specificity is inconsistent.',
  'Compensation and scope expectations not yet pressure-tested against market reality.',
]

const briefSnapshot = [
  { label: 'Target lane', value: 'CFO transitions in sponsor-backed industrial and healthcare platforms' },
  { label: 'Transition readiness', value: '86% (decision-ready with targeted narrative edits)' },
  { label: 'Highest-risk gap', value: 'Quantification depth in two core proof stories' },
  { label: 'Immediate objective', value: 'Convert readiness into first-round conversion consistency' },
]

const thesisPillars = [
  'Rebuild finance discipline without stalling growth optionality.',
  'Translate board pressure into an execution cadence the team can actually run.',
  'Lead integration and reporting credibility through volatile periods.',
]

const targetMandateCriteria = [
  'Sponsor-backed business with margin-reset pressure and timeline urgency.',
  'CEO and board willing to prioritize operating rigor in first 180 days.',
  'Role scope includes both finance control and strategic capital communication.',
]

const stakeholderMap = [
  {
    stakeholder: 'CEO sponsor',
    priority: 'Execution speed with no credibility loss',
    coachingFocus: 'Coach concise first-100-day narrative with trade-off language.',
  },
  {
    stakeholder: 'Board / audit committee chair',
    priority: 'Forecast confidence and control maturity',
    coachingFocus: 'Pressure-test risk language and metric confidence under challenge.',
  },
  {
    stakeholder: 'Private equity operating partner',
    priority: 'Value-creation milestones and reporting reliability',
    coachingFocus: 'Link operating actions to measurable sponsor outcomes.',
  },
]

const objectionsAndResponses = [
  {
    objection: 'You look operationally strong, but can you scale to board-level CFO demands?',
    response: 'Lead with two governance-heavy examples where reporting discipline improved strategic decision quality, not just close speed.',
  },
  {
    objection: 'Your transformation examples sound broad. Where is the measurable impact?',
    response: 'Use pre/post metrics for margin, cash conversion, and forecast variance with timeline accountability.',
  },
  {
    objection: 'Are you prepared for sponsor pace and political pressure?',
    response: 'Demonstrate decision cadence under conflict with one example of preserving alignment through disagreement.',
  },
]

const interviewStrategy = [
  'Open with a 90-second transition thesis tied to business outcomes, not biography.',
  'Use a three-story sequence: stabilize, scale, and govern under pressure.',
  'Close with role-specific questions that demonstrate operator-level judgment.',
]

const firstNinetyDays = [
  'Days 1-30: validate finance control baseline, sponsor expectations, and reporting risk map.',
  'Days 31-60: align KPI cadence, decision forums, and cross-functional accountability loops.',
  'Days 61-90: launch operating rhythm with board-ready confidence measures and correction triggers.',
]

const relationshipPlan = [
  'Retained search partner: share role-specific thesis memo and quantified proof stories.',
  'Audit committee connector: validate governance risk concerns before formal panel sequence.',
  'Former sector CFO peer: challenge-test message credibility and likely blind spots.',
]

const thirtyDayPlan = [
  'Week 1: Rewrite transition thesis for sponsor language and measurable outcomes.',
  'Week 2: Rehearse objection responses for scope, pace, and integration credibility.',
  'Week 3: Activate three relationship channels with tailored outreach scripts.',
  'Week 4: Run mock panel interview and reset weak proof stories before live loops.',
]

export default function SampleTransitionBriefPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-orange-200">Sample transition brief</p>
          <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-white sm:text-[52px]">
            This brief shows how a coach moves a senior candidate from prepared to compelling.
          </h1>
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-slate-200 sm:text-[19px]">
            One narrative spine: context, thesis, interview pressure points, risk flags, and an execution plan for the next 30 days.
          </p>

          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Executive summary</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
              Candidate is directionally strong for high-pressure CFO transition mandates. The coaching objective is to tighten proof specificity and board-facing narrative precision so first-round confidence converts to finalist-level credibility.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Brief snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {briefSnapshot.map((item) => (
                <article key={item.label} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-[12px] font-medium tracking-[0.04em] text-slate-300">{item.label}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-100">{item.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Context</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
              Candidate is targeting CFO transitions in sponsor-backed industrial and healthcare businesses undergoing margin reset and integration complexity.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Thesis</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
              The candidate is strongest where financial discipline must be rebuilt while preserving strategic growth options. Core edge: operating rigor plus sponsor communication under pressure.
            </p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {thesisPillars.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Target mandate criteria</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {targetMandateCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Stakeholder map and coaching focus</p>
            <div className="mt-3 grid gap-3">
              {stakeholderMap.map((item) => (
                <article key={item.stakeholder} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                  <h2 className="text-[16px] font-semibold text-white">{item.stakeholder}</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-200">Priority: {item.priority}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-300">Coaching focus: {item.coachingFocus}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Interview focus</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {interviewStrategy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Likely objections and responses</p>
            <div className="mt-3 grid gap-3">
              {objectionsAndResponses.map((item) => (
                <article key={item.objection} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                  <p className="text-[13px] font-semibold text-white">Objection: {item.objection}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-200">Response strategy: {item.response}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Risk flags</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">First 90-day operating priorities</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {firstNinetyDays.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">Relationship activation plan</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {relationshipPlan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-orange-200">30-day coaching sprint</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {thirtyDayPlan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/coaches"
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Back to coach page
            </Link>
            <Link
              href="/coaches/objections"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
            >
              Review coach objections guide
            </Link>
          </div>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
