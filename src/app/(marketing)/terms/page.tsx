import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Starting Monday',
  description: 'Terms and conditions for using the Starting Monday platform.',
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="sr-only">Starting Monday</h1>

        <div className="bg-slate-50 border border-slate-200 rounded-lg px-8 py-7 mb-10">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">AI-Generated Content</p>
          <h2 className="text-[18px] font-bold text-slate-900 mb-3 leading-snug">How to use Starting Monday outputs</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">
            Starting Monday uses AI to generate interview prep briefs, positioning summaries, strategy analyses, outreach drafts, and signal interpretations.
            These outputs are designed to inform your thinking - they are not professional advice.
          </p>
          <ul className="flex flex-col gap-2.5 text-[13px] text-slate-600">
            {[
              'Verify all company facts, leadership names, and role details before any conversation.',
              'AI outputs reflect training data and may contain errors, outdated information, or gaps.',
              'Do not rely on any Starting Monday output as legal, financial, or career advice.',
              'Starting Monday is not responsible for decisions made based on AI-generated content.',
              'Signal alerts indicate patterns - they do not guarantee that a role exists or will open.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="text-slate-200 shrink-0 mt-0.5">–</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg px-8 py-7 mb-10">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">Outreach and Contact Intelligence</p>
          <h2 className="text-[18px] font-bold text-slate-900 mb-3 leading-snug">Permitted use and premium module terms</h2>
          <ul className="flex flex-col gap-2.5 text-[13px] text-slate-600">
            {[
              'You may use relationship targeting and recruiter recommendations only for lawful professional outreach.',
              'You must not use Starting Monday to send spam, deceptive outreach, or unlawful bulk solicitations.',
              'Contact Intelligence suggestions are confidence-based and may be incomplete or inaccurate.',
              'Starting Monday does not guarantee deliverability, response rates, interviews, or offers.',
              'Premium Contact Intelligence credits may be subject to monthly limits and fair-use controls.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="text-slate-200 shrink-0 mt-0.5">-</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <script
          src="https://app.termly.io/embed-policy.min.js"
          data-auto-block="on"
          async
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <div {...({ name: 'termly-embed', 'data-id': '2737f35f-7008-46e2-8b4f-28c2f5478dfb' } as any)} />
      </main>

      <footer className="border-t border-slate-100 px-6 py-6 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/" className="text-[12px] text-slate-200 hover:text-slate-600 transition-colors">
            Back to home
          </Link>
        </div>
        <p className="max-w-4xl mx-auto mt-4 text-[11px] text-slate-200">
          &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
        </p>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

