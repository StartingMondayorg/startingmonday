import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/api/',
          '/guide',
          '/onboarding',
          '/settings',
          '/settings/',
          '/invite/',
          '/team/',
          '/unsubscribe/',
        ],
      },
    ],
    sitemap: 'https://startingmonday.app/sitemap.xml',
  }
}
