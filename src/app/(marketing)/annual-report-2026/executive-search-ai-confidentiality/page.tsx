import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogPost } from '@/components/BlogPost'
import { JsonLd } from '@/components/JsonLd'

const REPORT_URL = 'https://startingmonday.app/annual-report-2026/executive-search-ai-confidentiality'

export const metadata: Metadata = {
  title: 'Executive Search, AI, and Confidentiality: 2026 Public Edition - Starting Monday',
  description:
    'Starting Monday public edition report on executive search, AI operating discipline, and confidentiality controls for executive coaches and search advisors.',
  keywords: [
    'executive search report 2026',
    'executive coaching ai',
    'confidentiality in executive search',
    'ai governance executive search',
    'starting monday annual report',
  ],
  alternates: {
    canonical: REPORT_URL,
  },
  openGraph: {
    title: 'Executive Search, AI, and Confidentiality: 2026 Public Edition',
    description:
      'A practical operating report on AI decision quality, confidentiality controls, and coaching workflow discipline.',
    url: REPORT_URL,
    type: 'article',
    publishedTime: '2026-05-27',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Search, AI, and Confidentiality: 2026 Public Edition',
    description:
      'A practical operating report on AI decision quality, confidentiality controls, and coaching workflow discipline.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How should teams use AI in executive search workflows?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use AI as decision support, not autopilot. Pair generated output with reviewer ownership, provenance checks, and structured review cadence.',
      },
    },
    {
      '@type': 'Question',
      name: 'What confidentiality controls matter most?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The highest-impact controls are role-based access boundaries, explicit handling rules for sensitive data, and weekly governance reviews on workflow exceptions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why is weekly operating cadence important?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Weekly cadence improves decision quality by reducing drift, making ownership explicit, and catching trust regressions before they scale.',
      },
    },
  ],
}

export default function ExecutiveSearchAiConfidentialityReportPage() {
  return (
    <>
        <h1 className="sr-only">Starting Monday</h1>
      <JsonLd data={faqJsonLd} />
      <BlogPost
        title="Executive Search, AI, and Confidentiality: 2026 Public Edition"
        description="A practical operating report for executive coaches and search advisors on decision quality, confidentiality, and AI workflow governance."
        date="2026-05-27"
        readTime="8 min read"
        url={REPORT_URL}
        cta={{
          headline: 'Run your search and coaching workflows with less trust risk.',
          body: 'Use structured operating controls, explicit ownership, and measurable review loops to improve decision quality while scaling AI usage.',
          label: 'Start free trial ->',
          href: '/signup',
        }}
      >
        <div className="space-y-6 text-[15px] text-slate-700 leading-relaxed">
        <section className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-2">Download</h2>
          <p className="text-[13px] mb-3">Choose the PDF format that fits your use case:</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/reports/executive-search-ai-confidentiality-annual-report-2026.pdf"
              className="inline-block bg-slate-800 text-white text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-700 transition-colors"
            >
              Download branded PDF
            </a>
            <a
              href="/reports/executive-search-ai-confidentiality-annual-report-2026-email.pdf"
              className="inline-block border border-slate-300 text-slate-800 text-[13px] font-semibold px-4 py-2 rounded hover:bg-slate-100 transition-colors"
            >
              Download email-size PDF
            </a>
          </div>
        </section>

        <p>
          This public edition distills one core operating message: teams adopting AI in executive search need stronger
          workflow discipline, not just faster output generation.
        </p>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Three decisions that matter</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Treat AI as decision support, not autopilot.</li>
          <li>Treat confidentiality as a designed operating system.</li>
          <li>Run search and coaching as a weekly operating cadence.</li>
        </ol>

        <section className="border border-slate-200 rounded-lg p-5 bg-white">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Why now</h2>
          <p>
            The market is active but selective. The competitive edge is no longer tool access alone; it is the ability to
            produce reliable decisions under confidentiality pressure.
          </p>
        </section>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Frontier lab consensus in 2026</h2>
        <p>
          Recent OpenAI, Anthropic, and Google announcements point in the same direction: AI adoption is moving toward
          managed agents, stronger provenance, and explicit governance controls.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>OpenAI: measurable production loops, provenance layers, context-aware safety.</li>
          <li>Anthropic: pilot-to-production in regulated environments and governance bottlenecks.</li>
          <li>Google: managed agent infrastructure, sandboxed execution, and verification tooling at scale.</li>
        </ul>

        <h2 className="text-[22px] font-bold text-slate-900 pt-4">Implementation shape</h2>
        <p>
          The report provides a 90-day blueprint covering controls, supervised automation, and governance loops so teams can
          improve speed without introducing trust regressions.
        </p>

        <section className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">Related pages</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            <Link href="/annual-report-2026" className="underline underline-offset-2 hover:text-slate-900">2026 annual report overview</Link>
            <Link href="/evidence-hub" className="underline underline-offset-2 hover:text-slate-900">Evidence Hub</Link>
          </div>
        </section>
        </div>
      </BlogPost>
    </>
  )
}

