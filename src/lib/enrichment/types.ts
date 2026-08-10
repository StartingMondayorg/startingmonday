export type SuggestedPerson = {
  name: string
  title: string
  reason: string
  source: 'anthropic' | 'apollo' | 'fallback'
  confidence: number
}

export type CompanyCandidate = {
  name: string
  sector: string
  why: string
  fit: number
  keySignals: string[]
  keyAttributes: string[]
  suggestedPeople: SuggestedPerson[]
}

export type EnrichmentContext = {
  companyName: string
  sector: string
  persona?: string
  // Optional company domain reserved for future provider-specific targeting.
  domain?: string
}

export interface EnrichmentProvider {
  readonly providerName: 'none'
  enrichPeople(context: EnrichmentContext): Promise<SuggestedPerson[]>
}
