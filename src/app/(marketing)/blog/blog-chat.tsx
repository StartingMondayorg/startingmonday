'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { BlogPostMeta } from '@/lib/blog-posts'
import { Button, Card, Input } from '@/components/ui'
type Result = {
  slug: string
  title: string
  description: string
}

function buildAnswer(query: string, results: Result[]): string {
  if (results.length === 0) {
    return `I could not find a close match for "${query}" yet. Try keywords like signals, prep briefs, outreach, coaching workflow, pricing, or executive search.`
  }

  const top = results.slice(0, 3)
  const summary = top.map((item) => item.description).join(' ')
  return `Starting Monday helps by combining signal visibility, prep briefs, and follow-through in one operating flow. Based on your question, here is the best-fit guidance: ${summary}`
}

function rankPosts(query: string, posts: BlogPostMeta[]): Result[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const terms = q.split(/\s+/).filter(t => t.length > 2)
  if (terms.length === 0) return []

  const scored = posts.map(post => {
    const haystack = `${post.title} ${post.description} ${(post.keywords ?? []).join(' ')}`.toLowerCase()
    const score = terms.reduce((acc, term) => {
      const inTitle = post.title.toLowerCase().includes(term) ? 3 : 0
      const inDesc = post.description.toLowerCase().includes(term) ? 2 : 0
      const inKeywords = (post.keywords ?? []).some((k: string) => k.toLowerCase().includes(term)) ? 1 : 0
      const inBody = haystack.includes(term) ? 1 : 0
      return acc + inTitle + inDesc + inKeywords + inBody
    }, 0)
    return { post, score }
  })

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ post }) => ({ slug: post.slug, title: post.title, description: post.description }))
}

export function BlogChat({
  posts,
  title = 'Ask the blog',
  description = 'Ask a question and find the most relevant articles and guides.',
  placeholder = 'e.g. How do I get in front of a search firm?',
  answerMode = false,
  showResultLinks = true,
  showGuideCta = false,
  guideCtaHref = '/guide',
  guideCtaLabel = 'Open guide and guide chat',
}: {
  posts: BlogPostMeta[]
  title?: string
  description?: string
  placeholder?: string
  answerMode?: boolean
  showResultLinks?: boolean
  showGuideCta?: boolean
  guideCtaHref?: string
  guideCtaLabel?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const [searched, setSearched] = useState(false)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const submittedQuery = String(new FormData(e.currentTarget).get('query') ?? '').trim()
    if (!submittedQuery) {
      setResults([])
      setSearched(true)
      return
    }

    const matches = rankPosts(submittedQuery, posts)
    setQuery(submittedQuery)
    setResults(matches)
    setSearched(true)
  }

  return (
    <Card variant="glass" className="p-5 sm:p-6">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-2">{title}</p>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
        {description}
      </p>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          name="query"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-border text-[14px] text-foreground placeholder:text-muted-foreground bg-background"
        />
        <Button
          type="submit"
          className="text-[13px] shrink-0"
        >
          Search
        </Button>
      </form>

      {searched && answerMode && results !== null && (
        <Card variant="glass" className="mb-4 p-4">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">Answer</p>
          <p className="text-[13px] text-foreground leading-relaxed">
            {buildAnswer(query.trim(), results)}
          </p>
        </Card>
      )}

      {searched && results !== null && (
        results.length > 0 && showResultLinks ? (
          <ul className="space-y-3">
            {results.map(r => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}`} className="group block">
                  <Card variant="glass" className="p-4 hover:border-border transition-colors">
                    <p className="text-[14px] font-semibold text-muted-foreground group-hover:text-foreground leading-snug mb-1">
                      {r.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                      {r.description}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !answerMode ? <p className="text-[13px] text-muted-foreground">No matching articles found. Try different keywords.</p> : null
        )
      )}

      {showGuideCta && (
        <div className="mt-4">
          <Button variant="outline" render={<Link href={guideCtaHref} />}>
            {guideCtaLabel}
          </Button>
        </div>
      )}
    </Card>
  )
}
