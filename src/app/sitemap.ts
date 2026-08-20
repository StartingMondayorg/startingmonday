import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { isStartingMondayHeroEvidenceEnabled } from '@/lib/feature-flags'

const BASE = 'https://startingmonday.app'
const STATIC_LAST_MODIFIED = new Date('2026-07-03T00:00:00.000Z')

const CORE_PAGES = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/executives', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/executives/active', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/executives/passive', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/executives/personas', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/coaches', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/coaches/personas', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/outplacement', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/outplacement/personas', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/search-firms/personas', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/references', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/method-and-evidence', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/evidence-hub', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/case-studies', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/pilot-findings', changeFrequency: 'monthly' as const, priority: 0.65 },
  { path: '/founder-note', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/annual-report-2026', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/annual-report-2026/executive-search-ai-confidentiality', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/research-brief', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/demo', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/optimize', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/concierge', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/partners', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/partners/reporting', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/security', changeFrequency: 'monthly' as const, priority: 0.55 },
  { path: '/blog/why-starting-monday-exists', changeFrequency: 'monthly' as const, priority: 0.75 },
]

const ROLE_PAGES = [
  { path: '/for-cio', priority: 0.75 },
  { path: '/for-coo', priority: 0.65 },
  { path: '/for-cdo', priority: 0.65 },
  { path: '/for-ciso', priority: 0.65 },
  { path: '/for-cpo', priority: 0.65 },
  { path: '/for-data-officer', priority: 0.65 },
  { path: '/for-leaders', priority: 0.65 },
  { path: '/for-executives', priority: 0.7 },
  { path: '/for-executives/leadership', priority: 0.65 },
].map(page => ({ ...page, changeFrequency: 'monthly' as const }))

const PARTNER_AND_RESOURCE_PAGES = [
  { path: '/coaches-guide', priority: 0.65 },
  { path: '/evaluate', priority: 0.65 },
  { path: '/for-cio-associations', priority: 0.6 },
  { path: '/for-coaches', priority: 0.7 },
  { path: '/for-coaches/faq', priority: 0.55 },
  { path: '/for-coaches/economics', priority: 0.55 },
  { path: '/for-coaches/trust-pack', priority: 0.55 },
  { path: '/for-financial-advisors', priority: 0.6 },
  { path: '/for-fractional-executives', priority: 0.6 },
  { path: '/for-media-partners', priority: 0.6 },
  { path: '/for-outplacement', priority: 0.7 },
  { path: '/for-outplacement/economics', priority: 0.55 },
  { path: '/for-outplacement/executive-summary', priority: 0.55 },
  { path: '/for-outplacement/faq', priority: 0.55 },
  { path: '/for-outplacement/metric-dictionary', priority: 0.55 },
  { path: '/for-outplacement/operating-scorecard', priority: 0.55 },
  { path: '/for-outplacement/runbook', priority: 0.55 },
  { path: '/for-outplacement/security-overview', priority: 0.55 },
  { path: '/for-outplacement/trust-pack', priority: 0.55 },
  { path: '/for-pe-partners', priority: 0.6 },
  { path: '/for-pe-teams', priority: 0.6 },
  { path: '/for-relocation', priority: 0.6 },
  { path: '/search-firms', priority: 0.6 },
  { path: '/search-firms/trust', priority: 0.45 },
  { path: '/search-firms/procurement', priority: 0.45 },
  { path: '/search-firms/sample-cfo-brief', priority: 0.5 },
].map(page => ({ ...page, changeFrequency: 'monthly' as const }))

const STATIC_PAGES = [...CORE_PAGES, ...ROLE_PAGES, ...PARTNER_AND_RESOURCE_PAGES]

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = isStartingMondayHeroEvidenceEnabled()
    ? [...STATIC_PAGES, { path: '/example', changeFrequency: 'monthly' as const, priority: 0.8 }]
    : STATIC_PAGES

  const staticPages: MetadataRoute.Sitemap = pages.map(page => ({
    url: `${BASE}${page.path}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages]
}

