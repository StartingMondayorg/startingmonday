import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday | Evaluator Overview',
  description:
    'Public evaluation page with core positioning, audience, and method for reviewers and AI fetchers.',
  alternates: {
    canonical: 'https://startingmonday.app/evaluate',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Starting Monday | Evaluator Overview',
    description:
      'A public, read-only overview of who Starting Monday is for and how it works.',
    url: 'https://startingmonday.app/evaluate',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Starting Monday | Evaluator Overview',
    description:
      'A public, read-only overview of who Starting Monday is for and how it works.',
  },
}

const sections = [
  {
    title: 'Who It Is For',
    body: 'Starting Monday is built for transition-ready senior technology leaders: VP, SVP, and first-time C-suite candidates running a focused executive search campaign.',
  },
  {
    title: 'What It Does',
    body: 'The product combines company signal monitoring, campaign workflow, relationship tracking, and preparation briefs so users can move from reactive searching to disciplined execution.',
  },
  {
    title: 'How The Method Works',
    body: 'Users track a target company set, review daily signal changes, execute outreach with clear next actions, and prepare for each conversation with role-specific context and objections.',
  },
  {
    title: 'Trust And Privacy',
    body: 'This page is intentionally read-only and contains no personal data. Customer accounts and private workflow data remain authenticated and protected in product routes.',
  },
]

export default function EvaluatePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
          Public Evaluator Page
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          The operating system for your next executive move.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
          This page exists so evaluators, reviewers, and AI tools can reliably read core positioning
          without touching sensitive application routes.
        </p>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          Outcome metric: this read-only page reduces evaluator friction and keeps private user routes out of review workflows.
        </p>
      </header>

      <section id="evaluator-core" className="mt-10 grid gap-6">
        {sections.map((section) => (
          <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-slate-700">{section.body}</p>
          </article>
        ))}
      </section>

      <section id="evaluator-reading" className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Further Reading</h2>
        <p className="mt-2 text-slate-700">
          For product details, use the public pages below.
        </p>
        <p className="mt-2 text-slate-700">CTA: get started now from any public page when you are ready to test the live workflow.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
            Homepage
          </Link>

          <Link href="/demo" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
            Demo
          </Link>
        </div>
      </section>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
