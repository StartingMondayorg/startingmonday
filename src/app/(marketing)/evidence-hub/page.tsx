import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'

import { SiteFooter } from '@/components/SiteFooter'
import { PublicPageHeader } from '@/components/PublicPageHeader'

import {
  EVIDENCE_INTRODUCTION,
  EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS,
  ALL_EVIDENCE_SOURCES,
} from './content'

export const metadata: Metadata = {
  title: 'Evidence Hub | Starting Monday',
  description: 'Built on research, not hunches. Evidence Hub explains the WHY and WHAT behind Starting Monday using peer-reviewed research, industry data, and real outcomes.',
  alternates: {
    canonical: 'https://startingmonday.app/evidence-hub',
  },
  openGraph: {
    title: 'Evidence Hub - Starting Monday',
    description: 'Research-based frameworks for executive transitions. Peer-reviewed studies, industry research, and validation data.',
    url: 'https://startingmonday.app/evidence-hub',
    type: 'website',
  },
}

const evidenceHubJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Evidence Hub',
  url: 'https://startingmonday.app/evidence-hub',
  description: 'Source-backed methods and findings for executive transition workflows.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Starting Monday',
    url: 'https://startingmonday.app',
  },
  about: [
    'Executive transition strategy',
    'Executive coaching effectiveness',
    'Early role signals',
    'Behavior change and execution cadence',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Starting Monday',
    url: 'https://startingmonday.app',
  },
}

export default function EvidenceRoomPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <JsonLd data={evidenceHubJsonLd} />
      <PublicPageHeader backHref="/" />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        {/* How we find roles */}
        <section className="mt-10 max-w-4xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(2,6,23,0.28)] sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">How we find roles</p>
          <h1 className="mt-3 text-[1.8rem] font-serif leading-tight text-white sm:text-[2.2rem]">
            Proprietary signal detection, clear validation, and a trust boundary.
          </h1>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            We built a proprietary system that separates meaningful role signals from market noise across thousands of companies. It uses public information, then validates the pattern before anything is surfaced as a likely opportunity. The goal is earlier context and better timing without exposing the scoring system behind it.
          </p>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            It reflects a founder who builds systems that turn noisy information into decisive action, informed by running a senior search and seeing how much of the process was still broken.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-orange-200">What we analyze</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                Executive moves, funding events, filings, press releases, company announcements, and adjacent public changes that often precede a mandate.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-orange-200">How we validate</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                No single signal is enough. We look for patterns across multiple sources and only elevate directionally strong matches.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-orange-200">What stays private</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                We disclose the evidence categories and reliability standards, but not the exact weighting, trigger logic, or ranking model.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <p className="text-[14px] leading-relaxed text-orange-100">
              <span className="font-semibold text-orange-200">Why this matters:</span> you get enough transparency to trust the signal, without making it easier for competitors to copy the engine.
            </p>
          </div>
        </section>

        {/* Main sections */}
        {EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS.map((section) => (
          <section key={section.id} id={section.id} className="mt-12 scroll-mt-20">
            <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(2,6,23,0.28)] sm:p-6">
              {/* Section header */}
              <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">{section.subtitle}</p>
                <h2 className="mt-3 text-[1.8rem] font-serif leading-tight text-white sm:text-[2.2rem]">
                  {section.title}
                </h2>
                <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-slate-300">
                  {section.overview}
                </p>
                <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">
                  {section.whyItMatters}
                </p>
              </div>

              {/* Key insights */}
              <div className="space-y-6">
                {section.keyInsights.map((insight, idx) => (
                  <article key={idx} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                    {/* Claim */}
                    <p className="text-[15px] font-semibold text-white">{insight.claim}</p>

                    {/* Sources */}
                    <div className="mt-4 space-y-3">
                      {insight.sources.map((source) => {
                        const isInternal = source.type === 'internal'

                        return (
                          <div key={source.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex gap-2">
                              <span className="mt-0.5 inline-flex shrink-0 rounded-full bg-orange-500/20 px-2 py-1 text-[11px] font-semibold text-orange-300">
                                {source.type === 'academic' ? 'Peer-reviewed' : source.type === 'business' ? 'Industry' : source.type === 'book' ? 'Book' : 'Internal'}
                              </span>
                            </div>

                            <div className="mt-2 text-[13px] leading-relaxed text-slate-300">
                              {source.authors && (
                                <p className="font-semibold text-slate-200">
                                  {source.authors}
                                </p>
                              )}
                              <p className="mt-1">
                                <span className="italic">{source.title}</span>
                                {source.publication && (
                                  <>
                                    {' - '}
                                    <span className="text-slate-400">{source.publication}</span>
                                  </>
                                )}
                                {source.year && (
                                  <>
                                    {' - '}
                                    <span className="text-slate-400">{source.year}</span>
                                  </>
                                )}
                              </p>

                              <p className="mt-2 text-slate-300">
                                <strong className="text-slate-200">Key finding:</strong> {source.keyFinding}
                              </p>

                              {(source.doi || source.url) && (
                                <div className="mt-2 flex gap-2">
                                  {source.doi && (
                                    <a
                                      href={source.doi}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-orange-300 hover:text-orange-200 underline underline-offset-2 text-[12px]"
                                    >
                                      DOI
                                    </a>
                                  )}
                                  {source.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-orange-300 hover:text-orange-200 underline underline-offset-2 text-[12px]"
                                    >
                                      {isInternal ? 'Learn more' : 'Source'}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Implication */}
                    <div className="mt-4 rounded-lg bg-orange-500/10 p-3 border border-orange-500/20">
                      <p className="text-[13px] leading-relaxed text-orange-100">
                        <strong className="text-orange-200">Why this matters for you:</strong> {insight.implication}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Navigation to method section */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <h2 className="text-[1.4rem] font-serif leading-tight text-white">From evidence to execution</h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            The Evidence Hub explains why and what we believe. Explore the broader positioning and operating context next.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/learn-more"
              className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-600"
            >
              Learn more about Starting Monday
            </Link>
          </div>
        </section>

        {/* Full sources list */}
        <section className="mt-14 border-t border-white/10 pt-10">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-200">All sources</p>
            <h2 className="mt-3 text-[1.7rem] font-serif leading-tight text-white sm:text-[2.1rem]">
              Complete source index
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
              All sources are organized by category below. Each entry includes the original source URL or DOI 
              so you can verify and explore the research yourself.
            </p>
          </div>

          {/* Academic sources */}
          <div className="mt-8">
            <h3 className="text-[1.1rem] font-semibold text-orange-200">Peer-reviewed research</h3>
            <div className="mt-4 space-y-3">
              {ALL_EVIDENCE_SOURCES.filter((s) => s.type === 'academic').map((source) => (
                <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[13px] leading-relaxed">
                    <span className="font-semibold text-white">{source.authors}</span>
                    {' - '}
                    <span className="italic text-slate-300">{source.title}</span>
                    {source.publication && (
                      <>
                        {' - '}
                        <span className="text-slate-400">{source.publication}</span>
                      </>
                    )}
                    {source.year && (
                      <>
                        {' '}
                        <span className="text-slate-500">({source.year})</span>
                      </>
                    )}
                  </p>
                  {source.doi && (
                    <p className="mt-2 text-[12px]">
                      <a
                        href={source.doi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-300 hover:text-orange-200 underline underline-offset-2"
                      >
                        {source.doi}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Business & industry sources */}
          <div className="mt-8">
            <h3 className="text-[1.1rem] font-semibold text-orange-200">Industry publications & research</h3>
            <div className="mt-4 space-y-3">
              {ALL_EVIDENCE_SOURCES.filter((s) => s.type === 'business').map((source) => (
                <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[13px] leading-relaxed">
                    {source.authors && (
                      <>
                        <span className="font-semibold text-white">{source.authors}</span>
                        {' - '}
                      </>
                    )}
                    <span className="italic text-slate-300">{source.title}</span>
                    {source.publication && (
                      <>
                        {' - '}
                        <span className="text-slate-400">{source.publication}</span>
                      </>
                    )}
                    {source.year && (
                      <>
                        {' '}
                        <span className="text-slate-500">({source.year})</span>
                      </>
                    )}
                  </p>
                  {source.url && (
                    <p className="mt-2 text-[12px]">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-300 hover:text-orange-200 underline underline-offset-2"
                      >
                        {source.url}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Internal sources */}
          <div className="mt-8">
            <h3 className="text-[1.1rem] font-semibold text-orange-200">Internal evidence & pilot data</h3>
            <div className="mt-4 space-y-3">
              {ALL_EVIDENCE_SOURCES.filter((s) => s.type === 'internal').map((source) => (
                <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[13px] leading-relaxed">
                    <span className="font-semibold text-white">{source.title}</span>
                    {source.publication && (
                      <>
                        {' - '}
                        <span className="text-slate-400">{source.publication}</span>
                      </>
                    )}
                  </p>
                  {source.url && (
                    <p className="mt-2 text-[12px]">
                      <Link
                        href={source.url}
                        className="text-orange-300 hover:text-orange-200 underline underline-offset-2"
                      >
                        {source.url}
                      </Link>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-14 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5 sm:p-6">
          <h2 className="text-[1.4rem] font-serif leading-tight text-white">Ready to apply this research?</h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            Starting Monday takes the frameworks and evidence above and translates them into a practical 
            operating system for your executive transition. See how other executives are using research-based 
            approaches to move faster, prepare better, and reach opportunities earlier.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-600"
            >
              Back to Starting Monday
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter className="bg-slate-950" />
    </div>
  )
}

