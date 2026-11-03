import type { Metadata } from 'next'
import type { BrandContext } from '@/lib/brand'

export function buildBrandMetadata(brand: BrandContext): Metadata {
  const title = 'Starting Monday | Find roles before they are posted. Meet the decision-makers. Start Monday.'
  const description = 'See likely-to-open executive roles early, identify the people shaping the shortlist, and know your next relationship action.'

  return {
    title: {
      default: title,
      template: `%s - ${brand.name}`,
    },
    description,
    keywords: [
      'executive job search',
      'CIO job search',
      'CTO job search',
      'AI career platform',
      'executive search tools',
      'technology executive career',
      'job search tracker executives',
      'VP CIO transition',
      'executive interview prep',
      'senior technology executive',
    ],
    metadataBase: new URL(brand.origin),
    alternates: {
      canonical: './',
    },
    icons: {
      icon: '/icon',
      shortcut: '/icon',
      apple: '/apple-icon',
    },
    openGraph: {
      title,
      description,
      siteName: brand.name,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@startingmonday',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
