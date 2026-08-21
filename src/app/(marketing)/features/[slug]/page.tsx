import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarkdownArticle } from '@/app/(marketing)/features/_components/MarkdownArticle'
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/features" className="text-muted-foreground hover:text-foreground">All docs</Link>
            {doc.landingHref ? <Link href={doc.landingHref} className="text-muted-foreground hover:text-foreground">Related page</Link> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-border bg-background/45 p-5 shadow-xl backdrop-blur-md sm:p-7">
          <div className="mb-5 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-foreground">{categoryLabel(doc.category)}</span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{personaLabel(doc.persona)}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{doc.title}</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">{doc.summary}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">{doc.lineCount} lines · {doc.headingCount} headings · updated {formatDate(doc.updatedAt)}</p>
          </div>

          <MarkdownArticle markdown={doc.content} />
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-background/45 p-4 shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Navigate</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <Link href="/features" className="block font-semibold text-primary hover:underline">Features hub</Link>
              <Link href="/features#chat" className="block text-muted-foreground hover:text-foreground hover:underline">Ask docs chat</Link>
              {doc.landingHref ? <Link href={doc.landingHref} className="block text-muted-foreground hover:text-foreground hover:underline">Related public page</Link> : null}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="rounded-2xl border border-border bg-background/45 p-4 shadow-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Related docs</p>
              <div className="mt-3 space-y-2">
                {related.map((entry) => (
                  <Link key={entry.slug} href={`/features/${entry.slug}`} className="block rounded-lg border border-border bg-card/60 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground">
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
