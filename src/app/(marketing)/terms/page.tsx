import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service - Starting Monday',
  description: 'Terms and conditions for using the Starting Monday platform.',
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-card font-sans">
      <header className="dark bg-background">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="sr-only">Starting Monday</h1>

        <div className="bg-muted border border-border rounded-lg px-8 py-7 mb-10">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-3">AI-Generated Content</p>
          <h2 className="text-[18px] font-bold text-foreground mb-3 leading-snug">How to use Starting Monday outputs</h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
            Starting Monday uses AI to generate interview prep briefs, positioning summaries, strategy analyses, outreach drafts, and signal interpretations.
            These outputs are designed to inform your thinking - they are not professional advice.
          </p>
          <ul className="flex flex-col gap-2.5 text-[13px] text-muted-foreground">
            {[
              'Verify all company facts, leadership names, and role details before any conversation.',
              'AI outputs reflect training data and may contain errors, outdated information, or gaps.',
              'Do not rely on any Starting Monday output as legal, financial, or career advice.',
              'Starting Monday is not responsible for decisions made based on AI-generated content.',
              'Signal alerts indicate patterns - they do not guarantee that a role exists or will open.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="text-muted-foreground shrink-0 mt-0.5">–</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-muted border border-border rounded-lg px-8 py-7 mb-10">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-3">Outreach and Contact Intelligence</p>
          <h2 className="text-[18px] font-bold text-foreground mb-3 leading-snug">Permitted use and premium module terms</h2>
          <ul className="flex flex-col gap-2.5 text-[13px] text-muted-foreground">
            {[
              'You may use relationship targeting and recruiter recommendations only for lawful professional outreach.',
              'You must not use Starting Monday to send spam, deceptive outreach, or unlawful bulk solicitations.',
              'Contact Intelligence suggestions are confidence-based and may be incomplete or inaccurate.',
              'Starting Monday does not guarantee deliverability, response rates, interviews, or offers.',
              'Premium Contact Intelligence credits may be subject to monthly limits and fair-use controls.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="text-muted-foreground shrink-0 mt-0.5">-</span>
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

      <footer className="border-t border-border px-6 py-6 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/" className="text-[12px] text-muted-foreground transition-colors">
            Back to home
          </Link>
        </div>
        <p className="max-w-4xl mx-auto mt-4 text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
        </p>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

