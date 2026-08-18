import Link from 'next/link'

export const metadata = {
  title: 'Companies Research - Starting Monday',
  description: 'Research target companies and identify signals that matter for your search.',
}

export default function DemoCompaniesPrepPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      {/* Task navigation */}
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Link
              href="/demo/prep-interview"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              Interview
            </Link>
            <Link
              href="/demo/prep-companies"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-orange-400 text-orange-300 transition-colors whitespace-nowrap"
            >
              Companies
            </Link>
            <Link
              href="/demo/prep-meetings"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              Meetings
            </Link>
            <Link
              href="/demo/prep-communications"
              className="flex-shrink-0 px-4 py-3 text-[13px] font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              Communications
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-[32px] font-bold tracking-tight text-white sm:text-[40px]">
              Target Companies
            </h1>
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.1em]">
              20-30 minutes
            </p>
          </div>
          <p className="text-[16px] leading-relaxed text-slate-300 max-w-2xl">
            Research the markets, players, and signals that shape your search strategy.
          </p>
        </div>

        {/* Research insight card */}
        <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
          <p className="text-[15px] leading-relaxed text-slate-100 mb-4">
            "The leaders who closed offers fastest spent the first 4-5 weeks researching: 40-60 target companies, signals, and what success looks like. They didn't randomly apply. They hunted strategically."
          </p>
          <div className="pt-4 border-t border-orange-400/20">
            <p className="text-[13px] font-semibold text-orange-300 mb-2">How this helps:</p>
            <p className="text-[13px] text-orange-300/80">A curated list of 40-60 targets focuses your effort and increases response rates. It signals expertise to recruiters and gives you leverage in conversations - you're selective, not desperate.</p>
          </div>
        </div>

        {/* Form sections */}
        <form className="space-y-8">
          {/* Market research */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[11px] font-semibold text-orange-300/70 uppercase tracking-[0.1em]">Section 1 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
              Market Research
            </legend>

            <div>
              <label htmlFor="market-focus" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Markets or verticals you're targeting
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                E.g., "Fintech for SMB", "Enterprise AI infrastructure", "Healthcare SaaS"
              </p>
              <textarea
                id="market-focus"
                placeholder="Your market focus or verticals..."
                defaultValue="Design tools for enterprises. Figma, Miro, Mural, Adobe XD, Lucidchart. Enterprise collaboration software."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>

            <div>
              <label htmlFor="market-dynamics" className="block text-[13px] font-semibold text-slate-200 mb-2">
                What's happening in these markets right now?
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                Consolidation, new entrants, talent wars, funding shifts?
              </p>
              <textarea
                id="market-dynamics"
                placeholder="Market trends, consolidation, funding activity, talent dynamics..."
                defaultValue="Major consolidation: Adobe acquiring Figma deal fell through but they're acquiring other tools. Figma $20B valuation, securing enterprise market share. Design tools market is competitive but has clear leaders. Miro raising for IPO. Mural acquired by MURAL but stays independent. Talent: everyone fighting for backend and infrastructure specialists to scale."
                rows={4}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Target companies */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[11px] font-semibold text-orange-300/70 uppercase tracking-[0.1em]">Section 2 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
              Target Companies
            </legend>

            <div>
              <label htmlFor="company-list" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Your target list (paste or type)
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                Start with 40-60 companies. One per line or comma-separated.
              </p>
              <textarea
                id="company-list"
                placeholder="Company names, one per line"
                defaultValue="Figma
Miro
Adobe
Notion
Slack
Microsoft
Google
Atlassian
Canva
Webflow
Intercom
Linear
Pagerduty
Stripe
Shopify
Twilio
Datadog
Okta
Auth0
MongoDB
Supabase
Firebase
HashiCorp
JFrog
Docker
Kubernetes
Grafana
LaunchDarkly
PagerDuty
Snyk"
                rows={8}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 font-mono text-[12px] focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>

            <div>
              <label htmlFor="company-criteria" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Selection criteria
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                Why you picked these. Size, growth rate, geography, industry?
              </p>
              <textarea
                id="company-criteria"
                placeholder="Company size, funding stage, growth rate, industry factors..."
                defaultValue="$1B+ valuation. Series D+. Public or IPO-ready. Strong engineering culture. Expanding internationally. Hiring for infrastructure / backend at VP level. Design tools and developer platforms (my core expertise areas)."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Signals */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
            <p className="text-[11px] font-semibold text-orange-300/70 uppercase tracking-[0.1em]">Section 3 of 4</p>
          </div>
          <fieldset className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 space-y-6">
            <legend className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-300 mb-4">
              Signals You're Watching For
            </legend>

            <div>
              <label htmlFor="key-signals" className="block text-[13px] font-semibold text-slate-200 mb-2">
                What precedes a search in your market?
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                Executive departures, board changes, funding announcements, product launches?
              </p>
              <textarea
                id="key-signals"
                placeholder="E.g., executive departures, funding rounds, board changes, product announcements, acquisition activity..."
                defaultValue="CTO/VP Engineering departures (announced or rumored). Series D/E closings. Board changes (especially new investors). Product announcements (new features, market expansion). Hiring spree (always precedes major initiative). Acquisition news. IPO filing announcements. Earnings calls mentioning infrastructure investments."
                rows={4}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>

            <div>
              <label htmlFor="signal-sources" className="block text-[13px] font-semibold text-slate-200 mb-2">
                Where you'll find these signals
              </label>
              <p className="text-[12px] text-slate-400 mb-3">
                News feeds, LinkedIn, company career pages, press releases, your network?
              </p>
              <textarea
                id="signal-sources"
                placeholder="News sources, LinkedIn updates, press releases, career pages, your network..."
                defaultValue="LinkedIn: news feed, company pages, career pages, people search. News: TechCrunch, Forbes, VentureBeat. Crunchbase. Company blogs and press. Starting Monday (proprietary signal detection). Peer network (engineering leaders at target companies)."
                rows={3}
                className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:border-orange-400/50 focus:outline-none focus:ring-1 focus:ring-orange-400/30"
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
            <button
              type="button"
              className="px-6 py-3 text-[13px] font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              Save as draft
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-[13px] font-semibold bg-orange-500 text-slate-900 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Save companies research
            </button>
          </div>
        </form>

        {/* Next steps */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-8">
          <p className="text-[13px] font-semibold text-slate-300 mb-3">Next: Meetings prep</p>
          <p className="text-[14px] leading-relaxed text-slate-100 mb-4">
            With your target list and signals mapped, you're ready to plan your conversation flow. How will you move from introduction to first meeting?
          </p>
          <Link
            href="/demo/prep-meetings"
            className="inline-flex px-4 py-2 text-[13px] font-semibold text-orange-300 hover:text-orange-200 transition-colors"
          >
            Move to meetings prep →
          </Link>
        </div>
      </div>
    </div>
  )
}
