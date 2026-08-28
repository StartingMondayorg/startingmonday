import type { Metadata } from 'next'
import Link from 'next/link'
import { PartnersForm } from './partners-form'

export const metadata: Metadata = {
  title: 'Partner Program | Starting Monday',
  description: 'Private partner evaluations for coaches, search firms, and other transition partners. Start with a bounded pilot, verify outcome quality, then expand.',
  alternates: { canonical: 'https://startingmonday.app/partners' },
  openGraph: {
    title: 'Partner Program | Starting Monday',
    description: 'Start with a private pilot, verify workflow quality, then expand with confidence.',
    url: 'https://startingmonday.app/partners',
  },
}

const COACH_PARTNER_TERMS = [
  'Free enrollment with referral tracking.',
  '20% recurring commission on active referrals.',
  'Preview-first: clients evaluate from workflow quality, not pitch.',
  'Client access remains client-controlled throughout.',
]

const SEARCH_FIRM_PARTNER_TERMS = [
  'Start with one mandate, one sponsor, and a 30-day decision window.',
  'Pilot expansion depends on shortlist quality and prep-economics evidence.',
  'Candidate visibility remains role-scoped and revocable throughout the pilot.',
  'Procurement and legal review happen before kickoff, not mid-search.',
]

type PartnersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PartnersPage({ searchParams }: PartnersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const rawChannel = resolvedSearchParams.channel
  const channel = Array.isArray(rawChannel) ? rawChannel[0] : rawChannel
  const isSearchFirms = channel === 'search-firms'
  const pageEyebrow = isSearchFirms ? 'Search-Firm Partner Program' : 'Coach Partner Program'
  const pageLines = isSearchFirms
    ? ['Run one mandate first.', 'Expand only if the pilot proves out.']
    : ['Test the workflow with live clients.', 'Refer only when the evidence is clear.']
  const pageBody = isSearchFirms
    ? 'The partner path starts with a private 30-day retained-search pilot. Use one mandate, one sponsor, and a day-30 decision memo before any broader rollout.'
    : 'The partner path starts with a private 30-day evaluation, not a pitch. Run Starting Monday with 2 to 3 clients, observe operating quality, then decide whether to refer.'
  const partnerTerms = isSearchFirms ? SEARCH_FIRM_PARTNER_TERMS : COACH_PARTNER_TERMS
  const applyHeading = isSearchFirms ? 'Apply for the 30-day search-firm pilot.' : 'Apply for the 30-day coach evaluation.'
  const applyBody = isSearchFirms
    ? 'We respond within 2 business days with pilot scope, legal and procurement next steps, and kickoff sequencing for one retained-search mandate.'
    : 'We respond within 2 business days with your referral link and partner activation. Run the evaluation and decide from observed outcomes.'
  const proofHref = isSearchFirms ? '/search-firms/sample-cfo-brief' : '/evidence-hub#coaching-transitions'

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">
      <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href={isSearchFirms ? '/search-firms' : '/for-coaches'} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              {isSearchFirms ? 'Search-firm preview' : 'Coach preview'}
            </Link>
            <Link href="/login" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Log in</Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[12px] font-bold tracking-[0.08em] text-warning">{pageEyebrow}</p>
          <h1 className="mb-5 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            {pageLines[0]}
            <br className="hidden sm:block" />
            {pageLines[1]}
          </h1>
          <h2 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-warning">Pilot framing</h2>
          <p className="mb-7 max-w-2xl text-[16px] leading-relaxed text-foreground">
            {pageBody}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://app-na2.hubspot.com/meetings/246442927"
              className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Book a meeting
            </a>
            <a
              href="#apply"
              className="inline-flex items-center justify-center rounded border border-border px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              Apply for partner access
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">

        <section className="rounded-[2rem] border border-border bg-muted/[0.03] p-6 sm:p-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-warning">Start lane</p>
          <h2 className="mb-2 font-serif text-[26px] leading-tight text-foreground sm:text-[30px]">
            {isSearchFirms ? 'Pilot-first lane for search firms. Small-fee lane for coach teams.' : 'Small-fee lane for coaches. Pilot lane for search firms.'}
          </h2>
          <p className="mb-6 max-w-3xl text-[14px] leading-relaxed text-foreground">
            Keep the first decision simple. Start with a low-friction product checkout if you are validating coach workflow fit, or start with a retained-search pilot if you are running a live mandate.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-warning/25 bg-warning/10 p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-warning">Coach lane</p>
              <h3 className="text-[18px] font-semibold text-foreground">Start with a small-fee signal product</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                Use the coach micro-product catalog when you want immediate workflow value before broader partner rollout.
              </p>
              <Link
                href="/for-coaches/micro-products"
                className="mt-4 inline-flex items-center justify-center rounded bg-warning px-4 py-2.5 text-[13px] font-semibold text-warning-foreground transition-colors hover:bg-warning/90"
              >
                Open coach small-fee products
              </Link>
            </article>

            <article className="rounded-2xl border border-border bg-background/45 p-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-warning">Search-firm lane</p>
              <h3 className="text-[18px] font-semibold text-foreground">Start the retained-search pilot</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                Run one mandate with one sponsor and evaluate shortlist-confidence outcomes at the day-30 checkpoint.
              </p>
              <Link
                href="/partners?channel=search-firms#apply"
                className="mt-4 inline-flex items-center justify-center rounded bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start search-firm pilot lane
              </Link>
            </article>
          </div>
        </section>

        <section className="rounded-[2rem] border border-warning/20 bg-card/85 p-6 sm:p-8">
          <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-warning">Partner terms</p>
          <h2 className="mb-4 font-serif text-[26px] leading-tight text-foreground sm:text-[30px]">
            {isSearchFirms ? 'One pilot. One decision window. Expand only if quality is visible.' : 'One enrollment. Ongoing commission. No minimum referral volume.'}
          </h2>
          <h3 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-warning">Operating constraints</h3>
          <ul className="space-y-2 text-[14px] leading-relaxed text-foreground">
            {partnerTerms.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section id="apply" className="scroll-mt-20 rounded-[2rem] border border-border bg-muted/[0.03] p-6 sm:p-8">
          <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-warning">Private application</p>
          <h2 className="mb-2 font-serif text-[26px] leading-tight text-foreground sm:text-[30px]">{applyHeading}</h2>
          <h3 className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-warning">Decision packet</h3>
          <p className="mb-6 text-[14px] leading-relaxed text-foreground">{applyBody}</p>
          <h3 className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-warning">Application form</h3>
          <PartnersForm
            introLabel={isSearchFirms ? 'Search-firm partner application' : 'Coach partner application'}
            introNote={isSearchFirms ? 'Short form. One mandate. Clear next step.' : 'Short form. Clear next step.'}
            defaultInterest={isSearchFirms ? 'Search firm / retained firm' : 'Executive coaching integration'}
            companyPlaceholder={isSearchFirms ? 'Acme Retained Search' : 'Acme Executive Coaching'}
            emailPlaceholder={isSearchFirms ? 'jane@acmesearch.com' : 'jane@acmecoaching.com'}
            rolePlaceholder={isSearchFirms ? 'Managing Partner, Technology Practice Lead' : 'Founder, Executive Coach'}
            notesPlaceholder={isSearchFirms ? 'Mandate lane, sponsor owner, pilot timing...' : 'Client count, practice model, timeline...'}
          />
        </section>

        {!isSearchFirms && (
          <section className="border-t border-border pt-8">
            <p className="mb-3 text-[12px] text-muted-foreground">Other partner paths</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/partners/reporting" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Partner reporting &rarr;</Link>
              <Link href="/search-firms" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Search firms &rarr;</Link>
              <Link href="/for-outplacement" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Outplacement providers &rarr;</Link>
              <Link href="/for-pe-teams" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">PE talent teams &rarr;</Link>
            </div>
          </section>
        )}

      </div>

      <footer className="border-t border-border bg-background/80 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[12px]">
            <Link href={proofHref} className="text-muted-foreground transition-colors hover:text-foreground">
              Proof
            </Link>
            <p className="text-muted-foreground">
              Questions?{' '}
              <a href="mailto:contact@startingmonday.app" className="transition-colors hover:text-foreground">
                contact@startingmonday.app
              </a>
            </p>
          </div>
        </div>
      
          <p className="text-[11px] text-muted-foreground mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}

