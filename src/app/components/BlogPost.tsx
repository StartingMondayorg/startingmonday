import Link from 'next/link'
import { JsonLd } from '@/app/components/JsonLd'
import { getRelated } from '@/lib/blog-posts'
import type { BlogPostMeta } from '@/lib/blog-posts'

interface BlogCta {
  headline: string
  body: string
  label: string
  href: string
  note?: string
}

interface BlogPostProps {
  title: string
  description: string
  date: string
  readTime: string
  url: string
  slug?: string
  cta?: BlogCta
  children: React.ReactNode
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const DEFAULT_CTA: BlogCta = {
  headline: 'The infrastructure for a more deliberate C-suite search.',
  body: 'Pipeline tracking, early role intelligence, interview prep briefs, and a daily briefing assembled from your actual targets. Free 30-day trial.',
  label: 'Start your campaign →',
  href: '/signup',
  note: 'No credit card. Cancel any time.',
}

export function BlogPost({ title, description, date, readTime, url, slug, cta, children }: BlogPostProps) {
  const activeCta = cta ?? DEFAULT_CTA
  const derivedSlug = slug ?? url.split('/').pop() ?? ''
  const relatedPosts: BlogPostMeta[] = derivedSlug ? getRelated(derivedSlug) : []

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    url,
    author: {
      '@type': 'Person',
      name: 'Richard Rothschild',
      url: 'https://startingmonday.app/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Starting Monday',
      url: 'https://startingmonday.app',
    },
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <JsonLd data={articleJsonLd} />

      {/* Nav */}
      <nav className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-300 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/blog" className="hidden sm:inline text-[13px] text-slate-400 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/optimize" className="hidden sm:inline text-[13px] text-slate-400 hover:text-white transition-colors">
              Free Profile Grade
            </Link>
            <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-slate-900 bg-white px-4 py-1.5 rounded hover:bg-slate-100 transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      <main>

      {/* Article header */}
      <header className="bg-slate-900 px-4 sm:px-6 pt-14 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/blog" className="text-[12px] text-slate-300 hover:text-white transition-colors">
              &larr; All posts
            </Link>
            <span className="text-slate-700 text-[12px]">/</span>
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500">
              Executive Search
            </span>
          </div>
          <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
            {title}
          </h1>
          <p className="text-[16px] text-slate-400 leading-relaxed mb-6">
            {description}
          </p>
          <div className="flex items-center gap-4 text-[13px] text-slate-600">
            <Link href="/about" className="hover:text-slate-400 transition-colors">Richard Rothschild</Link>
            <span>&middot;</span>
            <time dateTime={date}>{formatDate(date)}</time>
            <span>&middot;</span>
            <span>{readTime}</span>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto prose-content">
          {children}
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="px-4 sm:px-6 py-12 border-t border-slate-100">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-6">Continue reading</p>
            <div className="space-y-6">
              {relatedPosts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
                  <p className="text-[15px] font-semibold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug mb-1">{p.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{p.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-slate-900 px-4 sm:px-6 py-14 sm:py-16 border-t border-slate-800">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">
            Starting Monday
          </p>
          <h2 className="text-[24px] sm:text-[28px] font-bold text-white mb-3 leading-snug">
            {activeCta.headline}
          </h2>
          <p className="text-[14px] text-slate-400 mb-7 leading-relaxed max-w-lg">
            {activeCta.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={activeCta.href}
              className="inline-block bg-orange-500 text-slate-900 text-[14px] font-bold px-7 py-3.5 rounded hover:bg-orange-600 transition-colors text-center"
            >
              {activeCta.label}
            </Link>
            <Link
              href="/demo"
              className="inline-block border border-slate-600 text-slate-200 text-[14px] font-semibold px-7 py-3.5 rounded hover:border-slate-400 transition-colors text-center"
            >
              Run the live demo
            </Link>

          </div>
          <p className="text-[12px] text-slate-400 mt-3">
            Start with demo if you want proof, pricing if you want to choose a tier, or trial if you are ready to move.
          </p>
          {activeCta.note && <p className="text-[12px] text-slate-400 mt-3">{activeCta.note}</p>}
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-5 pb-5 border-b border-slate-800">
            <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400 hover:text-slate-300 transition-colors">
              <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
            </Link>
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
              <Link href="/blog" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">Blog</Link>
              <Link href="/about" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">About</Link>
              <Link href="/optimize" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">Free Profile Grade</Link>
              <a href="https://www.linkedin.com/company/starting-monday" target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">LinkedIn</a>
              <Link href="/privacy" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">Privacy Policy</Link>
              <Link href="/terms" className="text-[12px] text-slate-400 hover:text-slate-300 transition-colors py-2">Terms</Link>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
        </div>
      </footer>

    </div>
  )
}
