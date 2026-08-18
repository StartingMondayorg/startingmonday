import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday - For Career Tools Listeners',
  description: 'The search infrastructure built for C-suite job searches. If you are approaching the senior executive level - or already there - this is what the search looks like and what it takes to run it well.',
  alternates: { canonical: 'https://startingmonday.app/career-tools' },
  robots: { index: true, follow: true },
}

const WHAT_CHANGES = [
  {
    before: 'Job boards show most open roles',
    after: 'Most senior roles are never posted. They go through retained search firms or informal networks.',
  },
  {
    before: 'Apply to roles that match your background',
    after: 'You need to be in conversation before the role is formalized. That means monitoring organizational signals.',
  },
  {
    before: 'Research the company before the interview',
    after: 'You need a peer-level thesis about the company\'s technology situation before you walk in. Two hours of research minimum. Per company.',
  },
  {
    before: 'Track applications in a spreadsheet',
    after: 'You are managing 40-60 target companies at different relationship stages simultaneously. A spreadsheet does not hold that.',
  },
  {
    before: 'The search takes a few months',
    after: 'A well-run senior executive search takes 6 to 9 months. A poorly-run one takes 18.',
  },
]

export default function CareerToolsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center min-h-[48px] px-1 text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/login" className="inline-flex items-center min-h-[48px] px-2 text-[13px] text-slate-200 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center min-h-[48px] text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 rounded hover:bg-orange-600 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* Header */}
        <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              For Career Tools listeners
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              The job search changes when you reach the C-suite.
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Most of what you know about running a job search stops working at the senior executive level.
              Starting Monday is built for the search that actually exists at VP and above.
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            {/* What changes */}
            <section className="space-y-6">
              <h2 className="text-[22px] font-bold text-slate-900">What changes at the C-suite level</h2>
              <div className="space-y-3">
                {WHAT_CHANGES.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4">
                      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-slate-200 mb-1">What you were taught</p>
                      <p className="text-[14px] text-slate-500 leading-relaxed">{item.before}</p>
                    </div>
                    <div className="bg-white px-5 py-4 border-t sm:border-t-0 sm:border-l border-slate-200">
                      <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-orange-500 mb-1">What is actually true</p>
                      <p className="text-[14px] text-slate-700 leading-relaxed">{item.after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* What Starting Monday does */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">What Starting Monday does</h2>
              <p>
                Starting Monday is the infrastructure layer for a senior executive search. It does
                four things that are difficult to do manually at the scale a VP or C-suite search
                requires:
              </p>
              <ul className="space-y-3 pl-4">
                {[
                  {
                    label: 'Company intelligence monitoring',
                    body: 'Watch 40-60 target companies for the signals that precede a search: executive departures, board changes, PE acquisitions, funding events, career page postings. Reach out before the role is formalized.',
                  },
                  {
                    label: 'AI interview prep briefs',
                    body: 'Before every interview, generate a full brief on the company, usually in about a minute: situation, technology posture, your win thesis, the objections you will face, and the questions only a peer would ask. Arrive prepared at depth.',
                  },
                  {
                    label: 'Structured pipeline',
                    body: 'Track every company you are pursuing - stage, conversations, follow-ups, notes. Know exactly where the search stands at any moment. Stop managing it from memory.',
                  },
                  {
                    label: 'Daily discipline',
                    body: 'A morning briefing every day: new signals, pending follow-ups, pipeline actions. The search stays moving on the days when your motivation does not.',
                  },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-orange-500 font-bold shrink-0 mt-0.5">+</span>
                    <span className="text-slate-700">
                      <span className="font-semibold">{item.label}: </span>{item.body}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Who it is for */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">Who it is for</h2>
              <p>
                Starting Monday was built for C-suite and near-C-suite technology executives: CIOs, CTOs,
                VPs of Technology, CISOs, CDOs, and VP of Engineering. If you are at that level
                now and in active search, this is the platform.
              </p>
              <p>
                If you are approaching that level and want to understand what the search looks
                like before you are in it, the blog is a good starting point. The posts are
                written specifically about how the senior executive search works, not how job
                searches work in general.
              </p>
            </section>

            {/* Blog links */}
            <section className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
              <h2 className="text-[22px] font-bold text-slate-900">Start with these</h2>
              <p className="text-[14px] text-slate-500">
                The blog covers how the senior executive search actually works. No resume tips.
                No generic interview advice.
              </p>
              <ul className="space-y-3">
                {[
                  { href: '/blog/how-cios-find-jobs', label: 'How Do CIOs Actually Find New Jobs?' },
                  { href: '/blog/executive-search-firms-cio', label: 'What Executive Search Firms Actually Want from CIO Candidates' },
                  { href: '/blog/cio-job-search-timeline', label: 'How Long Does a CIO Job Search Really Take?' },
                  { href: '/blog/target-company-list', label: 'How to Build Your Target Company List for an Executive Search' },
                  { href: '/blog/retained-search-firms', label: 'How to Work with Retained Search Firms Without Losing Leverage' },
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex items-center py-2.5 text-[15px] font-semibold text-slate-900 hover:text-slate-600 transition-colors">
                      {link.label} &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Promo */}
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-7">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
                For Career Tools listeners
              </p>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3 leading-snug">
                Start with a free 30-day trial
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                No credit card required. Sign up, build your target company list, and see what
                the search looks like when it runs on infrastructure instead of memory.
                Use code <span className="font-bold text-slate-700">CAREERTOOLS</span> for an
                extended trial.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center min-h-[48px] bg-orange-500 text-slate-900 text-[14px] font-bold px-7 rounded hover:bg-orange-600 transition-colors"
              >
                Start free trial &rarr;
              </Link>
              <p className="text-[13px] text-slate-200 mt-4">
                Want to see it first?{' '}
                <Link href="/demo?full=1" className="inline-flex items-center py-2 text-slate-600 underline hover:text-slate-900 transition-colors">
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
          <Link href="/" className="inline-flex items-center min-h-[48px] px-1 text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
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

