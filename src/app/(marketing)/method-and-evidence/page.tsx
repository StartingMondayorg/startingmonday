import type { Metadata } from 'next'
import Link from 'next/link'
import { isEnabledFlag } from '@/lib/feature-flags'
import { JsonLd } from '@/app/components/JsonLd'

export const metadata: Metadata = {
  title: 'Method and Evidence - Starting Monday',
  description: 'How Starting Monday estimates timing, evaluates evidence, and turns research into product decisions.',
  alternates: {
    canonical: 'https://startingmonday.app/method-and-evidence',
  },
  openGraph: {
    title: 'Method and Evidence - Starting Monday',
    description: 'How Starting Monday estimates timing, evaluates evidence, and turns research into product decisions.',
    url: 'https://startingmonday.app/method-and-evidence',
    type: 'website',
  },
}

const EVIDENCE_STACK = [
  { label: 'Peer-reviewed coaching research', value: 100, widthClass: 'w-full', note: 'Executive coaching effectiveness, mechanisms, and outcomes' },
  { label: 'Transition and onboarding research', value: 86, widthClass: 'w-[86%]', note: 'Adjustment, identity, and role entry' },
  { label: 'Behavior change research', value: 92, widthClass: 'w-[92%]', note: 'Goal-setting and implementation intentions' },
  { label: 'Weak-signal and decision research', value: 78, widthClass: 'w-[78%]', note: 'Timing, uncertainty, and judgment' },
]

const TIMING_MODEL = [
  { stage: 'Event to signal', value: 72, widthClass: 'w-[72%]', note: 'A public or observable change begins to surface' },
  { stage: 'Signal to company posting', value: 58, widthClass: 'w-[58%]', note: 'Company-level evidence appears before broad distribution' },
  { stage: 'Posting to broad market', value: 84, widthClass: 'w-[84%]', note: 'Recruiting channels and job boards catch up later' },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Starting Monday turn research into product decisions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The platform maps evidence categories to explicit product choices, then tracks whether those choices improve timing, preparation quality, and execution consistency.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does the timing model matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The timing model shows where meaningful transition signals appear before broad-market posting, which helps candidates act earlier with better context.',
      },
    },
    {
      '@type': 'Question',
      name: 'What do the percentage bars represent?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'These percentages represent weighted confidence by evidence category, not absolute efficacy or guaranteed outcomes.',
      },
    },
  ],
}

function BarChart({ items, labelKey, valueKey, noteKey, widthKey, premium = false }: { items: Array<Record<string, string | number>>, labelKey: string, valueKey: string, noteKey: string, widthKey: string, premium?: boolean }) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const label = String(item[labelKey])
        const value = Number(item[valueKey])
        const note = String(item[noteKey])
        const widthClass = String(item[widthKey])
        return (
          <div key={label}>
            <div className="flex items-end justify-between gap-4 mb-2">
              <div>
                <p className={`text-[13px] font-semibold ${'text-foreground'}`}>{label}</p>
                <p className={`text-[12px] leading-relaxed ${premium ? 'text-foreground' : 'text-muted-foreground'}`}>{note}</p>
              </div>
              <p className={`text-[12px] font-semibold ${premium ? 'text-foreground' : 'text-muted-foreground'}`}>{value}%</p>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${premium ? 'bg-muted/80' : 'bg-muted'}`}>
              <div className={`h-full rounded-full bg-primary ${widthClass}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MethodAndEvidencePage() {
  const premiumEnabled = isEnabledFlag(process.env.NEXT_PUBLIC_LUXURY_PHASE3_ENABLED)

  return (
    <div className={`relative min-h-screen font-sans ${premiumEnabled ? 'overflow-hidden bg-background' : 'bg-primary'}`}>
      <JsonLd data={faqJsonLd} />
      <nav className={premiumEnabled ? 'sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl' : 'bg-background sticky top-0 z-10'}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/references" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">References</Link>
            <Link href="/evidence-hub" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Evidence Hub</Link>
            <Link href="/signup" className="text-[13px] font-semibold text-primary-foreground bg-primary px-4 py-1.5 rounded hover:bg-muted transition-colors">Try free</Link>
          </div>
        </div>
      </nav>

      <main className={`max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 ${premiumEnabled ? 'text-foreground' : ''}`}>
    <header className="mb-14 max-w-3xl">
          <p className={`text-[11px] font-bold tracking-[0.16em] uppercase mb-3 ${'text-primary'}`}>Method and evidence</p>
          <h1 className={`text-[34px] sm:text-[44px] font-bold leading-[1.05] mb-4 ${'text-foreground'}`}>How Starting Monday turns research into product decisions.</h1>
          <p className={`text-[15px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            We use peer-reviewed coaching, transition, behavior-change, and weak-signal research to decide what to build, what to claim, and what to measure.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className={`rounded-2xl p-5 ${premiumEnabled ? 'border border-border bg-background/64 shadow-xl backdrop-blur-md' : 'border border-border'}`}>
            <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-3 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>Evidence stack</p>
            <BarChart items={EVIDENCE_STACK} labelKey="label" valueKey="value" noteKey="note" widthKey="widthClass" premium={premiumEnabled} />
          </div>
          <div className={`rounded-2xl p-5 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
            <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-3 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>Timing model</p>
            <BarChart items={TIMING_MODEL} labelKey="stage" valueKey="value" noteKey="note" widthKey="widthClass" premium={premiumEnabled} />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className={'border-t-2 border-primary/30 pt-4'}>
            <h2 className={`text-[16px] font-bold mb-2 ${'text-foreground'}`}>Coaching becomes infrastructure</h2>
            <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>The research says outcomes depend on what happens between sessions, so the product should support that layer directly.</p>
          </div>
          <div className={'border-t-2 border-border pt-4'}>
            <h2 className={`text-[16px] font-bold mb-2 ${'text-foreground'}`}>Plans beat intention</h2>
            <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>If-then planning and clear goals are the design basis for prep briefs, prompts, and accountability loops.</p>
          </div>
          <div className={'border-t-2 border-border pt-4'}>
            <h2 className={`text-[16px] font-bold mb-2 ${'text-foreground'}`}>Signals beat waiting</h2>
            <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>Weak signals and transition cues matter before formal postings, so the platform should make early movement visible.</p>
          </div>
        </section>

        <section className={`mb-12 rounded-lg p-5 sm:p-6 ${premiumEnabled ? 'border border-border bg-background/64 shadow-xl backdrop-blur-md text-foreground' : 'border border-border bg-background text-foreground'}`}>
          <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-3 ${'text-primary'}`}>Dig deeper</p>
          <p className={`text-[14px] leading-relaxed mb-5 ${'text-foreground'}`}>
            Explore the citations, pilot data, and timing-model methodology behind every product decision.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/references" className={`inline-block text-[13px] font-semibold px-4 py-2 rounded transition-colors ${'bg-primary text-primary-foreground hover:bg-muted'}`}>References {"->"}</Link>
            <Link href="/evidence-hub" className={`inline-block border text-[13px] font-semibold px-4 py-2 rounded transition-colors ${premiumEnabled ? 'border-border text-foreground hover:border-primary/60' : 'border-border text-foreground hover:border-border'}`}>Evidence Hub {"->"}</Link>
            <Link href="/blog/how-we-estimate-early-role-signals" className={`inline-block border text-[13px] font-semibold px-4 py-2 rounded transition-colors ${premiumEnabled ? 'border-border text-foreground hover:border-primary/60' : 'border-border text-foreground hover:border-border'}`}>Timing model {"->"}</Link>
          </div>
        </section>

        <section className={`rounded-2xl p-5 sm:p-6 ${premiumEnabled ? 'border border-border bg-muted/[0.07] shadow-lg' : 'border border-border bg-muted'}`}>
          <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ${premiumEnabled ? 'text-primary' : 'text-muted-foreground'}`}>Source note</p>
          <p className={`text-[13px] leading-relaxed ${premiumEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
            All percentage bars represent weighted confidence applied to each evidence category, not absolute efficacy. Source citations and denominator notes are maintained in the references and evidence-room assets.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}


