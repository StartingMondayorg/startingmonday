import type { Metadata } from 'next'
import Link from 'next/link'
import { ProofStoriesModule } from '@/components/channel/ProofStoriesModule'

export const metadata: Metadata = {
  title: 'Starting Monday for Podcast Hosts and Newsletter Writers - Media Partner Guide',
  description: 'How podcast hosts and newsletter writers partner with Starting Monday to create original content on leadership-transition strategy and job-market intelligence.',
  alternates: { canonical: 'https://startingmonday.app/for-media-partners' },
  openGraph: {
    title: 'Starting Monday for Podcast Hosts and Newsletter Writers',
    description: 'Original data, practitioner expertise, and an audience your listeners and readers are already becoming.',
    url: 'https://startingmonday.app/for-media-partners',
  },
}

const CO_CREATION_FORMATS = [
  {
    name: 'Podcast Episode Series',
    description: 'Multi-episode series on senior executive career strategy co-created with Rich Rothschild, founder of Starting Monday. Rich spent two years studying how VP and C-suite technology searches actually work, then built the platform to run them correctly.',
    topics: [
      'How the job search changes when you reach VP or C-suite',
      'What retained search firms actually want from executive candidates',
      'Why technology executive candidates fail the first round',
      'How to build a target company list before a search starts',
      'What senior technology executives are doing differently in the 2026 job market',
    ],
    audience: 'Senior managers approaching VP and above, and executives already in active search.',
  },
  {
    name: 'Sponsored Research Distribution',
    description: 'Starting Monday monitors hundreds of company career pages and tracks organizational signals that precede senior technology and C-suite searches. That data becomes original, branded research for your newsletter: quarterly hiring trend reports, sector signal analysis, and job market intelligence your readers cannot get anywhere else.',
    topics: [
      'Senior technology hiring trends by sector and quarter',
      'Which organizational signals predict technology leadership searches',
      'Time-to-fill benchmarks for technology executive roles',
      'Pre-market signal patterns across 500+ monitored companies',
      'Technology executive compensation trends by role and sector',
    ],
    audience: 'Technology leaders, HR executives, investors, and career-focused professionals.',
  },
  {
    name: 'Listener or Reader Resource',
    description: 'Starting Monday as a recommended resource for your audience, with a dedicated landing page and promo code. Your listeners and readers who are in transition or preparing for one get access to the platform at a preferred rate. You earn commission on every activation.',
    topics: [],
    audience: 'Any audience with senior managers, directors, VPs, or C-suite executives.',
  },
]

const MEDIA_PARTNER_PROOF_STORIES = [
  {
    title: 'Newsletter intelligence issue',
    role: 'Career-focused writer',
    outcome: 'Original transition data outperformed generic sponsor copy on engagement and replies.',
  },
  {
    title: 'Podcast expert segment',
    role: 'Host for leadership audience',
    outcome: 'Audience response improved when content was framed around real transition decisions and timing.',
  },
  {
    title: 'Co-branded report pilot',
    role: 'Media partner team',
    outcome: 'Quarterly evidence content created repeatable authority assets beyond one-off promotions.',
  },
]

export default function ForMediaPartnersPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              See a demo
            </Link>
            <Link
              href="/partners"
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </nav>

      <main>
{/* Header */}
        <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              Media Partner Guide
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              Starting Monday for Podcast Hosts <span className="whitespace-nowrap">and Newsletter Writers</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Original data, practitioner expertise, and an audience your listeners and readers are already becoming.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Why now</p>
              <p className="text-[13px] leading-relaxed text-slate-200">AI-heavy content is crowded. Original, role-transition evidence is what earns trust and repeat audience attention.</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">This week</p>
              <ol className="space-y-1 text-[13px] leading-relaxed text-slate-200">
                <li>1. Choose one narrow transition topic tied to your audience.</li>
                <li>2. Publish one evidence-backed piece with method/source clarity.</li>
                <li>3. Compare response against your standard sponsored format.</li>
              </ol>
            </div>
          </div>
        </header>

        <ProofStoriesModule
          title="Role-specific outcomes from media partnerships"
          stories={MEDIA_PARTNER_PROOF_STORIES}
          sourceNote="Directional outcomes from partner trials; validate against your own audience baseline."
        />

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['500+', 'Monitored companies feeding the research and signal narrative'],
                ['2 business days', 'Expected turnaround after a partner application'],
                ['Quarterly', 'Natural cadence for co-branded research distribution'],
              ].map(([value, label]) => (
                <div key={value} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <p className="text-[24px] font-bold text-slate-900 mb-1">{value}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{label}</p>
                </div>
              ))}
            </section>

            <section className="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-2">Trust and methodology</p>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
                Research partnerships are built on original monitoring, explicit attribution, and clear methodology notes. We do not ask you to publish recycled job-board data or sponsor copy disguised as reporting.
              </p>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Verification path: review source methodology, choose a narrow pilot topic, and compare audience response against standard sponsored content before expanding the partnership.
              </p>
            </section>

            {/* What Starting Monday is */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered job search platform built for leadership-transition
                candidates. It gives them the intelligence infrastructure that
                senior searches require: monitoring of target companies for pre-search signals,
                AI-generated prep briefs for every interview, a structured pipeline for tracking
                relationships and conversations, and a daily briefing that keeps the search moving.
              </p>
              <p>
                It was built by Rich Rothschild, who spent two years
                studying why senior technology executive searches fail and what the executives who
                land well actually do differently. Starting Monday is the system that runs the search
                correctly.
              </p>
            </section>

            {/* Why your audience */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">Why your audience is the right audience</h2>
              <p>
                Every senior manager, director, and VP in your audience is at most one transition
                away from the search that Starting Monday was built for. Many of them are already
                there. They are the executives who followed the standard job search playbook at the
                VP level, discovered it does not work the same way, and are trying to figure out
                what the new rules are.
              </p>
              <p>
                The content that explains those rules is genuinely useful to your audience and
                genuinely differentiating for your show or newsletter. The senior executive search
                is not well covered. Most career content stops before the VP threshold. Your
                listeners and readers who have crossed it, or are about to, have no good resources.
              </p>
              <p>
                That gap is the content opportunity. Starting Monday is the operational answer to
                the strategic question the content raises.
              </p>
            </section>

            {/* Co-creation formats */}
            <section className="space-y-8">
              <h2 className="text-[22px] font-bold text-slate-900">How we work together</h2>
              {CO_CREATION_FORMATS.map(f => (
                <div key={f.name} className="border border-slate-200 rounded-lg p-6">
                  <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-600 mb-3">{f.name}</p>
                  <p className="text-[15px] text-slate-700 leading-relaxed mb-4">{f.description}</p>
                  {f.topics.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Example topics</p>
                      <ul className="space-y-1">
                        {f.topics.map((t, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-orange-500 font-bold shrink-0 mt-0.5 text-[12px]">+</span>
                            <span className="text-[13px] text-slate-600">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[12px] text-slate-200">
                    <span className="font-semibold text-slate-500">Audience: </span>{f.audience}
                  </p>
                </div>
              ))}
            </section>

            {/* The data asset */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">The data</h2>
              <p>
                Starting Monday continuously monitors hundreds of company career pages across
                technology-intensive sectors. The platform tracks executive departure signals,
                leadership team changes, funding events, PE ownership transitions, and career
                page posting patterns that precede formal senior technology and C-suite searches.
              </p>
              <p>
                That data is original and current. It is not recycled from LinkedIn or job boards.
                For newsletters that publish market intelligence, it is the kind of research that
                readers forward to colleagues and cite in their own work.
              </p>
              <p>
                Research partnerships are structured as co-branded quarterly reports. Starting
                Monday provides the analysis. You publish under your brand. Attribution notes
                the underlying data source.
              </p>
            </section>

            {/* What we are not */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What this is not</h2>
              <p>
                We are not looking for a sponsor read. We are not interested in a 30-second
                pre-roll. We are looking for hosts and writers who believe the content is
                genuinely valuable to their audience and want to co-create something that is
                worth producing.
              </p>
              <p>
                If the fit is right, the financial arrangement follows naturally. If the content
                is not worth making, the sponsorship does not fix it.
              </p>
            </section>

            {/* Apply CTA */}
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-7">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
                Let&apos;s talk
              </p>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3 leading-snug">
                Apply to the partner program
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                Fill out the application and select &ldquo;Media / podcast / newsletter&rdquo; as the partnership type.
                We will follow up within 2 business days to discuss the content opportunity and what a partnership looks like.
              </p>
              <Link
                href="/partners#apply"
                className="inline-block bg-orange-500 text-slate-900 text-[14px] font-bold px-7 py-3 rounded hover:bg-orange-600 transition-colors"
              >
                Apply now &rarr;
              </Link>
              <p className="text-[13px] text-slate-200 mt-4">
                Want to see the platform first?{' '}
                <Link href="/demo" className="text-slate-600 underline hover:text-slate-900 transition-colors">
                  Walk through a live demo
                </Link>
                .
              </p>
            </section>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-500">
            Questions? contact@startingmonday.app
          </p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>

    </div>
  )
}

