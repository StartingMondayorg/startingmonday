import { describe, expect, it } from 'vitest'
import sitemap from './sitemap'

describe('src/app/sitemap.ts', () => {
  it('includes key SEO routes with expected freshness and cadence', () => {
    const urls = sitemap()

    const security = urls.find((entry) => entry.url === 'https://startingmonday.app/security')
    expect(security).toBeDefined()
    expect(security?.changeFrequency).toBe('monthly')
    expect(security?.priority).toBe(0.55)

    const originPost = urls.find((entry) => entry.url === 'https://startingmonday.app/blog/why-starting-monday-exists')
    expect(originPost).toBeDefined()
    expect(originPost?.changeFrequency).toBe('monthly')
    expect(originPost?.priority).toBe(0.75)

    expect(security?.lastModified).toBeInstanceOf(Date)
    expect(originPost?.lastModified).toBeInstanceOf(Date)
  })

  it('excludes redirect-only aliases and protected application routes', () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname)

    expect(paths).not.toContain('/evidence-room')
    expect(paths).not.toContain('/for-search-firms')
    expect(paths).not.toContain('/guide')
    expect(paths.some((path) => path === '/dashboard' || path.startsWith('/dashboard/'))).toBe(false)
    expect(paths.some((path) => path === '/settings' || path.startsWith('/settings/'))).toBe(false)
  })
})
