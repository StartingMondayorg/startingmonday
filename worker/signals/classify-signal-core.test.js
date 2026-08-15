import { describe, it, expect } from 'vitest'
import {
  CLASSIFY_MAX_TOKENS,
  classifyCompanyContext,
  buildClassifyPrompt,
  parseClassifyResponse,
  normalizeClassification,
} from './classify-signal-core.js'

const article = {
  title: 'Apex names new Chief Data Officer',
  description: 'Apex Inc announced a leadership appointment.',
  pubDate: '2026-07-01',
}

describe('classifyCompanyContext', () => {
  it('returns null when no usable fields exist', () => {
    expect(classifyCompanyContext(null)).toBeNull()
    expect(classifyCompanyContext({})).toBeNull()
    expect(classifyCompanyContext({ name: 'Apex' })).toBeNull()
  })

  it('extracts sector and public/private status', () => {
    expect(classifyCompanyContext({ sector: 'Healthcare', is_public_company: true })).toEqual({
      sector: 'Healthcare',
      isPublic: true,
    })
    expect(classifyCompanyContext({ sector: 'Fintech' })).toEqual({
      sector: 'Fintech',
      isPublic: null,
    })
  })
})

describe('buildClassifyPrompt', () => {
  it('includes the company context block for entity disambiguation', () => {
    const prompt = buildClassifyPrompt('Apex', article, 'cio', { sector: 'Healthcare', isPublic: true })
    expect(prompt).toContain('Company context')
    expect(prompt).toContain('Sector: Healthcare')
    expect(prompt).toContain('publicly traded')
  })

  it('renders private companies distinctly', () => {
    const prompt = buildClassifyPrompt('Apex', article, null, { sector: null, isPublic: false })
    expect(prompt).toContain('private company')
  })

  it('omits the context block when no context is available', () => {
    const prompt = buildClassifyPrompt('Apex', article, null, null)
    expect(prompt).not.toContain('Company context')
  })

  it('requests an entity_match field separate from confidence', () => {
    const prompt = buildClassifyPrompt('Apex', article, null, null)
    expect(prompt).toContain('"entity_match"')
    expect(prompt).toContain('similar name')
  })

  it('uses a token budget large enough to avoid truncation', () => {
    expect(CLASSIFY_MAX_TOKENS).toBeGreaterThanOrEqual(768)
  })
})

describe('parseClassifyResponse', () => {
  it('parses plain JSON', () => {
    expect(parseClassifyResponse('{"is_signal": true}')).toEqual({ is_signal: true })
  })

  it('strips markdown fences', () => {
    const fenced = '```json\n{"is_signal": false}\n```'
    expect(parseClassifyResponse(fenced)).toEqual({ is_signal: false })
  })

  it('parses the first balanced JSON object when the model adds trailing prose', () => {
    const response = '{"is_signal":true,"signal_summary":"Acme {North} hired a CIO"}\nI hope this helps.'
    expect(parseClassifyResponse(response)).toEqual({
      is_signal: true,
      signal_summary: 'Acme {North} hired a CIO',
    })
  })

  it('throws on empty responses instead of failing silently', () => {
    expect(() => parseClassifyResponse('')).toThrow()
    expect(() => parseClassifyResponse('   ')).toThrow()
  })

  it('throws on truncated JSON so the caller can retry', () => {
    expect(() => parseClassifyResponse('{"is_signal": true, "signal_ty')).toThrow()
  })
})

describe('normalizeClassification', () => {
  it('caps focus_tags, evidence_snippets, and partner_entities', () => {
    const normalized = normalizeClassification({
      is_signal: true,
      entity_match: 'high',
      focus_tags: ['a', 'b', 'c', 'd'],
      evidence_snippets: ['1', '2', '3'],
      partner_entities: ['w', 'x', 'y', 'z'],
    })
    expect(normalized.focus_tags).toHaveLength(3)
    expect(normalized.evidence_snippets).toHaveLength(2)
    expect(normalized.partner_entities).toHaveLength(3)
  })

  it('passes valid entity_match through and nulls invalid values', () => {
    expect(normalizeClassification({ entity_match: 'low' }).entity_match).toBe('low')
    expect(normalizeClassification({ entity_match: 'certain' }).entity_match).toBeNull()
    expect(normalizeClassification({}).entity_match).toBeNull()
  })

  it('defaults array fields when missing', () => {
    const normalized = normalizeClassification({ is_signal: false })
    expect(normalized.focus_tags).toEqual([])
    expect(normalized.evidence_snippets).toEqual([])
    expect(normalized.partner_entities).toEqual([])
  })
})
