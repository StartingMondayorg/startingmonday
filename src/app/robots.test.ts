import { describe, expect, it } from 'vitest'
import robots from './robots'

describe('src/app/robots.ts', () => {
  it('blocks exact and nested private application routes', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow]

    expect(disallow).toEqual(expect.arrayContaining([
      '/dashboard',
      '/dashboard/',
      '/guide',
      '/onboarding',
      '/settings',
      '/settings/',
    ]))
    expect(result.sitemap).toBe('https://startingmonday.app/sitemap.xml')
  })
})
