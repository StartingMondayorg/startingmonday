import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { BlogChat } from './blog-chat'

export const metadata: Metadata = {
  title: 'Blog - Starting Monday',
  description: 'Practical guidance for VP and C-suite technology executives in active search, and the coaches, search firms, and advisors who work with them.',
  keywords: [
    'CIO job search advice',
    'executive job search blog',
    'technology executive career',
    'CIO career strategy',
    'executive search firm advice',
  ],
  alternates: {
    canonical: 'https://startingmonday.app/blog',
  },
  openGraph: {
    title: 'Blog - Starting Monday',
    description: 'Practical guidance for VP and C-suite technology executives in active search, and the coaches, search firms, and advisors who work with them.',
    url: 'https://startingmonday.app/blog',
    type: 'website',
  },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const INTERMEDIARY_SLUGS = new Set([
  'executive-coaching-candidate-infrastructure',
  'retained-search-candidate-preparation',
  'technology-executive-transition-chro',
])

const blogIndexJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Starting Monday Blog',
  url: 'https://startingmonday.app/blog',
  description: 'Practical guidance for VP and C-suite technology executives in active search.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Starting Monday',
    url: 'https://startingmonday.app',
  },
  about: ['Executive search', 'C-suite transitions', 'Career strategy'],
}

export default function BlogIndexPage() {
  const executivePosts = BLOG_POSTS.filter(p => !INTERMEDIARY_SLUGS.has(p.slug))
  const intermediaryPosts = BLOG_POSTS.filter(p => INTERMEDIARY_SLUGS.has(p.slug))

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <JsonLd data={blogIndexJsonLd} />

              {/* Nav */}
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-200 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="hidden sm:inline text-[13px] text-slate-300">Partners</span>
            <span className="hidden sm:inline text-[13px] text-slate-300">Free Profile Grade</span>
            <Link href="/login" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[13px] font-semibold text-slate-950 bg-slate-100 px-4 py-1.5 rounded hover:bg-white transition-colors"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-500 mb-4">
            Starting Monday
          </p>
          <h1 className="text-[34px] sm:text-[42px] font-bold text-white leading-tight mb-4">
            The executive search brief.
          </h1>
          <p className="text-[16px] text-slate-200 leading-relaxed max-w-xl">
            Practical guidance for C-suite technology executives in active search, and the coaches, search firms, and advisors who work with them.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/demo" className="inline-block bg-orange-500 hover:bg-orange-600 text-slate-900 text-[13px] font-semibold px-5 py-2.5 rounded transition-colors">
              See a live prep brief &rarr;
            </Link>

          </div>
        </div>
      </header>

      {/* Executive post list */}
      <section className="px-4 sm:px-6 py-14 sm:py-16 border-t border-slate-900 bg-slate-900/40">
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] text-slate-300 mb-5 leading-relaxed">
            Every article should help you decide whether Starting Monday solves your next step. If the post is useful, the next click should be the demo or the pricing page, not another blog post.
          </p>
          <div className="mb-6 flex items-center gap-5 text-[13px] text-slate-300">
            <span>Navigate to topic pages:</span>
            <Link href="/for-coaches" className="text-slate-100 underline decoration-slate-500 underline-offset-2 hover:text-white">
              Coaches
            </Link>
            <Link href="/partners" className="text-slate-100 underline decoration-slate-500 underline-offset-2 hover:text-white">
              Partners
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {executivePosts.map(post => (
              <article key={post.slug} className="py-9 first:pt-0">
                <p className="text-[12px] text-slate-400 mb-3">
                  {formatDate(post.date)} &middot; {post.readTime}
                </p>
                <h2 className="text-[22px] font-bold text-white leading-snug mb-3">{post.title}</h2>
                <p className="text-[15px] text-slate-300 leading-relaxed mb-4">
                  {post.description}
                </p>
                <Link href={`/blog/${post.slug}`} className="text-[13px] font-semibold text-slate-100 hover:text-white transition-colors">
                  Article details &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Intermediary section */}
      <section className="px-4 sm:px-6 pb-14 sm:pb-16 border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-3xl mx-auto pt-12">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-400 mb-8">
            For coaches, search firms, and advisors
          </p>
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/for-coaches" className="inline-block bg-slate-950 hover:bg-slate-700 text-white text-[13px] font-semibold px-5 py-2.5 rounded transition-colors">
              Coach guide &rarr;
            </Link>
            <Link href="/partners" className="inline-block border border-slate-600 hover:border-slate-400 text-slate-100 text-[13px] px-5 py-2.5 rounded transition-colors">
              Partner program &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {intermediaryPosts.map(post => (
              <article key={post.slug} className="py-9 first:pt-0">
                <p className="text-[12px] text-slate-400 mb-3">
                  {formatDate(post.date)} &middot; {post.readTime}
                </p>
                <h2 className="text-[22px] font-bold text-white leading-snug mb-3">{post.title}</h2>
                <p className="text-[15px] text-slate-300 leading-relaxed mb-4">
                  {post.description}
                </p>
                <Link href={`/blog/${post.slug}`} className="text-[13px] font-semibold text-slate-100 hover:text-white transition-colors">
                  Article details &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Blog chat */}
      <section className="px-4 sm:px-6 pb-10 border-t border-slate-800 bg-slate-950">
        <div className="max-w-3xl mx-auto pt-10">
          <BlogChat posts={BLOG_POSTS} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-800">
            <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200 hover:text-slate-200 transition-colors">
              <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
            </Link>
            <p className="text-[12px] text-slate-300">Free Profile Grade available in product navigation after login.</p>
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
