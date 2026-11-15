import { describe, it, expect } from 'vitest'
import { normalizeEntityName, pickCikFromHits } from './fetch-sec-filings.js'

// SMK-509: hits shaped like the real EDGAR full-text search response (efts.sec.gov,
// checked 2026-11-14). There is no entity_name field; the filer is in display_names
// and ciks, and the _id prefix is the submitter of the accession, often a filing agent.
function hit(id, displayName, cik) {
  return { _id: id, _source: { display_names: [displayName], ciks: [cik] } }
}

describe('pickCikFromHits', () => {
  it('rejects a filing that only mentions "The Marshall Project" (filed by Ellington)', () => {
    const hits = [
      hit('0001560672-21-000004:directortransition.htm', 'Ellington Residential Mortgage REIT  (EARN)  (CIK 0001560672)', '0001560672'),
      hit('0000910521-18-000010:exhibit991.htm', 'DECKERS OUTDOOR CORP  (DECK)  (CIK 0000910521)', '0000910521'),
    ]
    expect(pickCikFromHits('The Marshall Project', hits)).toBeNull()
  })

  it('rejects "Scale AI" when the only filers are AMD and others that mention it', () => {
    const hits = [
      hit('0000002488-26-000045:pressrelease.htm', 'ADVANCED MICRO DEVICES INC  (AMD)  (CIK 0000002488)', '0000002488'),
      hit('0001171843-26-002636:exh_991.htm', 'Axe Compute Inc.  (AGPU)  (CIK 0001446159)', '0001446159'),
    ]
    expect(pickCikFromHits('Scale AI', hits)).toBeNull()
  })

  it('rejects "Compass Real Estate" when HF Foods files the mention', () => {
    const hits = [hit('0001680873-26-000010:ex99.htm', 'HF Foods Group Inc.  (HFFG)  (CIK 0001680873)', '0001680873')]
    expect(pickCikFromHits('Compass Real Estate', hits)).toBeNull()
  })

  it('never takes the CIK from the accession prefix (filing agent)', () => {
    // Toppan Merrill (0001104659) submitted this filing for Sanmina.
    const hits = [hit('0001104659-25-050437:tm2515499d1_ex99-2.htm', 'SANMINA CORP  (SANM)  (CIK 0000897723)', '0000897723')]
    expect(pickCikFromHits('Sanmina', hits)).toBe('0000897723')
    expect(pickCikFromHits('Toppan Merrill', hits)).toBeNull()
  })

  it('accepts the filer when its name matches after suffix and tag normalization', () => {
    const hits = [
      hit('0001193125-26-000001:d1.htm', 'Some Other Corp  (SOC)  (CIK 0000000001)', '0000000001'),
      hit('0000106640-26-000009:wh8k.htm', 'WHIRLPOOL CORP /DE/  (WHR)  (CIK 0000106640)', '0000106640'),
    ]
    expect(pickCikFromHits('Whirlpool Corporation', hits)).toBe('0000106640')
  })

  it('returns null for no hits or an empty name', () => {
    expect(pickCikFromHits('Apple', [])).toBeNull()
    expect(pickCikFromHits('', [hit('x', 'APPLE INC  (AAPL)  (CIK 0000320193)', '0000320193')])).toBeNull()
  })
})

describe('normalizeEntityName', () => {
  it.each([
    ['The Marshall Project', 'marshall project'],
    ['WHIRLPOOL CORP /DE/', 'whirlpool'],
    ['Salesforce, Inc.', 'salesforce'],
    ['PROCTER & GAMBLE Co', 'procter and gamble'],
    ['Procter & Gamble', 'procter and gamble'],
    ['ELI LILLY & Co', 'eli lilly'],
    ['Accenture plc', 'accenture'],
    ['Middleby Corporation', 'middleby'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeEntityName(input)).toBe(expected)
  })
})
