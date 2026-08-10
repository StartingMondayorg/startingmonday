import type { EnrichmentContext, EnrichmentProvider, SuggestedPerson } from './types'

class NoopEnrichmentProvider implements EnrichmentProvider {
  readonly providerName = 'none' as const

  async enrichPeople(_context: EnrichmentContext): Promise<SuggestedPerson[]> {
    return []
  }
}

export function getEnrichmentProvider(): EnrichmentProvider {
  return new NoopEnrichmentProvider()
}

export * from './types'
