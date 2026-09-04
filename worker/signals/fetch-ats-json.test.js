import { describe, it, expect } from 'vitest'
import { detectProviderFromUrl, candidateTokens, PROBE_PROVIDERS, providerSetMissing } from './fetch-ats-json.js'
import { ADAPTER_PROVIDERS } from '../scanner/ats-adapters.js'

// SMK-486: the poller's prober and the scanner's adapters must search the
// same provider set. A not_found recorded after searching fewer providers
// than the scanner recognizes overstates what was checked. This fails when
// either list gains a provider the other lacks.
describe('provider parity between prober and scanner adapters', () => {
  it('prober searches every provider the scanner adapters recognize', () => {
    expect([...PROBE_PROVIDERS].sort()).toEqual([...ADAPTER_PROVIDERS].sort())
  })

  it('neither list carries duplicates', () => {
    expect(new Set(PROBE_PROVIDERS).size).toBe(PROBE_PROVIDERS.length)
    expect(new Set(ADAPTER_PROVIDERS).size).toBe(ADAPTER_PROVIDERS.length)
  })
})

describe('providerSetMissing (re-probe-once gate)', () => {
  it('treats a null recorded set as outdated (rows predating recording)', () => {
    expect(providerSetMissing(null)).toBe(true)
    expect(providerSetMissing(undefined)).toBe(true)
  })

  it('treats the pre-widening three-provider set as outdated', () => {
    expect(providerSetMissing(['greenhouse', 'lever', 'ashby'])).toBe(true)
  })

  it('is satisfied by the current probe set, so a re-probe happens exactly once', () => {
    // After the one re-probe the row records PROBE_PROVIDERS; the gate then
    // stays closed until the provider list widens again.
    expect(providerSetMissing([...PROBE_PROVIDERS])).toBe(false)
    expect(providerSetMissing([...PROBE_PROVIDERS, 'somefutureprovider'])).toBe(false)
  })

  it('reopens when the current list gains a provider the record lacks', () => {
    expect(providerSetMissing([...PROBE_PROVIDERS], [...PROBE_PROVIDERS, 'icims'])).toBe(true)
  })
})

describe('detectProviderFromUrl', () => {
  it('detects greenhouse-hosted boards', () => {
    expect(detectProviderFromUrl('https://boards.greenhouse.io/stripe')).toEqual({
      provider: 'greenhouse',
      token: 'stripe',
    })
    expect(detectProviderFromUrl('https://job-boards.greenhouse.io/acme/jobs')).toEqual({
      provider: 'greenhouse',
      token: 'jobs',
    })
  })

  it('detects lever-hosted boards', () => {
    expect(detectProviderFromUrl('https://jobs.lever.co/netflix')).toEqual({
      provider: 'lever',
      token: 'netflix',
    })
  })

  it('detects ashby-hosted boards', () => {
    expect(detectProviderFromUrl('https://jobs.ashbyhq.com/linear')).toEqual({
      provider: 'ashby',
      token: 'linear',
    })
  })

  it('detects smartrecruiters-hosted boards', () => {
    expect(detectProviderFromUrl('https://careers.smartrecruiters.com/MastechDigital')).toEqual({
      provider: 'smartrecruiters',
      token: 'MastechDigital',
    })
    expect(detectProviderFromUrl('https://jobs.smartrecruiters.com/Acme/123-vp-eng')).toEqual({
      provider: 'smartrecruiters',
      token: 'Acme',
    })
  })

  it('detects bamboohr-hosted boards', () => {
    expect(detectProviderFromUrl('https://mylogically.bamboohr.com/careers')).toEqual({
      provider: 'bamboohr',
      token: 'mylogically',
    })
    expect(detectProviderFromUrl('https://www.bamboohr.com/careers')).toBeNull()
    expect(detectProviderFromUrl('https://bamboohr.com/careers')).toBeNull()
  })

  it('detects workday-hosted boards with a composite host/site token', () => {
    expect(detectProviderFromUrl('https://evolent.wd1.myworkdayjobs.com/External')).toEqual({
      provider: 'workday',
      token: 'evolent.wd1.myworkdayjobs.com/External',
    })
    // a leading locale segment is skipped when resolving the site
    expect(detectProviderFromUrl('https://acme.wd5.myworkdayjobs.com/en-US/Careers')).toEqual({
      provider: 'workday',
      token: 'acme.wd5.myworkdayjobs.com/Careers',
    })
    // no site segment -> cannot build a feed URL
    expect(detectProviderFromUrl('https://acme.wd5.myworkdayjobs.com/')).toBeNull()
  })

  it('returns null for non-ATS urls', () => {
    expect(detectProviderFromUrl('https://acme.com/careers')).toBeNull()
    expect(detectProviderFromUrl('not a url')).toBeNull()
    expect(detectProviderFromUrl(null)).toBeNull()
  })

  it('rejects spoofed hosts that embed ATS domains', () => {
    expect(detectProviderFromUrl('https://greenhouse.io.evil.com/acme')).toBeNull()
    expect(detectProviderFromUrl('https://evil-lever.co.attacker.net/acme')).toBeNull()
    expect(detectProviderFromUrl('https://notashbyhq.com/acme')).toBeNull()
    expect(detectProviderFromUrl('https://smartrecruiters.com.evil.com/Acme')).toBeNull()
    expect(detectProviderFromUrl('https://acme.bamboohr.com.evil.com/careers')).toBeNull()
    expect(detectProviderFromUrl('https://acme.wd1.myworkdayjobs.com.evil.com/External')).toBeNull()
  })
})

describe('candidateTokens', () => {
  it('prefers the domain label', () => {
    const tokens = candidateTokens({ name: 'Acme Corp', domain: 'acme.com' })
    expect(tokens[0]).toBe('acme')
  })

  it('strips corporate suffixes from names', () => {
    const tokens = candidateTokens({ name: 'Widget Works Inc.', domain: null })
    expect(tokens).toContain('widgetworks')
    expect(tokens).toContain('widget-works')
    expect(tokens.join(' ')).not.toContain('inc')
  })

  it('deduplicates and skips empty inputs', () => {
    expect(candidateTokens({ name: null, domain: null })).toEqual([])
    const tokens = candidateTokens({ name: 'Acme', domain: 'acme.io' })
    expect(new Set(tokens).size).toBe(tokens.length)
  })
})
