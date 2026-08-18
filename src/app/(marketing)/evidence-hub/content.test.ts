import { describe, expect, it } from 'vitest'
import {
  ALL_EVIDENCE_SOURCES,
  EVIDENCE_SECTIONS,
  EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS,
  type EvidenceSection,
  type EvidenceSource,
} from './content'

const VALID_SOURCE_TYPES: EvidenceSource['type'][] = ['academic', 'business', 'book', 'internal']

function collectSources(sections: EvidenceSection[]): EvidenceSource[] {
  return sections.flatMap((section) => section.keyInsights.flatMap((insight) => insight.sources))
}

describe('evidence-hub content integrity', () => {
  it('exposes a non-empty section set', () => {
    expect(EVIDENCE_SECTIONS.length).toBeGreaterThan(0)
    expect(EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS.length).toBeGreaterThanOrEqual(EVIDENCE_SECTIONS.length)
  })

  it('gives every section a unique id and required editorial fields', () => {
    const ids = new Set<string>()
    for (const section of EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS) {
      expect(section.id, `section "${section.title}" missing id`).toBeTruthy()
      expect(ids.has(section.id), `duplicate section id: ${section.id}`).toBe(false)
      ids.add(section.id)

      expect(section.title.trim().length, `section ${section.id} missing title`).toBeGreaterThan(0)
      expect(section.subtitle.trim().length, `section ${section.id} missing subtitle`).toBeGreaterThan(0)
      expect(section.overview.trim().length, `section ${section.id} missing overview`).toBeGreaterThan(0)
      expect(section.whyItMatters.trim().length, `section ${section.id} missing whyItMatters`).toBeGreaterThan(0)
      expect(section.keyInsights.length, `section ${section.id} has no insights`).toBeGreaterThan(0)
    }
  })

  it('gives every insight a claim, implication, and at least one source', () => {
    for (const section of EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS) {
      for (const insight of section.keyInsights) {
        expect(insight.claim.trim().length, `insight in ${section.id} missing claim`).toBeGreaterThan(0)
        expect(insight.implication.trim().length, `insight in ${section.id} missing implication`).toBeGreaterThan(0)
        expect(insight.sources.length, `insight "${insight.claim}" has no sources`).toBeGreaterThan(0)
      }
    }
  })

  it('gives every cited source an id, a valid type, and a title', () => {
    for (const source of collectSources(EVIDENCE_SECTIONS_WITH_COACHING_TRANSITIONS)) {
      expect(source.id, 'source missing id').toBeTruthy()
      expect(VALID_SOURCE_TYPES, `source ${source.id} has invalid type "${source.type}"`).toContain(source.type)
      expect(source.title.trim().length, `source ${source.id} missing title`).toBeGreaterThan(0)
    }
  })

  it('keeps the ALL_EVIDENCE_SOURCES index free of duplicate ids', () => {
    const ids = ALL_EVIDENCE_SOURCES.map((source) => source.id)
    expect(new Set(ids).size, 'ALL_EVIDENCE_SOURCES contains duplicate ids').toBe(ids.length)
  })
})
