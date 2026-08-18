import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'About Richard Rothschild - Starting Monday',
  description: 'Richard Rothschild is the founder of Starting Monday. He built the platform after running his own C-suite search and finding the process broken.',
  alternates: {
    canonical: 'https://startingmonday.app/about',
  },
  openGraph: {
    title: 'About Richard Rothschild - Starting Monday',
    description: 'Founder of Starting Monday. Writing about C-suite search strategy, technology leadership, and what it actually takes to land the right role.',
    url: 'https://startingmonday.app/about',
    type: 'profile',
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Richard Rothschild',
  url: 'https://startingmonday.app/about',
  jobTitle: 'Founder',
  description: 'Founder of Starting Monday, a signal intelligence platform for C-suite executive searches.',
  sameAs: [
    'https://www.linkedin.com/in/richrothschild',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'Starting Monday',
    url: 'https://startingmonday.app',
  },
}

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.18),_transparent_36%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(10,15,28,0.98)_100%)]" />
      <JsonLd data={personJsonLd} />

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-200 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/blog" className="hidden sm:inline text-[13px] text-slate-100 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/optimize" className="hidden sm:inline text-[13px] text-slate-100 hover:text-white transition-colors">
              Free Profile Grade
            </Link>
            <Link href="/login" className="text-[13px] text-slate-100 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-slate-950 bg-slate-100 px-4 py-1.5 rounded hover:bg-slate-200 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-5 mb-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-2 ring-slate-700 bg-slate-900 text-[22px] font-bold text-white">
              RR
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-100 mb-1">
                About
              </p>
              <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight">
                Richard Rothschild
              </h1>
            </div>
          </div>
          <p className="text-[16px] text-slate-100 leading-relaxed mb-4">
            Founder of Starting Monday. Built for C-suite searches.
          </p>
          <p className="text-[15px] text-slate-200 leading-relaxed mb-4 max-w-xl">
            I build systems that turn noisy information into decisive action. Starting Monday came from running my own senior search and seeing how much of the process was still broken.
          </p>
          <a
            href="https://www.linkedin.com/in/richrothschild"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-slate-100 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            linkedin.com/in/richrothschild
          </a>
        </div>
      </header>

      {/* Bio */}
      <article className="px-4 sm:px-6 py-12 sm:py-16 bg-slate-950">
        <div className="max-w-2xl mx-auto space-y-6 text-[15px] text-slate-100 leading-relaxed">

          <section id="why-me" className="space-y-4">
            <h2 className="text-[17px] font-bold text-white">Why me</h2>
          <p>
            <span className="font-semibold text-white">Why me:</span> I have spent my career in enterprise
            technology leadership, including transformation operator roles. The pattern was always the same: the
            business needed outcomes, not activity, and leadership needed clarity, not reporting.
          </p>
          </section>

          
        <section id="why-product" className="space-y-4">
            <h2 className="text-[17px] font-bold text-white">Why this product</h2>
          <p>
            <span className="font-semibold text-white">Why this product:</span> I built Starting Monday because
            I ran my own C-suite search and found the process broken in a specific way. The job boards existed.
            The recruiters existed. What did not exist was an intelligence layer for a confidential executive
            campaign: early signals, decision-ready prep, and daily execution discipline.
          </p>

          <p>
            I spent months building a manual version of what Starting Monday does now: tracking target
            companies, logging every search-firm conversation and referral, and rebuilding prep from scratch
            before each interview. It worked, but it was too slow for how fast executive windows actually close.
          </p>

          <p>
            Starting Monday is the automated version of that workflow: early role intelligence from the
            organizational signals that precede C-suite searches, a pipeline that tracks every relationship,
            and prep briefs that assemble your win thesis, likely objections, and company-specific questions
            in sixty seconds.
          </p>
          </section>

          <section id="why-now" className="space-y-4">
            <h2 className="text-[17px] font-bold text-white">Why now</h2>
          <p>
            <span className="font-semibold text-white">Why now:</span> executive hiring moved faster and quieter.
            More searches are influenced before the role posts, and timing advantages compound quickly.
            That makes reactive, posting-first search behavior a structural disadvantage for serious candidates.
          </p>

          <p>
            Starting Monday uses Anthropic Claude to power the prep briefs, strategy documents, and briefings.
            Not because it was the obvious choice - because the model calibrates better to executive-level
            language than the alternatives, and because Anthropic&apos;s data handling policies align with the
            privacy commitments we make on the security page. Your data is not used to train AI models.
            Our API agreement with Anthropic enforces it.
          </p>

          <p>
            If you are a senior technology executive in active search or approaching one, the platform is
            built for you. If you are targeting the C-suite and want a better way to run a campaign, this is the place.
          </p>
          </section>

          <div id="start-where-you-are" className="pt-4 border-t border-white/10">
            <p className="text-[13px] font-semibold text-white mb-3">Start where you are:</p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link
                href="/demo"
                className="text-[13px] font-semibold text-slate-100 border border-white/35 hover:border-white/60 px-4 py-2 rounded transition-colors"
              >
                Run the live demo
              </Link>
              <Link
                href="/signup"
                className="text-[13px] font-semibold text-slate-950 bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
            <a
              href="https://www.linkedin.com/in/richrothschild"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-slate-100 hover:text-white transition-colors"
            >
              Connect on LinkedIn &rarr;
            </a>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-white hover:text-slate-100 transition-colors"
            >
              Start your free 30-day trial &rarr;
            </Link>
          </div>

        </div>
      </article>

      {/* Recent writing */}
      <section id="recent-writing" className="bg-slate-950 px-4 sm:px-6 py-12 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-100 mb-6">
            Recent writing
          </p>
          <div className="space-y-4">
            {[
              { href: '/blog/cio-board-presentation', label: 'How to Prepare for a Board Presentation as a New C-suite Technology Leader' },
              { href: '/blog/pe-backed-cio', label: 'What PE-Backed Companies Look for in a C-suite Technology Operator' },
              { href: '/blog/executive-resume-gaps', label: 'Executive Resume Gaps That Quietly Kill Senior Candidacies' },
              { href: '/blog/retained-search-firms', label: 'How to Work with Retained Search Firms Without Losing Leverage' },
              { href: '/blog/executive-search-firms-cio', label: 'What Executive Search Firms Actually Want from Senior Technology Candidates' },
              { href: '/blog/cio-job-search-timeline', label: 'How Long Does a Senior Executive Technology Search Really Take?' },
              { href: '/blog/vp-to-cio-transition', label: 'How VPs of Technology Make the Move to the C-suite' },
              { href: '/blog/ciso-interview-preparation', label: 'How to Prepare for a Security Leadership Interview' },
              { href: '/blog/what-companies-want-chief-data-officer', label: 'What Companies Actually Want in a Chief Data Officer' },
              { href: '/blog/cio-compensation-negotiation', label: 'How to Negotiate C-suite Technology Compensation' },
            ].map(post => (
              <Link
                key={post.href}
                href={post.href}
                className="block text-[14px] text-slate-100 hover:text-white transition-colors"
              >
                {post.label} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-5 pb-5 border-b border-white/10">
            <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-100 hover:text-white transition-colors">
              <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
            </Link>
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
              <Link href="/blog" className="text-[12px] text-slate-100 hover:text-white transition-colors">Blog</Link>
              <Link href="/about" className="text-[12px] text-slate-100 hover:text-white transition-colors">About</Link>
              <a href="https://www.linkedin.com/company/starting-monday" target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-100 hover:text-white transition-colors">LinkedIn</a>
              <Link href="/privacy" className="text-[12px] text-slate-100 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[12px] text-slate-100 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-[11px] text-slate-100">
            &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-200 mt-2">Privacy-first by design.</p>
        </div>
      </footer>

    </div>
  )
}
