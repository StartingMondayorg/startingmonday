import { describe, expect, it } from 'vitest'
import { buildBrandMetadata } from './brand-metadata'
import { getBrandContextFromHost } from '@/lib/brand'

describe('root brand metadata', () => {
  it('uses the early-role tagline for Starting Monday previews', () => {
    const metadata = buildBrandMetadata(getBrandContextFromHost('startingmonday.app'))

    expect(metadata.title).toEqual({
      default: 'Starting Monday | Find roles before they are posted. Meet the decision-makers. Start Monday.',
      template: '%s - Starting Monday',
    })
    expect(metadata.description).toBe(
      'See likely-to-open executive roles early, identify the people shaping the shortlist, and know your next relationship action.',
    )
    expect(metadata.openGraph).toMatchObject({
      title: 'Starting Monday | Find roles before they are posted. Meet the decision-makers. Start Monday.',
      description:
        'See likely-to-open executive roles early, identify the people shaping the shortlist, and know your next relationship action.',
    })
    expect(metadata.twitter).toMatchObject({
      title: 'Starting Monday | Find roles before they are posted. Meet the decision-makers. Start Monday.',
      description:
        'See likely-to-open executive roles early, identify the people shaping the shortlist, and know your next relationship action.',
    })
  })

  it('keeps MandateSignal metadata separate', () => {
    const metadata = buildBrandMetadata(getBrandContextFromHost('mandatesignal.com'))

    expect(metadata.title).toEqual({
      default: 'MandateSignal - See mandates before they are posted',
      template: '%s - MandateSignal',
    })
    expect(metadata.openGraph).toMatchObject({
      siteName: 'MandateSignal',
      title: 'MandateSignal - See mandates before they are posted',
    })
  })
})
