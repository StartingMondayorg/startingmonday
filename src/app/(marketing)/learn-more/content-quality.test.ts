import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  BLUF_POINTS,
  COMMON_QUESTIONS,
  COMPARISON_ROWS,
  LEARN_MORE_CITATIONS,
  OBJECTIONS,
  SYSTEM_ARTICLE_SECTIONS,
  TARGETED_RELATIONSHIP_CARDS,
} from './content'

const ROOT = process.cwd()

const PAGE_FILES = [
  'src/app/(marketing)/learn-more/page.tsx',
  'src/app/(marketing)/learn-more/inside-the-system/page.tsx',
  'src/app/(marketing)/learn-more/objections/page.tsx',
  'src/app/(marketing)/learn-more/common-questions/page.tsx',
]

const SHELL_FILE = 'src/app/(marketing)/learn-more/shared.tsx'

const BANNED_COPY_PATTERNS = [
  /lorem ipsum/i,
  /todo/i,
  /coming soon/i,
  /placeholder/i,
  /tbd/i,
  /click here/i,
  /very unique/i,
  /revolutionary/i,
  /synergy/i,
]

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function getCitationIds(): Set<number> {
  return new Set(LEARN_MORE_CITATIONS.map((citation) => citation.id))
}

function getContentBlocks(): Array<{ text: string; citations: number[] }> {
  return [
    ...BLUF_POINTS.map((item) => ({ text: `${item.title} ${item.body}`, citations: item.citations ?? [] })),
    ...COMPARISON_ROWS.map((item) => ({ text: `${item.area} ${item.typical} ${item.startingMonday}`, citations: item.citations ?? [] })),
    ...TARGETED_RELATIONSHIP_CARDS.map((item) => ({ text: `${item.title} ${item.body}`, citations: item.citations ?? [] })),
    ...SYSTEM_ARTICLE_SECTIONS.map((item) => ({ text: `${item.title} ${item.body}`, citations: item.citations ?? [] })),
    ...OBJECTIONS.map((item) => ({ text: `${item.question} ${item.answer}`, citations: item.citations ?? [] })),
    ...COMMON_QUESTIONS.map((item) => ({ text: `${item.question} ${item.answer}`, citations: item.citations ?? [] })),
  ]
}

describe('learn-more copy relevance and proof discipline', () => {
  it('keeps every content block substantive and citation-backed', () => {
    const validCitationIds = getCitationIds()

    for (const block of getContentBlocks()) {
      const wordCount = block.text.trim().split(/\s+/).length

      expect(wordCount, `content block too thin: ${block.text}`).toBeGreaterThanOrEqual(8)
      expect(wordCount, `content block too long: ${block.text}`).toBeLessThanOrEqual(65)
      expect(block.citations.length, `missing citations: ${block.text}`).toBeGreaterThan(0)

      for (const pattern of BANNED_COPY_PATTERNS) {
        expect(pattern.test(block.text), `banned filler pattern matched: ${block.text}`).toBe(false)
      }

      for (const citationId of block.citations) {
        expect(validCitationIds.has(citationId), `unknown citation id ${citationId}`).toBe(true)
      }
    }
  })

  it('keeps citations unique, sequential, and source-linked', () => {
    const ids = LEARN_MORE_CITATIONS.map((citation) => citation.id)

    expect(ids).toEqual([...ids].sort((a, b) => a - b))
    expect(new Set(ids).size).toBe(ids.length)

    for (const citation of LEARN_MORE_CITATIONS) {
      expect(citation.claim.trim().length).toBeGreaterThan(20)
      expect(citation.source.trim().length).toBeGreaterThan(10)
      expect(citation.href.startsWith('/')).toBe(true)
    }
  })
})

describe('learn-more brand and production readiness markers', () => {
  it('uses the shared shell and the standard theme tokens', () => {
    const shellContent = read(SHELL_FILE)

    expect(shellContent.includes('PublicPageHeader')).toBe(true)
    expect(shellContent.includes('SiteFooter')).toBe(true)
    // The shell used to pin bg-slate-950 + text-orange-200. It now states the
    // same thing in tokens: the page surface and the brand accent.
    expect(shellContent.includes('bg-background')).toBe(true)
    expect(shellContent.includes('text-primary')).toBe(true)
  })

  it('marks each page with one h1, canonical metadata, and no internal leak strings', () => {
    for (const relativePath of PAGE_FILES) {
      const content = read(relativePath)
      const h1Count = (content.match(/<h1[\s>]/g) || []).length

      expect(h1Count, `${relativePath} should contain exactly one h1`).toBe(1)
      expect(content.includes('canonical:'), `${relativePath} missing canonical metadata`).toBe(true)
      expect(/tmp-run-|workspaceStorage|artifacts\/|docs\//i.test(content), `${relativePath} leaks internal strings`).toBe(false)
    }
  })

  it('keeps explicit learn-more CTA repetition bounded in the authored content', () => {
    const allText = getContentBlocks().map((block) => block.text).join(' ')
    const learnMoreCount = (allText.match(/learn more/gi) || []).length

    expect(learnMoreCount).toBeLessThanOrEqual(2)
  })
})
