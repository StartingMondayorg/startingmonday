import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { JsonLd } from '@/app/components/JsonLd'
import { SiteHeader } from '@/app/components/SiteHeader'
import { SiteFooter } from '@/app/components/SiteFooter'

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
      <main className="min-h-screen bg-background text-foreground">
        <section className="border-b border-border px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Individuals lane selection</p>
              <h2 className="mt-4 max-w-2xl text-[34px] font-semibold leading-[1.08] sm:text-[56px]">
                Start with the path that matches your moment.
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-foreground/90">
                Each path is tailored to you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/for-executives"
                  className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary/10 px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-primary shadow-md transition-all hover:-translate-y-[1px] hover:border-primary hover:bg-muted/40 hover:text-primary"
                >
                  Executives
                </Link>
                <Link
                  href="/for-leaders"
                  className="inline-flex items-center justify-center rounded-full border border-border/60 bg-muted/40 px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-foreground shadow-md transition-all hover:-translate-y-[1px] hover:border-border hover:bg-muted/40 hover:text-foreground"
                >
                  Leaders
                </Link>
              </div>
            </div>

            <figure className="order-last mx-auto w-[70%] max-w-[360px] rounded-[18px] border border-border bg-card/55 p-1.5 shadow-lg lg:order-none lg:mr-0 lg:ml-auto lg:w-full lg:max-w-[420px]">
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
          <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-border bg-gradient-to-b from-card/65 to-background/80 p-6 shadow-2xl sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">See a preview</p>
            <h3 className="mt-3 text-[30px] font-semibold leading-tight text-foreground sm:text-[40px]">Explore what your system looks like in practice.</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/demo/executive-brief"
                className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary/10 px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-primary shadow-md transition-all hover:-translate-y-[1px] hover:border-primary hover:bg-muted/40 hover:text-primary"
              >
                Demo Brief
              </Link>
              <Link
                href="/demo/executive-dashboard"
                className="inline-flex items-center justify-center rounded-full border border-border/60 bg-muted/40 px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-foreground shadow-md transition-all hover:-translate-y-[1px] hover:border-border hover:bg-muted/40 hover:text-foreground"
              >
                Demo Dashboard
              </Link>
              <Link
                href="/demo/cio/notes"
                className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary/10 px-6 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-primary shadow-md transition-all hover:-translate-y-[1px] hover:border-primary hover:bg-muted/40 hover:text-primary"
              >
                Target Companies + Key People
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup?utm_source=individuals&utm_medium=landing&utm_campaign=for-individuals-page"
                className="inline-flex items-center justify-center rounded-full border border-primary/70 bg-primary px-7 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start your free trial
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 pb-12 pt-8 sm:px-10 sm:pb-16 sm:pt-10">
          <div className="mx-auto max-w-6xl rounded-2xl border border-success/20 bg-success/[0.03] px-6 py-6 sm:px-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-success">• Private by default</p>
            <p className="mt-3 max-w-4xl text-[16px] leading-relaxed text-foreground/90">
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
