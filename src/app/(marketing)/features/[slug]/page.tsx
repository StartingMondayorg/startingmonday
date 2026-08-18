import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownArticle } from '@/components/docs/MarkdownArticle'
import { FEATURE_DOCS, loadFeatureDocBySlug } from '@/lib/feature-docs'

type FeatureDocPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return FEATURE_DOCS.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: FeatureDocPageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = await loadFeatureDocBySlug(slug)
  if (!doc) {
    return { title: 'Document not found | Starting Monday' }
  }

  return {
    title: `${doc.title} | Starting Monday`,
    description: doc.summary,
    alternates: { canonical: `https://startingmonday.app/features/${doc.slug}` },
  }
}

function personaLabel(value: string): string {
  if (value === 'executives') return 'Executives'
  if (value === 'coaches') return 'Executive Coaches'
  if (value === 'outplacement') return 'Outplacement'
  if (value === 'search-firms') return 'Search Firms'
  if (value === 'white-label') return 'White Label'
  return 'Cross-Persona'
}

function categoryLabel(value: string): string {
  if (value === 'features') return 'Feature guide'
  if (value === 'onboarding') return 'Quick start'
  return 'Analysis'
}

function formatDate(value?: string): string {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default async function FeatureDocPage({ params }: FeatureDocPageProps) {
  const { slug } = await params
  const doc = await loadFeatureDocBySlug(slug)
  if (!doc) notFound()

  const related = FEATURE_DOCS.filter((entry) => entry.slug !== doc.slug && entry.persona === doc.persona).slice(0, 4)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-slate-300">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/features" className="text-slate-300 hover:text-white">All docs</Link>
            {doc.landingHref ? <Link href={doc.landingHref} className="text-slate-300 hover:text-white">Related page</Link> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.42)] backdrop-blur-md sm:p-7">
          <div className="mb-5 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200">{categoryLabel(doc.category)}</span>
              <span className="rounded-full bg-orange-500/15 px-2 py-1 text-[11px] font-semibold text-orange-300">{personaLabel(doc.persona)}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{doc.title}</h1>
            <p className="mt-2 text-[14px] text-slate-300">{doc.summary}</p>
            <p className="mt-2 text-[12px] text-slate-400">{doc.lineCount} lines · {doc.headingCount} headings · updated {formatDate(doc.updatedAt)}</p>
          </div>

          <MarkdownArticle markdown={doc.content} />
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_12px_38px_rgba(2,6,23,0.35)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Navigate</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <Link href="/features" className="block font-semibold text-orange-300 hover:text-orange-200 hover:underline">Features hub</Link>
              <Link href="/features#chat" className="block text-slate-300 hover:text-white hover:underline">Ask docs chat</Link>
              {doc.landingHref ? <Link href={doc.landingHref} className="block text-slate-300 hover:text-white hover:underline">Related public page</Link> : null}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_12px_38px_rgba(2,6,23,0.35)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Related docs</p>
              <div className="mt-3 space-y-2">
                {related.map((entry) => (
                  <Link key={entry.slug} href={`/features/${entry.slug}`} className="block rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-[13px] text-slate-200 hover:border-white/25 hover:text-white">
                    {entry.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
