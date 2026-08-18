import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { JsonLd } from '@/components/JsonLd'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Starting Monday for Executives - Be on the shortlist before the role is posted',
  description: 'For executives who need likely-to-open roles, decision-path contacts, and weekly relationship execution before the posting goes public.',
  keywords: [
    'executive transition infrastructure',
    'executive role transition',
    'board-caliber leadership',
    'board-ready executive positioning',
    'executive search signal intelligence',
  ],
  openGraph: {
    title: 'Starting Monday for Executives - Be on the shortlist before the role is posted',
    description: 'Find likely-to-open roles, map decision-path contacts, and act before the shortlist is crowded.',
    url: 'https://startingmonday.app/for-executives',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for Executives - Be on the shortlist before the role is posted',
    description: 'Find likely-to-open roles, map decision-path contacts, and act before the shortlist is crowded.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-executives',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-executives/#webpage',
  url: 'https://startingmonday.app/for-executives',
  name: 'Starting Monday for Executives',
  description: 'Executive transition infrastructure for leaders moving into C-suite and board-caliber mandates.',
  isPartOf: {
    '@type': 'WebSite',
    url: 'https://startingmonday.app',
    name: 'Starting Monday',
  },
}

export default async function ForExecutivesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />
        <section className="border-b border-white/10 px-6 py-18 sm:px-10 sm:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">For executives</p>
              <h1 className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.08] sm:text-[48px]">
                Be on the shortlist before the role is posted.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-200/90">
                Find likely-to-open roles first. Talk to the people shaping the decision. Follow a weekly relationship plan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shortlist-sprint?utm_source=executives&utm_medium=landing&utm_campaign=shortlist-sprint"
                  className="inline-flex items-center justify-center rounded-full border border-orange-300/70 bg-orange-400 px-7 py-3 text-[14px] font-semibold text-slate-950 transition-colors hover:bg-orange-300"
                >
                  Start 7-day shortlist sprint
                </Link>
                <Link
                  href="/demo/wedge-30s"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-[14px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-orange-400/10"
                >
                  Preview 30-second wedge demo
                </Link>
              </div>
              <p className="mt-4 text-[12px] tracking-[0.01em] text-slate-300">Confidential by design. No employer visibility. No outbound exposure.</p>
            </div>

            <figure className="mx-auto w-[70%] max-w-[360px] rounded-[18px] border border-white/12 bg-slate-900/55 p-1.5 shadow-[0_24px_52px_rgba(2,6,23,0.4)] lg:mr-0 lg:ml-auto lg:w-full lg:max-w-[420px]">
              <Image
                src="/executives-desk.webp"
                alt="Executive seated at a desk reviewing documents in a refined home office"
                className="block max-h-[440px] w-full rounded-[14px] object-cover object-center"
                width={1122}
                height={1402}
                priority
              />
            </figure>
          </div>
        </section>

        <section className="border-b border-white/10 px-6 py-12 sm:px-10 sm:py-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">What Executives say they need.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-200/80">
                  Executives find jobs through timing, relationships, and disciplined follow-through. Starting Monday makes those three things visible and actionable.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <article className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-300 via-orange-200 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/90">01</p>
                <p className="mt-3 text-[15px] font-semibold text-white">Timing intelligence</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200/90">See likely-to-open roles before they become crowded public searches.</p>
              </article>
              <article className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/70 via-orange-200 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/90">02</p>
                  <p className="mt-3 text-[15px] font-semibold text-white">Talk to the right people</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200/90">Map the decision-path people who shape the shortlist and know where to focus now.</p>
              </article>
              <article className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-200 via-white/70 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/90">03</p>
                  <p className="mt-3 text-[15px] font-semibold text-white">Clear Plan</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200/90">Turn opportunity intelligence into a weekly action plan so momentum stays visible.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-6 py-14 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Starting Monday vs. other services</h2>
            <p className="mt-3 max-w-5xl text-[15px] leading-relaxed text-slate-200/90 lg:max-w-none">
              Most alternatives make you do the coordination, absorb the reputational risk, and manage a fragmented process yourself.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.05]">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[39%]" />
                  <col className="w-[39%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                    <th className="px-5 py-3">Key aspect</th>
                    <th className="px-5 py-3 text-slate-400">Other products and services</th>
                    <th className="px-5 py-3 text-orange-100">Starting Monday</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Approach', 'Spray and pray outreach that can put your reputation at risk.', 'Targeted, reputation-aware search management.'],
                    ['Workload', 'Manual work by you and by them across scattered tools and messages.', 'Structured system support with one operating view.'],
                    ['Process control', 'No organized process for you to manage or measure.', 'One organized process you can see and manage weekly.'],
                    ['Relationship management', 'No relationship management layer to protect key conversations.', 'Clear visibility into who matters, who is warming, and what to do next.'],
                  ].map(([area, typical, ours]) => (
                    <tr key={area} className="border-b border-white/10 last:border-b-0 align-top">
                      <th className="px-5 py-4 text-left text-[14px] font-semibold leading-relaxed text-white">{area}</th>
                      <td className="px-5 py-4 text-[14px] leading-relaxed text-slate-400">{typical}</td>
                      <td className="px-5 py-4 text-[14px] leading-relaxed text-slate-200/90">{ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-6 py-14 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-[15px] font-semibold text-white">Common questions</p>
            <div className="mt-4 space-y-3">
              {[
                ['Is my search completely confidential?', 'Yes. Your employer cannot see your account or your search activity. Starting Monday is designed from the ground up to be invisible to your current organization.'],
                ['How is this different from working with a recruiter?', 'Recruiters work for the hiring company, not for you. Starting Monday works on your behalf - building your positioning, finding the right signals early, and keeping you in control of which conversations you enter and when.'],
                ['How quickly do executives see useful signals?', 'Most users see relevant movement within the first week of setting up their target list. The value starts with intelligence and positioning, so you are prepared before a role surfaces publicly.'],
              ].map(([question, answer]) => (
                <details key={question} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <summary className="cursor-pointer list-none text-[14px] font-semibold text-white">{question}</summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-slate-300">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/12 bg-white/[0.06] px-6 py-10 text-center shadow-[0_24px_62px_rgba(2,6,23,0.34)] sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Next step</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight text-white sm:text-[38px]">Start with one decisive week.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-200/90">
              Build your role map, tighten your narrative, and enter priority conversations fully prepared.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/shortlist-sprint?utm_source=executives&utm_medium=landing&utm_campaign=shortlist-sprint"
                className="inline-flex items-center justify-center rounded-full border border-orange-300/70 bg-orange-400 px-7 py-3 text-[14px] font-semibold text-slate-950 transition-colors hover:bg-orange-300"
              >
                Start 7-day shortlist sprint
              </Link>
              <Link
                href="/learn-more"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-[14px] font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-orange-400/10"
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
