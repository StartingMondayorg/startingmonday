import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday for PE and Transformation Teams',
  description: 'Equip your executive network with early intelligence on portfolio company signals. Compress the mandate timeline. Give your candidates the preparation depth that closes faster.',
  alternates: { canonical: 'https://startingmonday.app/for-pe-teams' },
  openGraph: {
    title: 'Starting Monday for PE and Transformation Teams',
    description: 'The search timeline is a risk to the value creation plan. Starting Monday compresses it.',
    url: 'https://startingmonday.app/for-pe-teams',
  },
}

const VALUE_PROPS = [
  {
    heading: 'Before the mandate is formalized',
    body: 'Executives who monitor your portfolio companies are already positioned when a leadership gap opens. They reach out before the search goes to a retained firm. That is a shorter timeline, a warmer candidate, and a relationship that started before the formal process. That matters to a value creation schedule.',
  },
  {
    heading: 'Prepared candidates close faster',
    body: 'A candidate who walks into the first conversation with a clear analysis of the company situation, a specific thesis for the technology function, and informed questions about the operating environment is a different category of candidate. The first conversation moves faster. Less time explaining the company, more time evaluating fit.',
  },
  {
    heading: 'Pipeline visibility without status calls',
    body: 'View access to a candidate\'s pipeline gives you a current picture of where their attention is, which conversations are active, and where timing may create conflicts. You stay current without requiring a call.',
  },
  {
    heading: 'Pre-search intelligence on your portfolio',
    body: 'Executives in your network can monitor your portfolio companies directly. When signals cluster into a pre-search pattern, the platform surfaces it. The right executive is already watching when you need to move.',
  },
]

export default function ForPeTeamsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/partners" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Become a partner
          </Link>
        </div>
      </nav>

      <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
            For PE and Transformation Teams
          </p>
          <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-5">
            The search timeline<br />is a risk to the<br />value creation plan.
          </h1>
          <p className="text-[15px] text-slate-200 leading-relaxed max-w-lg">
            Starting Monday equips your executive network with early intelligence on portfolio company signals and preparation that compresses the time from first conversation to close.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto space-y-16">

          <section id="value-props">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-6">
              Where it matters
            </p>
            <div className="space-y-6">
              {VALUE_PROPS.map((item, i) => (
                <div key={i} className="border-t border-slate-100 pt-5">
                  <p className="text-[15px] font-semibold text-slate-900 mb-2">{item.heading}</p>
                  <p className="text-[14px] text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="partner-model">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">
              How it works with your firm
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
              Operating partners and value creation leads who enroll executives through a shared referral link earn 20% commission on active subscriptions. Preferred partners get consolidated billing, an activation dashboard, and volume pricing starting at 5 seats.
            </p>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              Proof point: prepared executive candidates reduce first-round resets, which is one of the largest hidden drivers of mandate cycle delay.
            </p>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-6">
              You can also work with specific portfolio company candidates directly: share a referral link that pre-attributes them to your firm and gives them a dedicated onboarding path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/partners#apply"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-slate-900 text-[14px] font-semibold px-6 py-3 rounded transition-colors text-center"
              >
                Get started as a partner &rarr;
              </Link>
              <Link
                href="/for-pe-partners"
                className="inline-block border border-slate-200 hover:border-slate-400 text-slate-700 text-[14px] px-6 py-3 rounded transition-colors text-center"
              >
                Read the full PE partner guide &rarr;
              </Link>
            </div>
          </section>

          <section id="exec-benefit" className="bg-slate-950 rounded-lg p-8">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">
              What your executives get
            </p>
            <p className="text-[14px] text-slate-200 leading-relaxed mb-5">
              Every executive you enroll gets full platform access: early company signals, daily morning briefings, AI prep briefs before conversations, and a pipeline they can run like a campaign rather than a hope.
            </p>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-5">
              Confidentiality standard: executive activity is private by default and never exposed to employers or search firms.
            </p>
            <Link
              href="/demo"
              className="inline-block text-[13px] text-slate-200 border border-slate-600 px-5 py-2.5 rounded hover:border-slate-400 hover:text-white transition-colors"
            >
              See a live demo &rarr;
            </Link>
          </section>

        </div>
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-500">
            Questions?{' '}
            <a href="mailto:contact@startingmonday.app" className="hover:text-slate-200 transition-colors">
              contact@startingmonday.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

