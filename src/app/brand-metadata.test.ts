import { describe, expect, it } from 'vitest'
import { STARTING_MONDAY_BRAND } from '@/lib/brand'
import { buildBrandMetadata } from './brand-metadata'

describe('src/app/brand-metadata.ts', () => {
  const metadata = buildBrandMetadata(STARTING_MONDAY_BRAND)

  it('titles every page with the Starting Monday brand', () => {
    expect(metadata.title).toEqual({
      default: 'Starting Monday | Find roles before they are posted. Meet the decision-makers. Start Monday.',
      template: '%s - Starting Monday',
    })
  })

  it('resolves relative URLs against startingmonday.app', () => {
    expect(metadata.metadataBase?.toString()).toBe('https://startingmonday.app/')
  })

  it('carries the brand into Open Graph and Twitter cards', () => {
    expect(metadata.openGraph).toMatchObject({ siteName: 'Starting Monday', type: 'website' })
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', site: '@startingmonday' })
  })
})
