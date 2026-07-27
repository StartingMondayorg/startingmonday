import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { JsonLd } from '@/components/JsonLd'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Starting Monday for Individuals - Choose your path and run a clear plan',
  description: 'Pick the lane that matches your transition, run a clean weekly system, and keep your outreach private by default.',
  keywords: [
    'individual executive transition',
    'career lane selection',
    'executive search operating system',
    'private executive outreach',
    'leadership transition plan',
  ],
  openGraph: {
    title: 'Starting Monday for Individuals - Choose your path and run a clear plan',
    description: 'Choose your lane, run a clear plan, and stay private by default.',
    url: 'https://startingmonday.app/for-individuals',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday for Individuals - Choose your path and run a clear plan',
    description: 'Pick your lane and run a clean weekly system for signals, briefs, and outreach momentum.',
  },
  alternates: {
    canonical: 'https://startingmonday.app/for-individuals',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://startingmonday.app/for-individuals/#webpage',
  url: 'https://startingmonday.app/for-individuals',
  name: 'Starting Monday for Individuals',
  description: 'Choose your lane and run a disciplined weekly system for executive transitions.',
  isPartOf: {
    '@type': 'WebSite',
    url: 'https://startingmonday.app',
    name: 'Starting Monday',
  },
}

export default async function ForIndividualsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <h1 className="sr-only">Starting Monday for individuals pursuing leadership roles</h1>
      <SiteHeader />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />
        <section className="border-b border-white/10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">Individuals lane selection</p>
              <h2 className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.08] sm:text-[56px]">
                Start with the path that matches your moment.
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-200/90">
                Each path is tailored to you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/for-executives"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7b778]/70 bg-[linear-gradient(135deg,rgba(245,232,201,0.12),rgba(194,158,92,0.08))] px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#f3ddb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(173,136,72,0.2)] transition-all hover:-translate-y-[1px] hover:border-[#e0c486] hover:bg-[linear-gradient(135deg,rgba(247,236,208,0.18),rgba(198,163,97,0.12))] hover:text-[#f7e7c1]"
                >
                  Executives
                </Link>
                <Link
                  href="/for-leaders"
                  className="inline-flex items-center justify-center rounded-full border border-[#c8ccd5]/60 bg-[linear-gradient(135deg,rgba(231,235,244,0.1),rgba(173,180,196,0.08))] px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#e4e8f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_rgba(137,145,162,0.18)] transition-all hover:-translate-y-[1px] hover:border-[#d7dce7] hover:bg-[linear-gradient(135deg,rgba(235,239,247,0.15),rgba(182,188,202,0.1))] hover:text-white"
                >
                  Leaders
                </Link>
              </div>
            </div>

            <figure className="order-last mx-auto w-[70%] max-w-[360px] rounded-[18px] border border-white/12 bg-slate-900/55 p-1.5 shadow-[0_24px_52px_rgba(2,6,23,0.4)] lg:order-none lg:mr-0 lg:ml-auto lg:w-full lg:max-w-[420px]">
              <Image
                src="/individuals-doorway.webp"
                alt="Professional woman in a dark suit opening an office door and glancing back over her shoulder"
                className="block max-h-[440px] w-full rounded-[14px] object-cover [object-position:center_75%]"
                width={1024}
                height={1536}
                priority
              />
            </figure>
          </div>
        </section>

        <section className="-mt-2 px-6 pb-12 pt-4 sm:-mt-3 sm:px-10 sm:pb-16 sm:pt-6">
          <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-white/12 bg-gradient-to-b from-slate-900/65 to-slate-950/80 p-6 shadow-[0_28px_78px_rgba(2,6,23,0.34)] sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">See a preview</p>
            <h3 className="mt-3 text-[30px] font-semibold leading-tight text-white sm:text-[40px]">Explore what your system looks like in practice.</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/demo/executive-brief"
                className="inline-flex items-center justify-center rounded-full border border-[#d7b778]/70 bg-[linear-gradient(135deg,rgba(245,232,201,0.12),rgba(194,158,92,0.08))] px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#f3ddb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(173,136,72,0.2)] transition-all hover:-translate-y-[1px] hover:border-[#e0c486] hover:bg-[linear-gradient(135deg,rgba(247,236,208,0.18),rgba(198,163,97,0.12))] hover:text-[#f7e7c1]"
              >
                Demo Brief
              </Link>
              <Link
                href="/demo/executive-dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[#c8ccd5]/60 bg-[linear-gradient(135deg,rgba(231,235,244,0.1),rgba(173,180,196,0.08))] px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#e4e8f1] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_rgba(137,145,162,0.18)] transition-all hover:-translate-y-[1px] hover:border-[#d7dce7] hover:bg-[linear-gradient(135deg,rgba(235,239,247,0.15),rgba(182,188,202,0.1))] hover:text-white"
              >
                Demo Dashboard
              </Link>
              <Link
                href="/demo/cio/notes"
                className="inline-flex items-center justify-center rounded-full border border-[#d7b778]/70 bg-[linear-gradient(135deg,rgba(245,232,201,0.12),rgba(194,158,92,0.08))] px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-[#f3ddb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(173,136,72,0.2)] transition-all hover:-translate-y-[1px] hover:border-[#e0c486] hover:bg-[linear-gradient(135deg,rgba(247,236,208,0.18),rgba(198,163,97,0.12))] hover:text-[#f7e7c1]"
              >
                Target Companies + Key People
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup?utm_source=individuals&utm_medium=landing&utm_campaign=for-individuals-page"
                className="inline-flex items-center justify-center rounded-full border border-orange-300/70 bg-orange-400 px-7 py-3 text-[14px] font-semibold text-slate-950 transition-colors hover:bg-orange-300"
              >
                Start your free trial
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 pb-12 pt-8 sm:px-10 sm:pb-16 sm:pt-10">
          <div className="mx-auto max-w-6xl rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.03] px-6 py-6 sm:px-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-300">• Private by default</p>
            <p className="mt-3 max-w-4xl text-[16px] leading-relaxed text-slate-200/90">
              Your search stays private by design. We never share your identity, targets, or activity with employers or recruiters,
              and your outreach planning remains visible only to you and explicitly invited collaborators.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
