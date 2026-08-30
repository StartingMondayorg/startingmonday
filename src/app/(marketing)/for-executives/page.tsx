import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { JsonLd } from '@/app/components/JsonLd'
import { SiteHeader } from '@/app/components/SiteHeader'
import { SiteFooter } from '@/app/components/SiteFooter'

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
      <main className="min-h-screen bg-background text-foreground">
        <section className="border-b border-border px-6 py-18 sm:px-10 sm:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">For executives</p>
              <h1 className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.08] sm:text-[48px]">
                Be on the shortlist before the role is posted.
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-foreground/90">
                Find likely-to-open roles first. Talk to the people shaping the decision. Follow a weekly relationship plan.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shortlist-sprint?utm_source=executives&utm_medium=landing&utm_campaign=shortlist-sprint"
                  className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary px-7 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start 7-day shortlist sprint
                </Link>
                <Link
                  href="/demo/wedge-30s"
                  className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-primary/10"
                >
                  Preview 30-second wedge demo
                </Link>
              </div>
              <p className="mt-4 text-[12px] tracking-[0.01em] text-muted-foreground">Confidential by design. No employer visibility. No outbound exposure.</p>
            </div>

            <figure className="mx-auto w-[70%] max-w-[360px] rounded-[18px] border border-border bg-card/55 p-1.5 shadow-lg lg:mr-0 lg:ml-auto lg:w-full lg:max-w-[420px]">
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

        <section className="border-b border-border px-6 py-12 sm:px-10 sm:py-14">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">What Executives say they need.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">
                  Executives find jobs through timing, relationships, and disciplined follow-through. Starting Monday makes those three things visible and actionable.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <article className="relative overflow-hidden rounded-3xl border border-border bg-muted/[0.06] p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">01</p>
                <p className="mt-3 text-[15px] font-semibold text-foreground">Timing intelligence</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">See likely-to-open roles before they become crowded public searches.</p>
              </article>
              <article className="relative overflow-hidden rounded-3xl border border-border bg-muted/[0.06] p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-muted/70 via-primary to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">02</p>
                  <p className="mt-3 text-[15px] font-semibold text-foreground">Talk to the right people</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">Map the decision-path people who shape the shortlist and know where to focus now.</p>
              </article>
              <article className="relative overflow-hidden rounded-3xl border border-border bg-muted/[0.06] p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-muted/70 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">03</p>
                  <p className="mt-3 text-[15px] font-semibold text-foreground">Clear Plan</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">Turn opportunity intelligence into a weekly action plan so momentum stays visible.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-6 py-14 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Starting Monday vs. other services</h2>
            <p className="mt-3 max-w-5xl text-[15px] leading-relaxed text-foreground/90 lg:max-w-none">
              Most alternatives make you do the coordination, absorb the reputational risk, and manage a fragmented process yourself.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted/[0.05]">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[39%]" />
                  <col className="w-[39%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3">Key aspect</th>
                    <th className="px-5 py-3 text-muted-foreground">Other products and services</th>
                    <th className="px-5 py-3 text-primary">Starting Monday</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Approach', 'Spray and pray outreach that can put your reputation at risk.', 'Targeted, reputation-aware search management.'],
                    ['Workload', 'Manual work by you and by them across scattered tools and messages.', 'Structured system support with one operating view.'],
                    ['Process control', 'No organized process for you to manage or measure.', 'One organized process you can see and manage weekly.'],
                    ['Relationship management', 'No relationship management layer to protect key conversations.', 'Clear visibility into who matters, who is warming, and what to do next.'],
                  ].map(([area, typical, ours]) => (
                    <tr key={area} className="border-b border-border last:border-b-0 align-top">
                      <th className="px-5 py-4 text-left text-[14px] font-semibold leading-relaxed text-foreground">{area}</th>
                      <td className="px-5 py-4 text-[14px] leading-relaxed text-muted-foreground">{typical}</td>
                      <td className="px-5 py-4 text-[14px] leading-relaxed text-foreground/90">{ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-6 py-14 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-[15px] font-semibold text-foreground">Common questions</p>
            <div className="mt-4 space-y-3">
              {[
                ['Is my search completely confidential?', 'Yes. Your employer cannot see your account or your search activity. Starting Monday is designed from the ground up to be invisible to your current organization.'],
                ['How is this different from working with a recruiter?', 'Recruiters work for the hiring company, not for you. Starting Monday works on your behalf - building your positioning, finding the right signals early, and keeping you in control of which conversations you enter and when.'],
                ['How quickly do executives see useful signals?', 'Most users see relevant movement within the first week of setting up their target list. The value starts with intelligence and positioning, so you are prepared before a role surfaces publicly.'],
              ].map(([question, answer]) => (
                <details key={question} className="rounded-xl border border-border bg-muted/[0.03] px-5 py-4">
                  <summary className="cursor-pointer list-none text-[14px] font-semibold text-foreground">{question}</summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-muted/[0.06] px-6 py-10 text-center shadow-xl sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Next step</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight text-foreground sm:text-[38px]">Start with one decisive week.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/90">
              Build your role map, tighten your narrative, and enter priority conversations fully prepared.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/shortlist-sprint?utm_source=executives&utm_medium=landing&utm_campaign=shortlist-sprint"
                className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary px-7 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start 7-day shortlist sprint
              </Link>
              <Link
                href="/learn-more"
                className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-primary/10"
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
